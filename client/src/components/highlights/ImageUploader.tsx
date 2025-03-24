import React, { useState, ChangeEvent } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Button,
  Card,
  CardMedia,
  CardActions,
  Chip,
  LinearProgress
} from '@mui/material';
import { 
  CloudUpload,
  Delete,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';

// Define interface for uploaded image
interface UploadedImage {
  id: string;
  name: string;
  size: number;
  url: string;
  file: File;
}

interface ImageUploaderProps {
  value: string[];  // Simplified to just handle string arrays
  onChange: (images: string[]) => void;
}


const ImageUploader: React.FC<ImageUploaderProps> = ({ value = [], onChange }) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
   // Convert File to base64
   const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };
  
  // Handle file selection
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);
      
      try {
        const base64String = await fileToBase64(file);
        
        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(progress);
          
          if (progress >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            setUploadProgress(0);
            
            // Make sure we're passing an array of strings
            const newImages = [...value, base64String];
            onChange(newImages);
            
            // Log for debugging
            console.log('Updated images:', newImages);
          }
        }, 200);
      } catch (error) {
        console.error('Error converting file:', error);
        setIsUploading(false);
      }
    }
  };
  
  // Handle image removal
  const handleRemoveImage = (index: number): void => {
    const newImages = value.filter((_, i) => i !== index);
    onChange(newImages);
  };
  
  // Handle image reordering
  const handleMoveImage = (index: number, direction: 'up' | 'down'): void => {
    const newImages = [...value];
    const temp = newImages[index];
    
    if (direction === 'up' && index > 0) {
      newImages[index] = newImages[index - 1];
      newImages[index - 1] = temp;
    } else if (direction === 'down' && index < newImages.length - 1) {
      newImages[index] = newImages[index + 1];
      newImages[index + 1] = temp;
    }
    
    onChange(newImages);
  };
  
  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle1" gutterBottom>
        Images ({value.length})
      </Typography>
      
      <input
        type="file"
        accept="image/*"
        id="image-upload"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 2 }}>
        {value.map((image, index) => (
          <Card 
            key={image} 
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
                {image.split('/').pop()}
              </Typography>
              <Chip 
                label={index === 0 ? "Featured Image" : `Image ${index + 1}`}
                color={index === 0 ? "primary" : "default"}
                size="small"
                sx={{ mt: 1, width: 'fit-content' }}
              />
            </Box>
            
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <IconButton 
                size="small" 
                onClick={() => handleMoveImage(index, 'up')}
                disabled={index === 0}
              >
                <ArrowUpward fontSize="small" />
              </IconButton>
              <IconButton 
                size="small"
                onClick={() => handleMoveImage(index, 'down')}
                disabled={index === value.length - 1}
              >
                <ArrowDownward fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                color="error" 
                onClick={() => handleRemoveImage(index)}
              >
                <Delete fontSize="small" />
              </IconButton>
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
          disabled={isUploading}
        >
          Upload New Image
        </Button>
      </label>
      
      {value.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          * The first image will be used as featured image. Drag images to reorder.
        </Typography>
      )}
    </Box>
  );
};

export default ImageUploader;