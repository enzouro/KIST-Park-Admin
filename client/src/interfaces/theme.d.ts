import '@pankod/refine-mui';

export interface CustomTheme {
  palette: {
    primary: {
      main: '#1976d2', // Medium blue
      light: '#42a5f5', // Light blue
      dark: '#0d47a1', // Dark blue
      contrastText: '#ffffff', // White text for contrast
    },
    // You can also customize other colors if needed
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#ffffff',
    },
    // Add more customizations as needed
  },
}


declare module '@pankod/refine-mui' {
  interface Theme extends import('@pankod/refine-mui').Theme, CustomTheme {}
  interface ThemeOptions
    extends import('@pankod/refine-mui').ThemeOptions,
      CustomTheme {}
}
