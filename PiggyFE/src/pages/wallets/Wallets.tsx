import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Fab,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as TransferIcon,
} from '@mui/icons-material';

import { walletApi } from '../../api/wallet.api';
import type { WalletRequest } from '../../api/wallet.api';
import { transactionApi } from '../../api/transaction.api';
import type { Wallet } from '../../types/models';
import { useToastify } from '../../hooks/useToastify';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #1a237e 0%, #1976d2 100%)',
  'linear-gradient(135deg, #1b5e20 0%, #388e3c 100%)',
  'linear-gradient(135deg, #b71c1c 0%, #e53935 100%)',
  'linear-gradient(135deg, #4a148c 0%, #8e24aa 100%)',
  'linear-gradient(135deg, #e65100 0%, #fb8c00 100%)',
  'linear-gradient(135deg, #006064 0%, #00acc1 100%)',
];

const EMPTY_WALLET: WalletRequest = { name: '', initialBalance: 0, currency: 'VND' };

// ─── Wallet Form Dialog ────────────────────────────────────────
interface WalletFormDialogProps {
  open: boolean;
  editing: Wallet | null;
  onClose: () => void;
  onSuccess: () => void;
}

const WalletFormDialog: React.FC<WalletFormDialogProps> = ({ open, editing, onClose, onSuccess }) => {
  const toast = useToastify();
  const [form, setForm] = useState<WalletRequest>(EMPTY_WALLET);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({ name: editing.name, initialBalance: editing.balance, currency: editing.currency || 'VND' });
    } else {
      setForm(EMPTY_WALLET);
    }
  }, [editing, open]);

  const handleChange = (key: keyof WalletRequest, val: any) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('Vui lòng nhập tên ví');
    setLoading(true);
    try {
      const res = editing
        ? await walletApi.updateWallet(editing.id, form)
        : await walletApi.createWallet(form);

      if (res.code === 0) {
        toast.success(editing ? 'Cập nhật ví thành công!' : 'Tạo ví thành công!');
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Thao tác thất bại');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>{editing ? 'Chỉnh sửa ví' : 'Thêm ví mới'}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth label="Tên ví" value={form.name}
          onChange={e => handleChange('name', e.target.value)}
          sx={{ mt: 1, mb: 2 }} autoFocus
          placeholder="Tiền mặt, Techcombank, ..."
        />
        <TextField
          fullWidth label="Số dư ban đầu" type="number"
          value={form.initialBalance === 0 ? '' : form.initialBalance}
          onChange={e => handleChange('initialBalance', Number(e.target.value))}
          sx={{ mb: 2 }}
          InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }}
          disabled={!!editing}
          helperText={editing ? 'Số dư ban đầu không thể thay đổi' : 'Nhập 0 nếu không có'}
        />
        {/* Chỉ hỗ trợ mặc định VND */}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} color="inherit" /> : editing ? 'Lưu thay đổi' : 'Tạo ví'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Transfer Dialog ───────────────────────────────────────────
interface TransferDialogProps {
  open: boolean;
  wallets: Wallet[];
  onClose: () => void;
  onSuccess: () => void;
}

