import React, { useState, useCallback, ChangeEvent } from 'react';
import { Box, Typography, IconButton, CircularProgress, Tooltip, LinearProgress } from '@mui/material';
import { CloudUpload, Delete, Info, Compress } from '@mui/icons-material';

interface ImageUploaderProps {
  value: string;
  onChange: (imageUrl: string) => void;
  disabled?: boolean;
  maxFileSize?: number; // in bytes
  acceptedFormats?: string[]; // e.g. ['jpeg', 'png', 'gif']
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  value = '', 
  onChange,
  disabled = false,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  acceptedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp']
}) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>('');

  // Convert File to base64 - memoized for performance
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }, []);
  
  // Get file size from base64 string
  const getBase64FileSize = useCallback((base64String: string): number => {
    // Remove mime type and calculate size
    const base64 = base64String.split(',')[1];
    const stringLength = base64.length;
    // Base64 represents 6 bits per character, so 4 characters = 3 bytes
    return Math.round(stringLength * 0.75);
  }, []);

  // Format file size for display
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }, []);

  // Function to downscale image if it exceeds size limit
  const downscaleImageIfNeeded = useCallback(async (base64String: string): Promise<string> => {
    const fileSize = getBase64FileSize(base64String);
    
    // If file is under size limit, no need to downscale
    if (fileSize <= maxFileSize) {
      return base64String;
    }
    
    setIsProcessing(true);
    setProcessingMessage(`Image too large (${formatFileSize(fileSize)}). Downscaling...`);
    
    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Original dimensions
        let width = img.width;
        let height = img.height;
        let quality = 0.9;
        let iterations = 0;
        const maxIterations = 10;

        const downscale = () => {
          iterations++;
          
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          
          // Determine new dimensions - reduce by 10% each iteration
          if (iterations > 1) {
            width = Math.floor(width * 0.9);
            height = Math.floor(height * 0.9);
            quality = Math.max(0.5, quality - 0.1); // Reduce quality but not below 0.5
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas at new dimensions
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get image format from original file
          const imageFormat = base64String.split(';')[0].split('/')[1];
          
          // Convert to base64 with potentially reduced quality
          let newBase64 = canvas.toDataURL(`image/${imageFormat}`, quality);
          let newSize = getBase64FileSize(newBase64);
          
          setProcessingMessage(
            `Downscaling: ${formatFileSize(newSize)} (${Math.round(width)}x${Math.round(height)}, quality: ${Math.round(quality * 100)}%)`
          );
          
          // If size is still too large and we haven't hit max iterations, try again
          if (newSize > maxFileSize && iterations < maxIterations) {
            setTimeout(downscale, 0); // Use setTimeout to prevent stack overflow
          } else {
            setIsProcessing(false);
            if (newSize <= maxFileSize) {
              setProcessingMessage('');
              resolve(newBase64);
            } else {
              // We couldn't get it under the limit
              setProcessingMessage('');
              reject(new Error(`Could not reduce image below ${formatFileSize(maxFileSize)}`));
            }
          }
        };
        
        downscale();
      };
      
      img.onerror = () => {
        setIsProcessing(false);
        reject(new Error('Failed to load image for downscaling'));
      };
      
      img.src = base64String;
    });
  }, [maxFileSize, getBase64FileSize, formatFileSize]);

  // Validate file before upload
  const validateFile = useCallback((file: File): string | null => {
    // Validate file format
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!acceptedFormats.includes(fileExtension)) {
      return `Only ${acceptedFormats.join(', ')} files are accepted`;
    }
    
    return null;
  }, [acceptedFormats]);

  const handleImageChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Reset the file input value to allow selecting the same file again
      e.target.value = '';
      
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setTimeout(() => setError(null), 3000); // Clear error after 3 seconds
        return;
      }
      
      setError(null);
      setIsUploading(true);
      
      try {
        // Convert to base64
        const base64String = await fileToBase64(file);
        
        // Check if image needs downscaling and downscale if necessary
        let processedImage: string;
        try {
          processedImage = await downscaleImageIfNeeded(base64String);
        } catch (error) {
          if (error instanceof Error) {
            setError(error.message);
            setIsUploading(false);
            return;
          }
          setError('Failed to process image');
          setIsUploading(false);
          return;
        }
        
        // Simulate upload progress - in a real app, this would be tied to actual upload progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(progress);
          
          if (progress >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            setUploadProgress(0);
            
            // Update image
            onChange(processedImage);
          }
        }, 200);
      } catch (error) {
        console.error('Error processing file:', error);
        setError('Failed to process image');
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  }, [fileToBase64, downscaleImageIfNeeded, validateFile, onChange]);

  const handleRemoveImage = useCallback(() => {
    onChange('');
  }, [onChange]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1">
          Featured Image
        </Typography>
        
        <Tooltip title={`Accepted formats: ${acceptedFormats.join(', ')}. 
          Max size: ${formatFileSize(maxFileSize)}. 
          Large images will be automatically downscaled.`}>
          <Info fontSize="small" color="action" />
        </Tooltip>
      </Box>
      
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      {isProcessing && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" display="block" sx={{ color: 'primary.main' }}>
            <Compress fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            {processingMessage}
          </Typography>
          <LinearProgress sx={{ mt: 1 }} />
        </Box>
      )}
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {value ? (
          <Box sx={{ position: 'relative' }}>
            <img 
              src={value} 
              alt="Preview" 
              style={{ 
                width: 150, 
                height: 150, 
                objectFit: 'cover',
                borderRadius: 8,
                opacity: isUploading ? 0.5 : 1
              }}
            />
            {!disabled && (
              <IconButton
                size="small"
                sx={{ 
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.7)'
                  }
                }}
                onClick={handleRemoveImage}
                disabled={isUploading}
              >
                <Delete fontSize="small" />
              </IconButton>
            )}
            
            {isUploading && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}
              >
                <CircularProgress size={24} />
                <Box sx={{ width: '80%', mt: 1 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Box
            component="label"
            htmlFor="image-upload"
            sx={{
              width: 150,
              height: 150,
              border: '2px dashed #ccc',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: disabled ? 'default' : 'pointer',
              '&:hover': {
                borderColor: disabled ? '#ccc' : 'primary.main',
                backgroundColor: disabled ? 'transparent' : 'action.hover'
              }
            }}
          >
            {isUploading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CircularProgress size={24} />
                <Typography variant="caption" sx={{ mt: 1 }}>
                  {uploadProgress}%
                </Typography>
                <Box sx={{ width: '80%', mt: 1 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              </Box>
            ) : (
              <>
                <CloudUpload color={disabled ? 'disabled' : 'action'} />
                <Typography variant="caption" color={disabled ? 'text.disabled' : 'textSecondary'} sx={{ mt: 1 }}>
                  Upload Image
                </Typography>
              </>
            )}
            <input
              id="image-upload"
              type="file"
              accept={acceptedFormats.map(format => `image/${format}`).join(',')}
              onChange={handleImageChange}
              style={{ display: 'none' }}
              disabled={disabled || isUploading}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ImageUploader;