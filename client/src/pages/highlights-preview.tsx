import { useEffect, useState } from 'react';
import { Box, Paper, Typography, ImageList, ImageListItem, CircularProgress, Stack } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useGetIdentity, useShow } from '@pankod/refine-core';
import useDynamicHeight from 'hooks/useDynamicHeight';
import SDGImagesList from 'components/highlights/SDGImageList';
import RichTextViewer from 'components/highlights/RichTextViewer';

interface Highlight {
  title: string;
  images: string[];
  date: string;
  location: string;
  content: string;
  sdg: string[];
}

const HighlightsPreview = () => {
  const { id } = useParams();
  const { queryResult } = useShow({
    resource: 'highlights',
    id: id as string,
  });

  const { data, isLoading, isError } = queryResult;
  const highlight = data?.data as Highlight;

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
        <Typography color="error">Error loading highlight</Typography>
      </Box>
    );
  }


  //Rendering Images function
  const renderImages = () => {
    if (!highlight?.images?.length) return null;
  
    // Single image layout
    if (highlight.images.length === 1) {
      return (
        <ImageList sx={{ width: '100%', height: '100%', m: 0 }} cols={1} gap={0}>
          <ImageListItem sx={{ height: '100% !important' }}>
            <img
              src={highlight.images[0]}
              alt="Highlight"
              loading="lazy"
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </ImageListItem>
        </ImageList>
      );
    }
  
    // 2-5 images layout
    return (
      <Box sx={{ 
        width: '100%', 
        height: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: '80% 20%',
      }}>
        {/* Main large image */}
        <Box sx={{ 
          gridColumn: '1 / span 4',
          gridRow: '1',
          overflow: 'hidden'
        }}>
          <img
            src={highlight.images[0]}
            alt="Main"
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </Box>
  
        {/* Bottom row of smaller images */}
        <ImageList 
          sx={{ 
            width: '100%',
            height: '100%',
            gridColumn: '1 / span 4',
            gridRow: '2',
            m: 0,
            overflow: 'hidden'
          }}
          cols={highlight.images.length > 4 ? 4 : 3}
          rowHeight="auto"
          gap={8}
        >
          {highlight.images.slice(1).map((img, index) => (
            <ImageListItem 
              key={index}
              sx={{
                height: '100% !important',
                '& img': {
                  height: '100% !important'
                }
              }}
            >
              <img
                src={img}
                alt={`Additional ${index + 1}`}
                loading="lazy"
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </ImageListItem>
          ))}
        </ImageList>
      </Box>
    );
  };
  // End of rendering images funcitons

  //



  // Main Content
  return (
<Paper
    elevation={3} 
    sx={{ 
      minHeight: '800px',
      width: '100%',
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gridTemplateRows: 'auto auto auto auto', // Simplified row template
      gap: 2,
      p: 2,
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      {/* Title */}
      <Box sx={{ 
        gridColumn: 'span 4', 
        borderBottom: '1px solid #e0e0e0',
        mb: 1,
        p: 1 
      }}>
        <Typography variant="h5" sx={{
          fontFamily: 'Archivo',
          fontWeight: '800',
          color: '#003366'
        }}>{highlight?.title}</Typography>
      </Box>

      {/* Left Column Layout */}
      <Box sx={{
        gridColumn: 'span 2',
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        {/* Images */}
        <Box sx={{
          height: 'auto',
          overflow: 'hidden',
          borderRadius: '8px',
          boxShadow: '0 0 8px rgba(0,0,0,0.1)'
        }}>
          {renderImages()}
        </Box>

        {/* Date and Location */}
        {(highlight?.date || highlight?.location) && (
          <Box sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            borderRadius: '8px',
            bgcolor: '#f8f8f8'
          }}>
            {highlight?.date && (
              <Typography variant="subtitle1" fontWeight="bold">
                Date: {new Date(highlight.date).toLocaleDateString()}
              </Typography>
            )}
            {highlight?.location && (
              <Typography variant="subtitle1" fontWeight="bold">
                Location: {highlight.location}
              </Typography>
            )}
          </Box>
        )}

        {/* SDGs */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'start',
          p: 1,
          borderRadius: '8px',
          bgcolor: '#f8f8f8'
        }}>
          <SDGImagesList sdgs={highlight?.sdg || []} size={45} />
        </Box>
      </Box>

      {/* Content - Right side */}
      <Box sx={{
        gridColumn: '3 / span 2',
        gridRow: '2 / span 3',
        p: 2,
        borderRadius: '8px',
        minHeight: '400px',
        height: 'auto'
      }}>
        <RichTextViewer content={highlight?.content || ''} />
      </Box>
    </Paper>
  );
};

export default HighlightsPreview;