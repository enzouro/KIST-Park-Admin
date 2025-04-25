import { 
  Card, 
  CardContent, 
  Typography, 
  Chip,
  Box,
  useTheme,
  useMediaQuery
} from '@pankod/refine-mui';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface HighlightsCardProps {
  highlight: {
    _id: string;
    title: string;
    location: string;
    status: 'published' | 'draft' | 'rejected';
    images: string[];
    date: string | null;
    category?: {
      _id: string;
      category: string;
    };
    seq: number;
  };
  onView: () => void;
}

const HighlightsCard = ({ highlight, onView }: HighlightsCardProps) => {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date';
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
        {highlight?.images?.[0] && !imageError ? (
          <img
            src={highlight.images[0]}
            alt={highlight.title}
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
          {highlight.title}
        </Typography>
        <Box sx={{ mb: { xs: 1, sm: 2 } }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mb: 0.5 }}
          >
            {highlight.location || 'No location'}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
          >
            {formatDate(highlight.date)}
          </Typography>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          gap: 0.5,
          flexWrap: 'wrap'
        }}>
          <Chip
            label={highlight.status}
            size="small"
            color={
              highlight.status === 'published' ? 'success' :
              highlight.status === 'draft' ? 'warning' : 'error'
            }
            sx={{ height: 24 }}
          />
          {highlight.category && (
            <Chip
              label={highlight.category.category}
              size="small"
              variant="outlined"
              sx={{ 
                height: 24,
                maxWidth: { xs: '100%', sm: 'none' },
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default HighlightsCard;