import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  TextField, 
  Typography, 
  Paper,
  Link,
  CircularProgress
} from '@mui/material';
import { authApi } from '../../api/auth.api';
import { useToastify } from '../../hooks/useToastify';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToastify();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.forgotPassword({ email });
      if (response.code === 0) {
        setSuccess(true);
        toast.success(response.message || 'Yêu cầu cấp lại mật khẩu đã được gửi!');
      } else {
        toast.error(response.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi kết nối. Vui lòng liên hệ quản trị viên.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1" fontWeight="bold" color="primary.main">
              🐷 Piggy
            </Typography>
          </Box>
          <Typography component="h2" variant="h6" align="center" gutterBottom>
            Quên mật khẩu
          </Typography>
          
          {success ? (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body1" color="success.main" paragraph>
                Chúng tôi đã gửi hướng dẫn lấy lại mật khẩu vào email của bạn. Vui lòng kiểm tra hộp thư.
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2, borderRadius: 2 }}
                onClick={() => navigate('/login')}
              >
                Trở lại Đăng nhập
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                Nhập email của bạn và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
              </Typography>
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Địa chỉ Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, height: 48, borderRadius: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Gửi yêu cầu'}
              </Button>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Link 
                  component="button" 
                  type="button" 
                  variant="body2" 
                  onClick={() => navigate('/login')} 
                  underline="hover"
                >
                  Quay lại Đăng nhập
                </Link>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;
