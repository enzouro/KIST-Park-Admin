// eslint-disable
import { Box, Typography, Button } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomThemeProvider } from 'utils/customThemeProvider';


export const SessionExpired: React.FC = () => {
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
        Session Expired
      </Typography>
      <Typography variant="body1" gutterBottom sx={{ textAlign: 'center' }}>
      Your session has expired due to inactivity. To protect your account security, you've been automatically logged out. <br/>
      Please log in again to continue using the application.
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
