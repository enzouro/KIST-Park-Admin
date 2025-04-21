import { 
    Card, 
    CardContent, 
    Typography, 
    Box,
  } from '@pankod/refine-mui';
  import { useState } from 'react';
  
  interface PressReleaseCardProps {
    pressRelease: {
      _id: string;
      title: string;
      publisher: string;
      date: string;
      link: string;
      image: string[];
      seq: number;
    };
    onView: () => void;
  }
  
  const PressReleaseCard = ({ pressRelease, onView }: PressReleaseCardProps) => {
    const [imageError, setImageError] = useState(false);
  
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString();
    };
  
    return (
      <Card 
        sx={{ 
          maxWidth: 450,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            boxShadow: 6,
            cursor: 'pointer'
          }
        }}
        onClick={onView}
      >
        <Box 
          sx={{ 
            height: 160, 
            overflow: 'hidden',
            backgroundColor: 'grey.100',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {pressRelease?.image?.[0] && !imageError ? (
            <img
              src={pressRelease.image[0]}
              alt={pressRelease.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={() => setImageError(true)}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              Image not available
            </Typography>
          )}
        </Box>
  
        <CardContent > 
          <Typography gutterBottom variant="h6" noWrap>
            {pressRelease.title}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 0.5 }}
            >
              {pressRelease.publisher}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
            >
              {formatDate(pressRelease.date)}
            </Typography>
          </Box>
          <Box >
            <Typography 
              variant="caption" 
              color="primary"
              sx={{ 
                textDecoration: 'underline',
                wordBreak: 'break-all'
              }}
            >
              {pressRelease.link}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };
  
  export default PressReleaseCard;