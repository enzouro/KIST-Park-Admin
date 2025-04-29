// eslint-disable
import { Box, Typography, Button } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomThemeProvider } from 'utils/customThemeProvider';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <CustomThemeProvider>
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
    >
      <Typography variant="h4" gutterBottom>
        Authorized Personnel Only
      </Typography>
      <Typography variant="body1" gutterBottom>
        If you're a <span style={{fontWeight: 700, color: '#005099'}}>'first time user'</span>, please contact the admin for access.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate('/login')}
        sx={{ mt: 2 }}
      >
        Back to Login
      </Button>
    </Box>
  </CustomThemeProvider>
  );
};
