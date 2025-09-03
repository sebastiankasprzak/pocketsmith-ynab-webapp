import React, { useState } from 'react';
import { Box, Typography, Switch, FormControlLabel } from '@mui/material';
import { 
  Settings, 
  AccountBalance, 
  Sync, 
  Notifications,
  Person,
  Security,
  Help,
  Info,
  Email,
  Lock,
  Search,
  FilterList,
  Sort
} from '@mui/icons-material';
import { IOSButton } from '../components/IOSButton';
import { IOSCard } from '../components/IOSCard';
import { IOSSection } from '../components/IOSSection';
import { IOSListItem, createDeleteAction, createEditAction } from '../components/IOSListItem';
import { IOSTextField } from '../components/IOSTextField';
import { IOSPicker } from '../components/IOSPicker';
import { IOSSegmentedControl } from '../components/IOSSegmentedControl';
import { IOSToggle } from '../components/IOSToggle';

/**
 * Demo page showcasing all iOS components
 * This demonstrates the Core iOS Component Library functionality
 */
export const IOSComponentsDemo: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Form component states
  const [textValue, setTextValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOption, setSortOption] = useState('name');
  const [filterOption, setFilterOption] = useState('all');
  const [autoSync, setAutoSync] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [biometricAuth, setBiometricAuth] = useState(true);

  const handleAccountClick = (account: string) => {
    console.log(`Clicked account: ${account}`);
  };

  const handleDeleteAccount = (account: string) => {
    console.log(`Delete account: ${account}`);
  };

  const handleEditAccount = (account: string) => {
    console.log(`Edit account: ${account}`);
  };

  return (
    <Box sx={{ 
      backgroundColor: '#F2F2F7',
      minHeight: '100vh',
      paddingY: 2,
    }}>
      {/* Header */}
      <Box sx={{ paddingX: 2, marginBottom: 3 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700,
          fontSize: '34px',
          color: '#000000',
          marginBottom: 1,
        }}>
          iOS Components
        </Typography>
        <Typography variant="body1" sx={{ 
          color: 'rgba(60, 60, 67, 0.6)',
          fontSize: '17px',
        }}>
          Core iOS Component Library Demo
        </Typography>
      </Box>

      {/* Buttons Section */}
      <IOSSection title="Buttons" footer="Various button styles with haptic feedback and press animations">
        <Box sx={{ padding: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <IOSButton variant="primary" fullWidth>
            Primary Button
          </IOSButton>
          <IOSButton variant="secondary" fullWidth>
            Secondary Button
          </IOSButton>
          <IOSButton variant="destructive" fullWidth>
            Destructive Button
          </IOSButton>
          <IOSButton variant="plain" fullWidth>
            Plain Button
          </IOSButton>
          <IOSButton variant="filled" fullWidth>
            Filled Button
          </IOSButton>
          <IOSButton variant="tinted" fullWidth>
            Tinted Button
          </IOSButton>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IOSButton variant="primary" size="small">Small</IOSButton>
            <IOSButton variant="primary" size="medium">Medium</IOSButton>
            <IOSButton variant="primary" size="large">Large</IOSButton>
          </Box>
          
          <IOSButton variant="primary" disabled fullWidth>
            Disabled Button
          </IOSButton>
        </Box>
      </IOSSection>

      {/* Cards Section */}
      <IOSSection title="Cards" footer="Interactive cards with press animations and haptic feedback">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <IOSCard onClick={() => console.log('Card clicked')}>
            <Typography variant="h6" sx={{ marginBottom: 1 }}>
              Interactive Card
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This card responds to touch with animations and haptic feedback.
            </Typography>
          </IOSCard>

          <IOSCard elevated>
            <Typography variant="h6" sx={{ marginBottom: 1 }}>
              Elevated Card
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This card has enhanced shadow for emphasis.
            </Typography>
          </IOSCard>

          <IOSCard 
            onClick={() => console.log('Card with actions clicked')}
            actions={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IOSButton variant="plain" size="small">Cancel</IOSButton>
                <IOSButton variant="primary" size="small">Save</IOSButton>
              </Box>
            }
          >
            <Typography variant="h6" sx={{ marginBottom: 1 }}>
              Card with Actions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This card includes action buttons in the footer.
            </Typography>
          </IOSCard>
        </Box>
      </IOSSection>

      {/* Settings Section */}
      <IOSSection title="Settings" footer="List items with various configurations and interactions">
        <IOSListItem
          leftIcon={<Notifications sx={{ color: '#FF9500' }} />}
          rightContent={
            <Switch
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              size="small"
            />
          }
        >
          Notifications
        </IOSListItem>

        <IOSListItem
          leftIcon={<Settings sx={{ color: '#8E8E93' }} />}
          showDisclosure
          onClick={() => console.log('General settings clicked')}
        >
          General
        </IOSListItem>

        <IOSListItem
          leftIcon={<Security sx={{ color: '#007AFF' }} />}
          showDisclosure
          onClick={() => console.log('Privacy settings clicked')}
        >
          Privacy & Security
        </IOSListItem>

        <IOSListItem
          leftIcon={<Help sx={{ color: '#34C759' }} />}
          showDisclosure
          onClick={() => console.log('Help clicked')}
        >
          Help & Support
        </IOSListItem>
      </IOSSection>

      {/* Accounts Section with Swipe Actions */}
      <IOSSection 
        title="Accounts" 
        footer="Swipe left on items to reveal actions"
        headerAction={
          <IOSButton variant="plain" size="small">
            Add
          </IOSButton>
        }
      >
        <IOSListItem
          leftIcon={<AccountBalance sx={{ color: '#007AFF' }} />}
          subtitle="Connected • Last sync: 2 hours ago"
          showDisclosure
          onClick={() => handleAccountClick('Chase Checking')}
          swipeActions={[
            createEditAction(() => handleEditAccount('Chase Checking')),
            createDeleteAction(() => handleDeleteAccount('Chase Checking')),
          ]}
        >
          Chase Checking
        </IOSListItem>

        <IOSListItem
          leftIcon={<AccountBalance sx={{ color: '#FF3B30' }} />}
          subtitle="Sync error • Tap to reconnect"
          showDisclosure
          onClick={() => handleAccountClick('Wells Fargo Savings')}
          swipeActions={[
            createEditAction(() => handleEditAccount('Wells Fargo Savings')),
            createDeleteAction(() => handleDeleteAccount('Wells Fargo Savings')),
          ]}
        >
          Wells Fargo Savings
        </IOSListItem>

        <IOSListItem
          leftIcon={<AccountBalance sx={{ color: '#34C759' }} />}
          subtitle="Connected • Last sync: 5 minutes ago"
          showDisclosure
          onClick={() => handleAccountClick('Capital One Credit')}
          swipeActions={[
            createEditAction(() => handleEditAccount('Capital One Credit')),
            createDeleteAction(() => handleDeleteAccount('Capital One Credit')),
          ]}
        >
          Capital One Credit Card
        </IOSListItem>
      </IOSSection>

      {/* Profile Section */}
      <IOSSection title="Profile">
        <IOSListItem
          leftIcon={
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#007AFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Person sx={{ color: 'white', fontSize: 24 }} />
            </Box>
          }
          subtitle="john.doe@example.com"
          showDisclosure
          onClick={() => console.log('Profile clicked')}
        >
          John Doe
        </IOSListItem>

        <IOSListItem
          leftIcon={<Sync sx={{ color: '#FF9500' }} />}
          rightContent={
            <Typography variant="body2" sx={{ color: 'rgba(60, 60, 67, 0.6)' }}>
              2 hours ago
            </Typography>
          }
          onClick={() => console.log('Last sync clicked')}
        >
          Last Sync
        </IOSListItem>

        <IOSListItem
          leftIcon={<Info sx={{ color: '#8E8E93' }} />}
          rightContent={
            <Typography variant="body2" sx={{ color: 'rgba(60, 60, 67, 0.6)' }}>
              v1.0.0
            </Typography>
          }
        >
          App Version
        </IOSListItem>
      </IOSSection>

      {/* Form Components Section */}
      <IOSSection title="Form Components" footer="iOS-native form controls with proper styling and interactions">
        <Box sx={{ padding: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Text Fields */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '17px', fontWeight: 600, marginBottom: 1 }}>
              Text Fields
            </Typography>
            
            <IOSTextField
              label="Name"
              value={textValue}
              onChange={setTextValue}
              placeholder="Enter your name"
              clearable
              showCharacterCount
              maxLength={50}
            />
            
            <IOSTextField
              label="Email"
              value={emailValue}
              onChange={setEmailValue}
              placeholder="Enter your email"
              type="email"
              startAdornment={<Email sx={{ color: 'rgba(60, 60, 67, 0.6)' }} />}
              clearable
            />
            
            <IOSTextField
              label="Password"
              value={passwordValue}
              onChange={setPasswordValue}
              placeholder="Enter your password"
              type="password"
              startAdornment={<Lock sx={{ color: 'rgba(60, 60, 67, 0.6)' }} />}
              helperText="Password must be at least 8 characters"
            />
            
            <IOSTextField
              label="Search"
              value={searchValue}
              onChange={setSearchValue}
              placeholder="Search accounts..."
              startAdornment={<Search sx={{ color: 'rgba(60, 60, 67, 0.6)' }} />}
              clearable
            />
            
            <IOSTextField
              label="Notes"
              value={textValue}
              onChange={setTextValue}
              placeholder="Add your notes here..."
              multiline
              rows={3}
              showCharacterCount
              maxLength={200}
            />
          </Box>

          {/* Pickers */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '17px', fontWeight: 600, marginBottom: 1 }}>
              Pickers
            </Typography>
            
            <IOSPicker
              label="Account"
              options={[
                { label: 'Chase Checking', value: 'chase-checking' },
                { label: 'Wells Fargo Savings', value: 'wells-savings' },
                { label: 'Capital One Credit', value: 'capital-credit' },
                { label: 'Bank of America Checking', value: 'boa-checking' },
              ]}
              value={selectedAccount}
              onChange={setSelectedAccount}
              placeholder="Select an account"
              searchable
            />
            
            <IOSPicker
              label="Category"
              options={[
                { label: 'Food & Dining', value: 'food', group: 'Expenses' },
                { label: 'Transportation', value: 'transport', group: 'Expenses' },
                { label: 'Shopping', value: 'shopping', group: 'Expenses' },
                { label: 'Salary', value: 'salary', group: 'Income' },
                { label: 'Freelance', value: 'freelance', group: 'Income' },
                { label: 'Investment', value: 'investment', group: 'Income' },
              ]}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Select a category"
              groupBy
              searchable
              helperText="Categories are grouped by type"
            />
          </Box>

          {/* Segmented Controls */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '17px', fontWeight: 600, marginBottom: 1 }}>
              Segmented Controls
            </Typography>
            
            <Box>
              <Typography variant="body2" sx={{ marginBottom: 1, color: 'rgba(60, 60, 67, 0.6)' }}>
                Sort By
              </Typography>
              <IOSSegmentedControl
                options={[
                  { label: 'Name', value: 'name', icon: <Sort /> },
                  { label: 'Date', value: 'date' },
                  { label: 'Amount', value: 'amount' },
                ]}
                value={sortOption}
                onChange={setSortOption}
                fullWidth
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ marginBottom: 1, color: 'rgba(60, 60, 67, 0.6)' }}>
                Filter
              </Typography>
              <IOSSegmentedControl
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                ]}
                value={filterOption}
                onChange={setFilterOption}
                size="small"
              />
            </Box>
          </Box>

          {/* Toggles */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '17px', fontWeight: 600, marginBottom: 1 }}>
              Toggles
            </Typography>
            
            <IOSToggle
              checked={autoSync}
              onChange={setAutoSync}
              label="Auto Sync"
              description="Automatically sync accounts every hour"
              labelPlacement="start"
            />
            
            <IOSToggle
              checked={pushNotifications}
              onChange={setPushNotifications}
              label="Push Notifications"
              description="Receive notifications for sync status updates"
              labelPlacement="start"
              color="success"
            />
            
            <IOSToggle
              checked={biometricAuth}
              onChange={setBiometricAuth}
              label="Biometric Authentication"
              description="Use Face ID or Touch ID to unlock the app"
              labelPlacement="start"
              color="primary"
            />
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <IOSToggle
                checked={darkMode}
                onChange={setDarkMode}
                size="small"
              />
              <Typography variant="body2">Small Toggle</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <IOSToggle
                checked={notifications}
                onChange={setNotifications}
                size="large"
                color="warning"
              />
              <Typography variant="body2">Large Toggle</Typography>
            </Box>
          </Box>
        </Box>
      </IOSSection>

      {/* Action Buttons */}
      <Box sx={{ paddingX: 2, marginTop: 3 }}>
        <IOSButton 
          variant="primary" 
          fullWidth 
          size="large"
          onClick={() => console.log('Sync all accounts')}
        >
          Sync All Accounts
        </IOSButton>
      </Box>
    </Box>
  );
};

export default IOSComponentsDemo;