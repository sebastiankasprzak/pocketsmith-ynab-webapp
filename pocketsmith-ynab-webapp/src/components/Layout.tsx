import React from 'react';
import { Box, Container, useTheme, useMediaQuery } from '@mui/material';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ 
      flexGrow: 1, 
      minHeight: '100vh', 
      backgroundColor: 'background.default',
      width: '100%',
      overflow: 'hidden'
    }}>
      <Container 
        maxWidth="lg" 
        sx={{
          px: isMobile ? 1.5 : 3,
          py: isMobile ? 2 : 3,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      >
        {children}
      </Container>
    </Box>
  );
};