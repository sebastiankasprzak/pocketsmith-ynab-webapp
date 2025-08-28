import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Breadcrumbs,
  Link,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AccountBalance,
  Dashboard as DashboardIcon,
  Sync,
  AccountTree,
  ExitToApp,
  Person,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from './UserProfile';

interface NavigationProps {
  children?: React.ReactNode;
}

export const Navigation: React.FC<NavigationProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  const handleSignOut = async () => {
    setMobileDrawerOpen(false);
    await signOut();
  };

  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileDrawerOpen(false);
  };

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/account-mappings', label: 'Account Mappings', icon: <AccountTree /> },
    { path: '/sync-status', label: 'Sync Status', icon: <Sync /> },
    { path: '/balance-comparison', label: 'Balance Comparison', icon: <AccountBalance /> },
  ];

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Dashboard', path: '/' }];

    if (pathSegments.length > 0) {
      const currentPath = `/${pathSegments.join('/')}`;
      const currentItem = navigationItems.find(item => item.path === currentPath);
      if (currentItem && currentItem.path !== '/') {
        breadcrumbs.push({ label: currentItem.label, path: currentItem.path });
      }
    }

    return breadcrumbs;
  };

  // Mobile drawer content
  const drawerContent = (
    <Box 
      sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }}
      role="navigation"
      aria-label="Main navigation menu"
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div" id="drawer-title">
          Menu
        </Typography>
        <IconButton 
          onClick={handleMobileDrawerToggle} 
          edge="end"
          aria-label="Close navigation menu"
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      
      <List 
        sx={{ flexGrow: 1 }}
        aria-labelledby="drawer-title"
      >
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleNavigate(item.path)}
              selected={location.pathname === item.path}
              aria-current={location.pathname === item.path ? 'page' : undefined}
              aria-label={`Navigate to ${item.label}`}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.light + '20',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light + '30',
                  },
                },
              }}
            >
              <ListItemIcon 
                sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}
                aria-hidden="true"
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                sx={{ 
                  '& .MuiListItemText-primary': {
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    color: location.pathname === item.path ? 'primary.main' : 'inherit',
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Signed in as:
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, fontWeight: 500 }}>
          {user?.email}
        </Typography>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<ExitToApp />}
          onClick={handleSignOut}
          color="primary"
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar position="static" elevation={1} id="navigation">
        <Toolbar>
          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleMobileDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            component="h1"
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            onClick={() => handleNavigate('/')}
            role="button"
            tabIndex={0}
            aria-label="Go to dashboard"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleNavigate('/');
              }
            }}
          >
            {isMobile ? 'PS-YNAB Sync' : 'PocketSmith-YNAB Sync Manager'}
          </Typography>

          {/* Desktop navigation */}
          <Box 
            sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}
            component="nav"
            role="navigation"
            aria-label="Main navigation"
          >
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                aria-current={location.pathname === item.path ? 'page' : undefined}
                aria-label={`Navigate to ${item.label}`}
                sx={{
                  backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Desktop user menu */}
          {!isMobile && <UserProfile />}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={handleMobileDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Breadcrumbs */}
      <Box sx={{ 
        px: { xs: 2, sm: 3 }, 
        py: 1, 
        backgroundColor: 'grey.50',
        display: { xs: 'none', sm: 'block' } // Hide breadcrumbs on mobile to save space
      }}>
        <Breadcrumbs aria-label="breadcrumb">
          {getBreadcrumbs().map((breadcrumb, index) => {
            const isLast = index === getBreadcrumbs().length - 1;
            return isLast ? (
              <Typography key={breadcrumb.path} color="text.primary">
                {breadcrumb.label}
              </Typography>
            ) : (
              <Link
                key={breadcrumb.path}
                component={RouterLink}
                to={breadcrumb.path}
                underline="hover"
                color="inherit"
              >
                {breadcrumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      </Box>

      {children}
    </>
  );
};