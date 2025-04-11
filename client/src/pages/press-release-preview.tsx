import { Box, Paper, Typography, ImageList, ImageListItem, CircularProgress, Stack, Link } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useShow } from '@pankod/refine-core';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface PressRelease {
  title: string;
  publisher: string;
  date: string;
  link: string;
  image: string[];
  createdAt: string;
  seq: number;
}

const PressReleasePreview = () => {
  const { id } = useParams();
  const { queryResult } = useShow({
    resource: 'press-release',
    id: id as string,
  });

  const { data, isLoading, isError } = queryResult;
  const pressRelease = data?.data as PressRelease;
  const ensureHttps = (url: string) => {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`;
  };  

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error">Error loading press release</Typography>
      </Box>
    );
  }

  const renderImages = () => {
    if (!pressRelease?.image?.length) return null;

    return (
      <Box sx={{ 
        width: '100%', 
        height: '400px',
        overflow: 'hidden',
        borderRadius: '8px',
      }}>
        <img
          src={pressRelease.image[0]}
          alt="Press Release"
          style={{ 
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </Box>
    );
  };

  return (
    <Paper
      elevation={3} 
      sx={{ 
        minHeight: '600px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        p: 4,
        maxWidth: '1000px',
        margin: '0 auto',
      }}>
      {/* Header Section */}
      <Box sx={{ 
        borderBottom: '1px solid #e0e0e0',
        pb: 2
      }}>
        <Typography 
          variant="h4" 
          sx={{
            fontFamily: 'Archivo',
            fontWeight: '800',
            color: '#003366',
            mb: 2
          }}
        >
          {pressRelease?.title}
        </Typography>

        <Stack direction="row" spacing={4} sx={{ color: '#666' }}>
          <Typography variant="subtitle1">
            <strong>Sequence:</strong> {pressRelease?.seq}
          </Typography>
          <Typography variant="subtitle1">
            <strong>Publisher:</strong> {pressRelease?.publisher}
          </Typography>
          <Typography variant="subtitle1">
            <strong>Date:</strong> {new Date(pressRelease?.date).toLocaleDateString()}
          </Typography>
        </Stack>
      </Box>

      {/* Image Section */}
      <Box sx={{ width: '100%' }}>
        {renderImages()}
      </Box>

      {/* Link Section */}
      <Box sx={{
        p: 3,
        backgroundColor: '#f8f8f8',
        borderRadius: '8px',
        mt: 2
      }}>
        <Typography variant="h6" sx={{ mb: 2 }}>External Link</Typography>
            {pressRelease?.link ? (
                <Link 
                    href={ensureHttps(pressRelease.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                        color: '#0066cc',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        '&:hover': {
                        textDecoration: 'underline',
                        color: '#004499'
                        }
                    }}
                    >
                    <OpenInNewIcon sx={{ fontSize: 16 }} />
                    {pressRelease.link}
                    </Link>
                ) : (
                    <Typography color="text.secondary">No link available</Typography>
                )}
      </Box>

      {/* Metadata Footer */}
      <Box sx={{
        mt: 'auto',
        pt: 2,
        borderTop: '1px solid #e0e0e0',
        color: '#666'
      }}>
        <Typography variant="body2">
          Created: {new Date(pressRelease?.createdAt).toLocaleDateString()}
        </Typography>
      </Box>
    </Paper>
  );
};

export default PressReleasePreview;