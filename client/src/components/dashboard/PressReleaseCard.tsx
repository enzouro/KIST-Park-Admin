import { 
  Card, 
  CardContent, 
  Typography, 
  Box,
  useTheme,
  useMediaQuery
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: { xs: 'row', sm: 'column' },
        maxWidth: {xs: '272px', lg: '400px'},
        width: '100%',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: 6,
          cursor: 'pointer'
        }
      }}
      onClick={onView}
    >
      <Box 
        sx={{ 
          height: { xs: 'auto', sm: 160 },
          width: { xs: 120, sm: '100%' },
          minWidth: { xs: 120, sm: 'auto' },
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

      <CardContent sx={{ 
        flexGrow: 1,
        padding: { xs: 1.5, sm: 2 },
        '&:last-child': { paddingBottom: { xs: 1.5, sm: 2 } }
      }}> 
        <Typography 
          gutterBottom 
          variant={isMobile ? "subtitle1" : "h6"} 
          noWrap
          sx={{ mb: { xs: 0.5, sm: 1 } }}
        >
          {pressRelease.title}
        </Typography>
        
        <Box sx={{ mb: { xs: 1, sm: 2 } }}>
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
        
        <Box>
        <Typography 
          variant="caption" 
          color="primary"
          sx={{ 
            textDecoration: 'underline',
            wordBreak: 'break-all',
            maxWidth: '100%',
            display: '-webkit-box',
            WebkitLineClamp: { xs: 1, sm: 2 },
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
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