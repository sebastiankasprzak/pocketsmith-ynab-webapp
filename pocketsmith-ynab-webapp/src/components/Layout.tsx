import React from 'react';
import { Box, Container, useTheme, useMediaQuery } from '@mui/material';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Container 
        maxWidth="lg" 
        sx={{
          px: isMobile ? 2 : 3,
          py: isMobile ? 2 : 3,
        }}
      >
        {children}
      </Container>
    </Box>
  );
};