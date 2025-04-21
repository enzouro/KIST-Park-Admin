// customColor.ts
import { blue } from '@mui/material/colors';
import { createTheme, Theme } from '@mui/material/styles';


// Create theme factory function that accepts mode
export const createCustomTheme = (mode: 'light' | 'dark'): Theme => {
  return createTheme({
    palette: {
      mode: mode,
      primary: {
        main: blue[500],
      },
    },
  });
};