const TransferDialog: React.FC<TransferDialogProps> = ({ open, wallets, onClose, onSuccess }) => {
  const toast = useToastify();
  const [fromWallet, setFromWallet] = useState<number | ''>('');
  const [toWallet, setToWallet] = useState<number | ''>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!fromWallet) return toast.error('Chọn ví nguồn');
    if (!toWallet) return toast.error('Chọn ví đích');
    if (fromWallet === toWallet) return toast.error('Ví nguồn và ví đích phải khác nhau');
    if (!amount || Number(amount) <= 0) return toast.error('Nhập số tiền hợp lệ');

    setLoading(true);
    try {
      const res = await transactionApi.createTransaction({
        walletId: Number(fromWallet),
        targetWalletId: Number(toWallet),
        amount: Number(amount),
        note,
        transactionDate: new Date().toISOString().slice(0, 19),
      });
      if (res.code === 0) {
        toast.success('Chuyển tiền thành công!');
        setFromWallet(''); setToWallet(''); setAmount(''); setNote('');
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Chuyển tiền thất bại');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>Chuyển tiền giữa các ví</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth select label="Ví nguồn" value={fromWallet}
          onChange={e => setFromWallet(Number(e.target.value))}
          sx={{ mt: 1, mb: 2 }}
        >
          {wallets.map(w => (
            <MenuItem key={w.id} value={w.id}>{w.name} — {formatCurrency(w.balance)}</MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth select label="Ví đích" value={toWallet}
          onChange={e => setToWallet(Number(e.target.value))}
          sx={{ mb: 2 }}
        >
          {wallets.filter(w => w.id !== fromWallet).map(w => (
            <MenuItem key={w.id} value={w.id}>{w.name} — {formatCurrency(w.balance)}</MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth label="Số tiền" type="number"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          sx={{ mb: 2 }}
          InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }}
        />
        <TextField
          fullWidth label="Ghi chú" value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="VD: Chuyển tiết kiệm..."
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Hủy</Button>
        <Button variant="contained" onClick={handleTransfer} disabled={loading}>
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Chuyển tiền'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Wallets Page ─────────────────────────────────────────
const WalletsPage: React.FC = () => {
  const toast = useToastify();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const res = await walletApi.getMyWallets();
      if (res.code === 0 && res.data) setWallets(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchWallets(); }, []);

  const handleEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setFormOpen(true);
  };

  const handleDelete = async (wallet: Wallet) => {
    if (!window.confirm(`Bạn có chắc muốn xóa ví và giao dịch liên quan "${wallet.name}"?`)) return;
    try {
      const res = await walletApi.deleteWallet(wallet.id);
      if (res.code === 0) {
        toast.success('Đã xóa ví');
        void fetchWallets();
      } else {
        toast.error(res.message || 'Xóa ví thất bại');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Ví của tôi</Typography>
        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => { setEditingWallet(null); setFormOpen(true); }}
          sx={{ borderRadius: 2 }}>
          Thêm ví
        </Button>
      </Box>

      {/* Total balance banner */}
      <Box sx={{
        mb: 4, p: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)',
        color: 'white',
      }}>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>Tổng số dư tất cả ví</Typography>
        <Typography variant="h4" fontWeight="bold">{formatCurrency(totalBalance)}</Typography>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>{wallets.length} ví đang hoạt động</Typography>
      </Box>

      {/* Wallet Cards */}
      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>
      ) : wallets.length === 0 ? (
        <Box textAlign="center" mt={6}>
          <Typography color="text.secondary" gutterBottom>Bạn chưa có ví nào.</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
            Tạo ví đầu tiên
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {wallets.map((wallet, idx) => (
            <Grid key={wallet.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card elevation={3} sx={{
                borderRadius: 3,
                background: CARD_GRADIENTS[idx % CARD_GRADIENTS.length],
                color: 'white',
                minHeight: 160,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute', top: -30, right: -30,
                  width: 120, height: 120,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                  pointerEvents: 'none',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute', bottom: -20, right: 40,
                  width: 80, height: 80,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  pointerEvents: 'none',
                },
              }}>
                <CardContent>
                  <Typography variant="caption" sx={{ opacity: 0.75, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {wallet.currency}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>
                    {wallet.name}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ mt: 2 }}>
                    {formatCurrency(wallet.balance)}
                  </Typography>
                </CardContent>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                <CardActions sx={{ justifyContent: 'flex-end', px: 2, py: 1 }}>
                  <Tooltip title="Chỉnh sửa">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.85)' }} onClick={() => handleEdit(wallet)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa ví">
                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.85)' }} onClick={() => handleDelete(wallet)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Sticky Transfer FAB */}
      <Fab
        variant="extended"
        color="secondary"
        sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000, boxShadow: 4 }}
        onClick={() => setTransferOpen(true)}
      >
        <TransferIcon sx={{ mr: 1 }} />
        Chuyển tiền giữa ví
      </Fab>

      {/* Dialogs */}
      <WalletFormDialog
        open={formOpen}
        editing={editingWallet}
        onClose={() => { setFormOpen(false); setEditingWallet(null); }}
        onSuccess={fetchWallets}
      />
      <TransferDialog
        open={transferOpen}
        wallets={wallets}
        onClose={() => setTransferOpen(false)}
        onSuccess={fetchWallets}
      />
    </Box>
  );
};

export default WalletsPage;
