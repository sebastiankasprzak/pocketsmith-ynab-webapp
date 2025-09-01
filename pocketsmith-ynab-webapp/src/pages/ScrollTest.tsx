import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export const ScrollTest = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Scroll Test Page
      </Typography>
      <Typography variant="body1" gutterBottom>
        This page tests if scrolling works correctly after the iOS improvements.
        The content below should be scrollable in regular browsers.
      </Typography>
      
      {/* Generate enough content to require scrolling */}
      {Array.from({ length: 50 }, (_, index) => (
        <Paper 
          key={index} 
          sx={{ 
            p: 2, 
            mb: 2, 
            backgroundColor: index % 2 === 0 ? 'background.paper' : 'action.hover' 
          }}
        >
          <Typography variant="h6">
            Content Block {index + 1}
          </Typography>
          <Typography variant="body2">
            This is content block number {index + 1}. If scrolling is working correctly,
            you should be able to scroll through all 50 blocks. Each block contains some
            sample text to make the page long enough to test scrolling behavior.
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua.
          </Typography>
        </Paper>
      ))}
      
      <Paper sx={{ p: 2, backgroundColor: 'success.light' }}>
        <Typography variant="h6" color="success.contrastText">
          🎉 End of Content
        </Typography>
        <Typography variant="body2" color="success.contrastText">
          If you can see this message, scrolling is working correctly!
        </Typography>
      </Paper>
    </Box>
  );
};