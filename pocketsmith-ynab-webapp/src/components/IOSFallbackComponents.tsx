import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  CircularProgress,
  Chip,
  Alert,
  AppBar,
  Toolbar,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Home,
  AccountBalance,
  CompareArrows,
  Sync,
  ArrowForwardIos,
} from '@mui/icons-material';

/**
 * Fallback components that provide standard Material-UI alternatives
 * when iOS-specific components fail to load or are unavailable
 */

// Fallback for IOSCard
export const StandardCard: React.FC<{
  children: React.ReactNode;
  elevated?: boolean;
  pressable?: boolean;
  onPress?: () => void;
}> = ({ children, elevated = false, pressable = false, onPress }) => (
  <Card
    elevation={elevated ? 4 : 1}
    sx={{
      cursor: pressable ? 'pointer' : 'default',
      transition: 'all 0.2s ease-in-out',
      '&:hover': pressable ? {
        elevation: elevated ? 6 : 3,
        transform: 'translateY(-1px)',
      } : {},
    }}
    onClick={onPress}
  >
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

// Fallback for IOSSection
export const StandardSection: React.FC<{
  title?: string;
  children: React.ReactNode;
  grouped?: boolean;
}> = ({ title, children, grouped = false }) => (
  <Box sx={{ mb: 3 }}>
    {title && (
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 2, 
          fontWeight: 600,
          color: 'text.primary'
        }}
      >
        {title}
      </Typography>
    )}
    <Box sx={{ 
      ...(grouped && {
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      })
    }}>
      {children}
    </Box>
  </Box>
);

// Fallback for IOSListItem
export const StandardListItem: React.FC<{
  primary: string;
  secondary?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  disclosure?: boolean;
  onPress?: () => void;
}> = ({ primary, secondary, icon, action, disclosure, onPress }) => (
  <ListItem
    {...(onPress && { button: true })}
    onClick={onPress}
    sx={{
      borderBottom: '1px solid',
      borderColor: 'divider',
      '&:last-child': {
        borderBottom: 'none',
      },
    }}
  >
    {icon && <ListItemIcon>{icon}</ListItemIcon>}
    <ListItemText 
      primary={primary} 
      secondary={secondary}
    />
    {action}
    {disclosure && <ArrowForwardIos sx={{ fontSize: 16, color: 'text.secondary' }} />}
  </ListItem>
);

// Fallback for IOSTextField
export const StandardTextField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
}> = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <TextField
    fullWidth
    label={label}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    type={type}
    variant="outlined"
    sx={{ mb: 2 }}
  />
);

// Fallback for IOSPicker
export const StandardPicker: React.FC<{
  options: Array<{label: string, value: string}>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ options, value, onChange, placeholder }) => (
  <FormControl fullWidth sx={{ mb: 2 }}>
    <InputLabel>{placeholder || 'Select an option'}</InputLabel>
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as string)}
      label={placeholder || 'Select an option'}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

// Fallback for IOSButton
export const StandardButton: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  disabled?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}> = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  onPress, 
  disabled,
  startIcon,
  endIcon 
}) => {
  const getVariant = () => {
    switch (variant) {
      case 'primary':
        return 'contained';
      case 'secondary':
        return 'outlined';
      case 'destructive':
        return 'contained';
      default:
        return 'contained';
    }
  };

  const getColor = () => {
    return variant === 'destructive' ? 'error' : 'primary';
  };

  return (
    <Button
      variant={getVariant()}
      color={getColor()}
      size={size}
      onClick={onPress}
      disabled={disabled}
      startIcon={startIcon}
      endIcon={endIcon}
      sx={{
        textTransform: 'none',
        fontWeight: 600,
      }}
    >
      {children}
    </Button>
  );
};

