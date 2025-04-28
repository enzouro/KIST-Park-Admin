import React, { useState, ChangeEvent, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Button,
  Card,
  CardMedia,
  CardActions,
  Chip,
  LinearProgress,
  Tooltip
} from '@mui/material';
import { 
  CloudUpload,
  Delete,
  ArrowUpward,
  ArrowDownward,
  Info,
  Compress
} from '@mui/icons-material';

interface ImageUploaderProps {
  value: string[];  
  onChange: (images: string[]) => void;
  maxImages?: number;
  maxFileSize?: number; // in bytes
  acceptedFormats?: string[]; // e.g. ['jpeg', 'png', 'gif']
  preserveExisting?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  value = [], 
  onChange,
  maxImages = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp']
}) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
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

  // Function to downscale image if it exceeds size limit
  const downscaleImageIfNeeded = useCallback(async (base64String: string, fileName: string): Promise<string> => {
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
  }, [maxFileSize, getBase64FileSize]);
  
  // Validate file before upload
  const validateFile = useCallback((file: File): string | null => {
    if (value.length >= maxImages) {
      return `Maximum of ${maxImages} images allowed`;
    }
    
    // We'll handle size validation after potentially downscaling
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!acceptedFormats.includes(fileExtension)) {
      return `Only ${acceptedFormats.join(', ')} files are accepted`;
    }
    
    return null;
  }, [value.length, maxImages, acceptedFormats]);
  
  // Handle file selection
  const handleFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Reset the file input value to allow selecting the same file again
      e.target.value = '';
      // Validate file format
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setTimeout(() => setError(null), 3000); // Clear error after 3 seconds
        return;
      }
      
      setError(null);
      
      try {
        // Convert to base64
        const base64String = await fileToBase64(file);
        
        // Check if image needs downscaling and downscale if necessary
        let processedImage: string; // Explicitly typed as string
        try {
          processedImage = await downscaleImageIfNeeded(base64String, file.name);
        } catch (error) {
          if (error instanceof Error) {
            setError(error.message);
            return;
          }
          setError('Failed to process image');
          return;
        }
        
        // Start the upload simulation
        setIsUploading(true);

        const isExistingUrl = value.some(img => img === processedImage);
        if (isExistingUrl) {
          setError('This image is already uploaded');
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
            
            // Update images array
            onChange([...value, processedImage]);
          }
        }, 200);
      } catch (error) {
        console.error('Error processing file:', error);
        setError('Failed to process image');
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
    

  }, [value, onChange, fileToBase64, validateFile, downscaleImageIfNeeded]);
  
  // Handle image removal
  const handleRemoveImage = useCallback((index: number): void => {
    onChange(value.filter((_, i) => i !== index));
  }, [value, onChange]);
  
  // Handle image reordering with proper bounds checking
  const handleMoveImage = useCallback((index: number, direction: 'up' | 'down'): void => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === value.length - 1)) {
      return; // Already at the boundary
    }
    
    const newImages = [...value];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap the images
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    
    onChange(newImages);
  }, [value, onChange]);
  
  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Extract file name from base64 or URL
  const getFileName = (imageStr: string): string => {
    // For base64 strings, return a generic name
    if (imageStr.startsWith('data:')) {
      const imageType = imageStr.split(';')[0].split('/')[1];
      return `image.${imageType}`;
    }
    
    // For URLs, extract the file name
    return imageStr.split('/').pop() || 'image';
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">
          Images ({value.length}/{maxImages})
        </Typography>
        
        <Tooltip title={`Accepted formats: ${acceptedFormats.join(', ')}. 
          Max size: ${formatFileSize(maxFileSize)}. 
          Large images will be automatically downscaled.`}>
          <Info fontSize="small" color="action" />
        </Tooltip>
      </Box>
      
      <input
        type="file"
        accept={acceptedFormats.map(format => `image/${format}`).join(',')}
        id="image-upload"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      
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
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 2 }}>
        {value.map((image, index) => (
          <Card 
            key={`${index}-${image.substring(0, 20)}`} 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              p: 2,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardMedia
              component="img"
              sx={{ 
                width: 100, 
                height: 100, 
                objectFit: 'cover',
                borderRadius: 1,
                mr: 2
              }}
              image={image}
              alt={`Image ${index + 1}`}
            />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <Typography variant="subtitle2" noWrap>
                {getFileName(image)}
              </Typography>
              <Chip 
                label={index === 0 ? "Featured Image" : `Image ${index + 1}`}
                color={index === 0 ? "primary" : "default"}
                size="small"
                sx={{ mt: 1, width: 'fit-content' }}
              />
            </Box>
            
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Tooltip title="Move up">
                <span>
                  <IconButton 
                    size="small" 
                    onClick={() => handleMoveImage(index, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUpward fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Move down">
                <span>
                  <IconButton 
                    size="small"
                    onClick={() => handleMoveImage(index, 'down')}
                    disabled={index === value.length - 1}
                  >
                    <ArrowDownward fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Remove image">
                <IconButton 
                  size="small" 
                  color="error" 
                  onClick={() => handleRemoveImage(index)}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </CardActions>
          </Card>
        ))}
      </Box>
      
      {isUploading && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption">Uploading...</Typography>
          <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 1 }} />
        </Box>
      )}
      
      <label htmlFor="image-upload">
        <Button
          component="span"
          variant="outlined"
          startIcon={<CloudUpload />}
          sx={{ 
            mt: 2,
            borderStyle: 'dashed',
            borderWidth: 2,
            p: 1.5,
            width: '100%',
            borderRadius: 2
          }}
          disabled={isUploading || isProcessing || value.length >= maxImages}
        >
          {value.length >= maxImages ? 
            `Maximum of ${maxImages} images reached` : 
            'Upload New Image'
          }
        </Button>
      </label>
      
      {value.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          * The first image will be used as featured image. Use the arrows to reorder images.
        </Typography>
      )}
    </Box>
  );
};

export default ImageUploader;