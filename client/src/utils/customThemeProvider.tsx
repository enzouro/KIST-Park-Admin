// CustomThemeProvider.tsx
import React, { PropsWithChildren, useContext } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { ColorModeContext } from 'contexts';
import { createCustomTheme } from './customColor';

export const CustomThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { mode } = useContext(ColorModeContext);
  
  // Create theme with current mode
  const customTheme = createCustomTheme(mode as 'light' | 'dark');
  
  return (
    <ThemeProvider theme={customTheme}>
      {children}
    </ThemeProvider>
  );
};