// Fallback for IOSProgressIndicator
export const StandardProgressIndicator: React.FC<{
  progress: number;
  style?: 'linear' | 'circular';
  size?: 'small' | 'medium' | 'large';
}> = ({ progress, style = 'linear', size = 'medium' }) => {
  if (style === 'circular') {
    const sizeMap = { small: 20, medium: 40, large: 60 };
    return (
      <CircularProgress 
        variant="determinate" 
        value={progress} 
        size={sizeMap[size]}
      />
    );
  }

  return (
    <LinearProgress 
      variant="determinate" 
      value={progress}
      sx={{ 
        height: size === 'small' ? 4 : size === 'large' ? 12 : 8,
        borderRadius: 2,
      }}
    />
  );
};

// Fallback for IOSStatusBadge
export const StandardStatusBadge: React.FC<{
  status: 'success' | 'warning' | 'error' | 'info';
  text: string;
}> = ({ status, text }) => {
  const getColor = () => {
    switch (status) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'info':
      default:
        return 'info';
    }
  };

  return (
    <Chip 
      label={text} 
      color={getColor()}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  );
};

// Fallback for IOSNavigationBar
export const StandardNavigationBar: React.FC<{
  title: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  large?: boolean;
}> = ({ title, leftAction, rightAction, large }) => (
  <AppBar position="static" elevation={1}>
    <Toolbar>
      {leftAction && (
        <Box sx={{ mr: 2 }}>
          {leftAction}
        </Box>
      )}
      <Typography 
        variant={large ? "h5" : "h6"} 
        component="h1" 
        sx={{ 
          flexGrow: 1,
          fontWeight: large ? 700 : 600,
        }}
      >
        {title}
      </Typography>
      {rightAction && (
        <Box sx={{ ml: 2 }}>
          {rightAction}
        </Box>
      )}
    </Toolbar>
  </AppBar>
);

// Fallback for IOSTabBar
export const StandardTabBar: React.FC<{
  tabs: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}> = ({ tabs, activeTab, onTabChange }) => (
  <BottomNavigation
    value={activeTab}
    onChange={(_, newValue) => onTabChange(newValue)}
    sx={{
      borderTop: '1px solid',
      borderColor: 'divider',
    }}
  >
    {tabs.map((tab) => (
      <BottomNavigationAction
        key={tab.id}
        label={tab.label}
        value={tab.id}
        icon={tab.icon}
      />
    ))}
  </BottomNavigation>
);

// Fallback for IOSToggle
export const StandardToggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ label, checked, onChange, disabled }) => (
  <FormControlLabel
    control={
      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
    }
    label={label}
  />
);

// Fallback for IOSNotification
export const StandardNotification: React.FC<{
  type: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
}> = ({ type, title, message, onClose }) => (
  <Alert 
    severity={type}
    onClose={onClose}
    sx={{ mb: 2 }}
  >
    {title && <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{title}</Typography>}
    {message}
  </Alert>
);

// Fallback for IOSLoadingStates
export const StandardLoadingSpinner: React.FC<{
  size?: 'small' | 'medium' | 'large';
  message?: string;
}> = ({ size = 'medium', message }) => {
  const sizeMap = { small: 20, medium: 40, large: 60 };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
      }}
    >
      <CircularProgress size={sizeMap[size]} />
      {message && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mt: 2 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

/**
 * Fallback component registry for easy lookup
 */
export const IOSFallbackRegistry = {
  IOSCard: StandardCard,
  IOSSection: StandardSection,
  IOSListItem: StandardListItem,
  IOSTextField: StandardTextField,
  IOSPicker: StandardPicker,
  IOSButton: StandardButton,
  IOSProgressIndicator: StandardProgressIndicator,
  IOSStatusBadge: StandardStatusBadge,
  IOSNavigationBar: StandardNavigationBar,
  IOSTabBar: StandardTabBar,
  IOSToggle: StandardToggle,
  IOSNotification: StandardNotification,
  IOSLoadingSpinner: StandardLoadingSpinner,
} as const;

export type IOSFallbackComponent = keyof typeof IOSFallbackRegistry;

/**
 * Helper function to get fallback component
 */
export const getFallbackComponent = (componentName: IOSFallbackComponent) => {
  return IOSFallbackRegistry[componentName];
};

export default IOSFallbackRegistry;