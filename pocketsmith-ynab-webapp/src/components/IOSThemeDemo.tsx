/**
 * iOS Theme Demo Component
 * Demonstrates the extended iOS theme system with design tokens
 */

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
  Grid,
  useTheme,
} from '@mui/material';
import { useIOSDesignTokens, useIOSStyles } from '../hooks/useIOSDesignTokens';

export const IOSThemeDemo: React.FC = () => {
  const theme = useTheme();
  const tokens = useIOSDesignTokens();
  const styles = useIOSStyles();

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="largeTitle" gutterBottom>
        iOS Theme System Demo
      </Typography>
      
      <Typography variant="body" sx={{ mb: 4, color: 'text.secondary' }}>
        Showcasing the extended iOS theme system with comprehensive design tokens,
        semantic colors, typography scale, and component styling.
      </Typography>

      {/* Colors Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="title2" gutterBottom>
            iOS Semantic Colors
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="headline" gutterBottom>System Colors</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  label="Blue" 
                  sx={{ 
                    backgroundColor: tokens.getColor('systemBlue'),
                    color: 'white'
                  }} 
                />
                <Chip 
                  label="Green" 
                  sx={{ 
                    backgroundColor: tokens.getColor('systemGreen'),
                    color: 'white'
                  }} 
                />
                <Chip 
                  label="Red" 
                  sx={{ 
                    backgroundColor: tokens.getColor('systemRed'),
                    color: 'white'
                  }} 
                />
                <Chip 
                  label="Orange" 
                  sx={{ 
                    backgroundColor: tokens.getColor('systemOrange'),
                    color: 'white'
                  }} 
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="headline" gutterBottom>Label Colors</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography sx={{ color: tokens.getColor('label') }}>
                  Primary Label
                </Typography>
                <Typography sx={{ color: tokens.getColor('secondaryLabel') }}>
                  Secondary Label
                </Typography>
                <Typography sx={{ color: tokens.getColor('tertiaryLabel') }}>
                  Tertiary Label
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Typography Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="title2" gutterBottom>
            iOS Typography Scale
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="largeTitle">Large Title (34px)</Typography>
            <Typography variant="title1">Title 1 (28px)</Typography>
            <Typography variant="title2">Title 2 (22px)</Typography>
            <Typography variant="title3">Title 3 (20px)</Typography>
            <Typography variant="headline">Headline (17px, Semibold)</Typography>
            <Typography variant="body">Body (17px, Regular)</Typography>
            <Typography variant="callout">Callout (16px, Regular)</Typography>
            <Typography variant="subheadline">Subheadline (15px, Regular)</Typography>
            <Typography variant="footnote">Footnote (13px, Regular)</Typography>
            <Typography variant="caption1">Caption 1 (12px, Regular)</Typography>
            <Typography variant="caption2">Caption 2 (11px, Regular)</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Components Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="title2" gutterBottom>
            iOS-Styled Components
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="headline" gutterBottom>Buttons</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" color="primary">
                Primary Button
              </Button>
              <Button variant="outlined" color="secondary">
                Secondary Button
              </Button>
              <Button variant="text" color="error">
                Destructive Action
              </Button>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="headline" gutterBottom>Cards with iOS Styling</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Paper sx={styles.card}>
                  <Typography variant="headline" gutterBottom>
                    iOS Card
                  </Typography>
                  <Typography variant="body" color="text.secondary">
                    This card uses iOS design tokens for border radius, shadows, and spacing.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper sx={styles.card}>
                  <Typography variant="headline" gutterBottom>
                    Another Card
                  </Typography>
                  <Typography variant="body" color="text.secondary">
                    Consistent styling across all cards using the design system.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="headline" gutterBottom>List Items</Typography>
            <Paper sx={{ borderRadius: tokens.getBorderRadius('lg') }}>
              <List>
                <ListItem sx={styles.listItem}>
                  <ListItemText 
                    primary="Account Settings"
                    secondary="Manage your account preferences"
                  />
                </ListItem>
                <ListItem sx={styles.listItem}>
                  <ListItemText 
                    primary="Sync Configuration"
                    secondary="Configure synchronization settings"
                  />
                </ListItem>
                <ListItem sx={styles.listItem}>
                  <ListItemText 
                    primary="Balance Comparison"
                    secondary="View balance discrepancies"
                  />
                </ListItem>
              </List>
            </Paper>
          </Box>
        </CardContent>
      </Card>

      {/* Design Tokens Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="title2" gutterBottom>
            Design Token Examples
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="headline" gutterBottom>Spacing</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ 
                  height: tokens.getSpacing('xs'), 
                  backgroundColor: 'primary.main',
                  borderRadius: 1
                }} />
                <Typography variant="caption1">XS: {tokens.getSpacing('xs')}</Typography>
                
                <Box sx={{ 
                  height: tokens.getSpacing('sm'), 
                  backgroundColor: 'primary.main',
                  borderRadius: 1
                }} />
                <Typography variant="caption1">SM: {tokens.getSpacing('sm')}</Typography>
                
                <Box sx={{ 
                  height: tokens.getSpacing('md'), 
                  backgroundColor: 'primary.main',
                  borderRadius: 1
                }} />
                <Typography variant="caption1">MD: {tokens.getSpacing('md')}</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="headline" gutterBottom>Border Radius</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ 
                  width: 60, 
                  height: 30, 
                  backgroundColor: 'secondary.main',
                  borderRadius: tokens.getBorderRadius('sm')
                }} />
                <Typography variant="caption1">SM: {tokens.getBorderRadius('sm')}</Typography>
                
                <Box sx={{ 
                  width: 60, 
                  height: 30, 
                  backgroundColor: 'secondary.main',
                  borderRadius: tokens.getBorderRadius('md')
                }} />
                <Typography variant="caption1">MD: {tokens.getBorderRadius('md')}</Typography>
                
                <Box sx={{ 
                  width: 60, 
                  height: 30, 
                  backgroundColor: 'secondary.main',
                  borderRadius: tokens.getBorderRadius('lg')
                }} />
                <Typography variant="caption1">LG: {tokens.getBorderRadius('lg')}</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="headline" gutterBottom>Shadows</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ 
                  width: 60, 
                  height: 30, 
                  backgroundColor: 'background.paper',
                  boxShadow: tokens.getShadow('sm'),
                  borderRadius: 1
                }} />
                <Typography variant="caption1">Small</Typography>
                
                <Box sx={{ 
                  width: 60, 
                  height: 30, 
                  backgroundColor: 'background.paper',
                  boxShadow: tokens.getShadow('md'),
                  borderRadius: 1
                }} />
                <Typography variant="caption1">Medium</Typography>
                
                <Box sx={{ 
                  width: 60, 
                  height: 30, 
                  backgroundColor: 'background.paper',
                  boxShadow: tokens.getShadow('lg'),
                  borderRadius: 1
                }} />
                <Typography variant="caption1">Large</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Theme Information */}
      <Card>
        <CardContent>
          <Typography variant="title2" gutterBottom>
            Current Theme Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="headline" gutterBottom>Theme Mode</Typography>
              <Chip 
                label={theme.palette.mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                color={theme.palette.mode === 'dark' ? 'secondary' : 'primary'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="headline" gutterBottom>Font Family</Typography>
              <Typography variant="body" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {theme.typography.fontFamily}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default IOSThemeDemo;