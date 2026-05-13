import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  Toolbar,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ReceiptLong as ReceiptLongIcon,
  AccountBalanceWallet as WalletIcon,
  Category as CategoryIcon,
  Update as RecurringIcon,
} from '@mui/icons-material';

interface SidebarProps {
  drawerWidth: number;
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ drawerWidth, mobileOpen, handleDrawerToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleMenuClick = (path: string) => {
    navigate(path);
    // If mobile drawer is open, we can try to close it here 
    // Usually it's better to pass handleDrawerToggle but we only close it
    if (mobileOpen) {
      handleDrawerToggle();
    }
  };

  const menuItems = [
    { text: 'Tổng quan', path: '/dashboard', icon: <DashboardIcon /> },
    { text: 'Giao dịch', path: '/transactions', icon: <ReceiptLongIcon /> },
    { text: 'Ví của tôi', path: '/wallets', icon: <WalletIcon /> },
    { text: 'Danh mục', path: '/categories', icon: <CategoryIcon /> },
    { text: 'Giao dịch định kỳ', path: '/recurring', icon: <RecurringIcon /> },
  ];

  const drawerContent = (
    <div>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Typography variant="h5" noWrap component="div" sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          🐷 Piggy
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => {
          const isSelected = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => handleMenuClick(item.path)}
                sx={{
                  minHeight: 48,
                  px: 2.5,
                  mx: 2,
                  borderRadius: 2,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    }
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isSelected ? 'inherit' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    opacity: 1, 
                    '& .MuiTypography-root': {
                      fontWeight: isSelected ? 600 : 400
                    }
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth, 
            borderRight: '1px dashed rgba(0, 0, 0, 0.12)' 
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
