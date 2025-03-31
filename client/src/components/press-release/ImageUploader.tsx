import React, { useState } from 'react';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import { CloudUpload, Delete } from '@mui/icons-material';

interface ImageUploaderProps {
  value: string;
  onChange: (imageUrl: string) => void;
  disabled?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  value = '', 
  onChange,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      
      try {
        // In a real implementation, you would upload to Cloudinary or your server here
        // This is just a mock implementation
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onloadend = () => {
          const result = reader.result as string;
          onChange(result);
          setIsUploading(false);
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error uploading image:', error);
        setIsUploading(false);
      }
    }
  };

  const handleRemoveImage = () => {
    onChange('');
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Featured Image
      </Typography>
      
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
                borderRadius: 1,
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
          </Box>
        ) : (
          <Box
            component="label"
            htmlFor="image-upload"
            sx={{
              width: 150,
              height: 150,
              border: '2px dashed #ccc',
              borderRadius: 1,
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
              <CircularProgress size={24} />
            ) : (
              <>
                <CloudUpload color={disabled ? 'disabled' : 'action'} />
                <Typography variant="caption" color={disabled ? 'text.disabled' : 'textSecondary'}>
                  Upload Image
                </Typography>
              </>
            )}
            <input
              id="image-upload"
              type="file"
              accept="image/*"
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