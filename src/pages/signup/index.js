import React from 'react';
import SignupEmailScreen from '../../components/signup/SignupEmailScreen';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container } from '@mui/material';
import Header from '../../components/common/Header';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1e8e3e',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

export default function SignupPage() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      <Container maxWidth="sm">
        <SignupEmailScreen />
      </Container>
    </ThemeProvider>
  );
}
