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
  // Allow both string arrays and UploadedImage arrays
  value: (string | UploadedImage)[];
  onChange: (images: (string | UploadedImage)[]) => void;
}


const ImageUploader: React.FC<ImageUploaderProps> = ({ value = [], onChange }) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const processedImages = value.map(img => {
    if (typeof img === 'string') {
      return {
        id: Date.now().toString(),
        name: img.split('/').pop() || 'image',
        size: 0,
        url: img,
        file: null
      };
    }
    return img;
  });
  
  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);
      
      // Create a preview URL
      const imageUrl = URL.createObjectURL(file);
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadProgress(0);
          
          // Add new image to the array
          const newImage: UploadedImage = {
            id: Date.now().toString(),
            name: file.name,
            size: file.size,
            url: imageUrl,
            file
          };
          
          onChange([...value, newImage]);
        }
      }, 200);
    }
  };
  
  // Handle image removal
  const handleRemoveImage = (id: string): void => {
    onChange(value.filter(img => (typeof img !== 'string' && img.id !== id)));
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
            key={typeof image === 'string' ? image : image.id} 
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
              image={typeof image === 'string' ? image : image.url}
              alt={typeof image === 'string' ? 'image' : image.name}
            />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <Typography variant="subtitle2" noWrap>
                {typeof image === 'string' ? image.split('/').pop() : image.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {typeof image !== 'string' && formatFileSize(image.size)}
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
                onClick={() => typeof image !== 'string' && handleRemoveImage(image.id)}
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