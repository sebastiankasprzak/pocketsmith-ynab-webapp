import React, { useState, useRef } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { 
  Dashboard, 
  Settings, 
  Person, 
  Notifications,
  Add,
  Share,
  MoreVert
} from '@mui/icons-material';
import { IOSNavigationBar } from './IOSNavigationBar';
import { IOSTabBar } from './IOSTabBar';
import { IOSActionSheet } from './IOSActionSheet';
import { IOSBottomSheet } from './IOSBottomSheet';
import { useIOSDetection } from '../hooks/useIOSDetection';

export const IOSNavigationDemo = () => {
  const { capabilities, shouldUseIOSExperience } = useIOSDetection();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <Dashboard />, badge: 3 },
    { id: 'settings', label: 'Settings', icon: <Settings /> },
    { id: 'profile', label: 'Profile', icon: <Person /> },
    { id: 'notifications', label: 'Notifications', icon: <Notifications />, badge: 12 },
  ];

  const actionSheetActions = [
    { label: 'Share', onPress: () => console.log('Share pressed') },
    { label: 'Export Data', onPress: () => console.log('Export pressed') },
    { label: 'Settings', onPress: () => console.log('Settings pressed') },
    { label: 'Delete', onPress: () => console.log('Delete pressed'), destructive: true },
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'settings': return 'Settings';
      case 'profile': return 'Profile';
      case 'notifications': return 'Notifications';
      default: return 'iOS Navigation Demo';
    }
  };

  const generateContent = () => {
    const items = [];
    for (let i = 1; i <= 50; i++) {
      items.push(
        <Box
          key={i}
          sx={{
            p: 2,
            mb: 1,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          <Typography variant="h6">Item {i}</Typography>
          <Typography variant="body2" color="text.secondary">
            This is sample content item {i} to demonstrate scrolling behavior
            and large title collapse functionality.
          </Typography>
        </Box>
      );
    }
    return items;
  };

  if (!shouldUseIOSExperience) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          iOS Navigation Demo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This demo is optimized for iOS devices. 
          Current device: {capabilities.isIOS ? 'iOS' : 'Non-iOS'}
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Device capabilities:
        </Typography>
        <pre style={{ textAlign: 'left', fontSize: '12px', marginTop: '16px' }}>
          {JSON.stringify(capabilities, null, 2)}
        </pre>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* iOS Navigation Bar */}
      <IOSNavigationBar
        title={getPageTitle()}
        large={true}
        scrollElement={scrollRef.current}
        rightAction={
          <Button
            onClick={() => setShowActionSheet(true)}
            sx={{ minWidth: 'auto', p: 1 }}
          >
            <MoreVert />
          </Button>
        }
      />

      {/* Content Area */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 2,
          pb: 10, // Space for tab bar
          backgroundColor: 'background.default',
        }}
      >
        <Box sx={{ py: 2 }}>
          <Typography variant="h6" gutterBottom>
            iOS Navigation Components Demo
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This demo showcases the iOS navigation components including:
          </Typography>
          <ul>
            <li>Large title navigation bar with scroll collapse</li>
            <li>iOS-style tab bar with badges</li>
            <li>Action sheets for contextual actions</li>
            <li>Bottom sheets for modal presentations</li>
          </ul>

          <Box sx={{ my: 3 }}>
            <Button
              variant="contained"
              onClick={() => setShowBottomSheet(true)}
              startIcon={<Add />}
              sx={{ mr: 2, mb: 2 }}
            >
              Show Bottom Sheet
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowActionSheet(true)}
              startIcon={<Share />}
              sx={{ mb: 2 }}
            >
              Show Action Sheet
            </Button>
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Scroll Content
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Scroll down to see the large title collapse into the navigation bar:
          </Typography>

          {generateContent()}
        </Box>
      </Box>

      {/* iOS Tab Bar */}
      <IOSTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="filled"
      />

      {/* Action Sheet */}
      <IOSActionSheet
        open={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title="Choose Action"
        message="Select an action to perform"
        actions={actionSheetActions}
      />

      {/* Bottom Sheet */}
      <IOSBottomSheet
        open={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        title="Bottom Sheet Demo"
        showHandle={true}
        showCloseButton={true}
        height="half"
      >
        <Box sx={{ py: 2 }}>
          <Typography variant="h6" gutterBottom>
            iOS Bottom Sheet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This is an iOS-style bottom sheet with:
          </Typography>
          <ul>
            <li>Swipe-to-dismiss gesture</li>
            <li>Backdrop blur effect</li>
            <li>Smooth animations</li>
            <li>Safe area handling</li>
          </ul>
          
          <Button
            variant="contained"
            onClick={() => setShowBottomSheet(false)}
            sx={{ mt: 2 }}
          >
            Close Sheet
          </Button>
        </Box>
      </IOSBottomSheet>
    </Box>
  );
};

export default IOSNavigationDemo;