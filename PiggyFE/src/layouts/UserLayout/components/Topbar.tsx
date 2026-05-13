import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';

interface TopbarProps {
  drawerWidth: number;
  handleDrawerToggle: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ drawerWidth, handleDrawerToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    handleCloseUserMenu();
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    void logout();
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton color="inherit" aria-label="notifications">
            <Badge color="error" variant="dot">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton
            onClick={handleOpenUserMenu}
            sx={{
              p: 0,
              border: '2px solid transparent',
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'primary.main' }
            }}
          >
            <Avatar
              alt={user?.fullName || user?.username || 'User'}
              src={user?.avatarUrl || ''}
              sx={{ bgcolor: 'secondary.main' }}
            >
              {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            sx={{ mt: '45px' }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
            slotProps={{ paper: { elevation: 3, sx: { width: 170, borderRadius: 2 } } }}
          >
            <MenuItem onClick={() => handleMenuClick('/profile')}>
              <Typography textAlign="center">Hồ sơ cá nhân</Typography>
            </MenuItem>
            <MenuItem onClick={() => handleMenuClick('/change-password')}>
              <Typography textAlign="center">Đổi mật khẩu</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <Typography textAlign="center" color="error">Đăng xuất</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
