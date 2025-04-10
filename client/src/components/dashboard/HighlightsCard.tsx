import { 
  Card, 
  CardContent, 
  Typography, 
  Chip,
  Box,
} from '@pankod/refine-mui';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

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
  onView: () => void; // Add onView prop
}

const HighlightsCard = ({ highlight, onView }: HighlightsCardProps) => {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString();
  };

  const handleCardClick = () => {
    navigate(`/highlights-preview/${highlight._id}`); // Navigate to the preview page with the highlight ID
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: 6,
          cursor: 'pointer'
        }
      }}
      onClick={onView}// Add onClick handler
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

      <CardContent sx={{ flexGrow: 1 }}> 
        <Typography gutterBottom variant="h6" noWrap>
          {highlight.title}
        </Typography>
        <Box sx={{ mb: 2 }}>
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={highlight.status}
            size="small"
            color={
              highlight.status === 'published' ? 'success' :
              highlight.status === 'draft' ? 'warning' : 'error'
            }
          />
          {highlight.category && (
            <Chip
              label={highlight.category.category}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default HighlightsCard;