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
  Info
} from '@mui/icons-material';

interface ImageUploaderProps {
  value: string[];  
  onChange: (images: string[]) => void;
  maxImages?: number;
  maxFileSize?: number; // in bytes
  acceptedFormats?: string[]; // e.g. ['jpeg', 'png', 'gif']
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  value = [], 
  onChange,
  maxImages = 10,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  acceptedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp']
}) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Convert File to base64 - memoized for performance
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }, []);
  
  // Validate file before upload
  const validateFile = useCallback((file: File): string | null => {
    if (value.length >= maxImages) {
      return `Maximum of ${maxImages} images allowed`;
    }
    
    if (file.size > maxFileSize) {
      return `File size exceeds maximum of ${formatFileSize(maxFileSize)}`;
    }
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!acceptedFormats.includes(fileExtension)) {
      return `Only ${acceptedFormats.join(', ')} files are accepted`;
    }
    
    return null;
  }, [value.length, maxImages, maxFileSize, acceptedFormats]);
  
  // Handle file selection
  const handleFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (e.target.files && e.target.files.length > 0) {
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
      
      setIsUploading(true);
      setError(null);
      
      try {
        const base64String = await fileToBase64(file);
        
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
            onChange([...value, base64String]);
          }
        }, 200);
      } catch (error) {
        console.error('Error processing file:', error);
        setError('Failed to process image');
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  }, [value, onChange, fileToBase64, validateFile]);
  
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
        
        <Tooltip title={`Accepted formats: ${acceptedFormats.join(', ')}. Max size: ${formatFileSize(maxFileSize)}`}>
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
          disabled={isUploading || value.length >= maxImages}
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