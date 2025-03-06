import React, { useContext } from 'react';
import { LayoutProps } from '@pankod/refine-core';
import { Box } from '@pankod/refine-mui';

import { ColorModeContext } from 'contexts'; // Import the context for dark/light mode
import { Sider as DefaultSider } from '../sider';
import { Header as DefaultHeader } from '../header';

export const Layout: React.FC<LayoutProps> = ({
  Sider,
  Header,
  Footer,
  OffLayoutArea,
  children,
}) => {
  const SiderToRender = Sider ?? DefaultSider;
  const HeaderToRender = Header ?? DefaultHeader;

  const { mode } = useContext(ColorModeContext); // Access the current theme mode

  return (
    <Box display="flex" flexDirection="row">
      <SiderToRender />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: '100vh',
          bgcolor: mode === 'dark' ? '#121212' : '#FFFFFF', // Dark mode background for the main container
        }}
      >
        <HeaderToRender />
        <Box
          component="main"
          sx={{
            p: { xs: 1, md: 2, lg: 3 },
            flexGrow: 1,
            bgcolor: mode === 'dark' ? '#1E1E1E' : '#F4F4F4', // Dark mode background for the content
            color: mode === 'dark' ? '#FFFFFF' : '#000000', // Text color for dark mode
            transition: 'background 0.3s ease, color 0.3s ease', // Smooth transitions for color changes
          }}
        >
          {children}
        </Box>
        {Footer && <Footer />}
      </Box>
      {OffLayoutArea && <OffLayoutArea />}
    </Box>
  );
};
