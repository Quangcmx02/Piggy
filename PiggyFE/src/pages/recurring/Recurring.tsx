import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Grid, Card, CardContent, Divider,
  Switch, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, CircularProgress, InputAdornment, FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  EventRepeat as RepeatIcon,
  NotificationsActive as AlarmIcon,
} from '@mui/icons-material';

import { recurringTransactionApi } from '../../api/recurring-transaction.api';
import type { RecurringTransactionRequest } from '../../api/recurring-transaction.api';
import { walletApi } from '../../api/wallet.api';
import { categoryApi } from '../../api/category.api';
import { RecurringFrequency, TransactionType } from '../../types/models';
import type { RecurringTransaction, Wallet, Category } from '../../types/models';
import { useToastify } from '../../hooks/useToastify';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const FREQUENCIES = [
  { value: RecurringFrequency.DAILY, label: 'Hàng ngày' },
  { value: RecurringFrequency.WEEKLY, label: 'Hàng tuần' },
  { value: RecurringFrequency.MONTHLY, label: 'Hàng tháng' },
  { value: RecurringFrequency.YEARLY, label: 'Hàng năm' },
];

const EMPTY_FORM: RecurringTransactionRequest = {
  name: '',
  walletId: 0,
  categoryId: 0,
  amount: 0,
  frequency: RecurringFrequency.MONTHLY,
  nextExecutionDate: new Date().toISOString().slice(0, 10),
};

// ─── Modal Add/Edit Recurring ──────────────────────────────────────
interface RecurringFormDialogProps {
  open: boolean;
  editing: RecurringTransaction | null;
  wallets: Wallet[];
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

const RecurringFormDialog: React.FC<RecurringFormDialogProps> = ({ open, editing, wallets, categories, onClose, onSuccess }) => {
  const toast = useToastify();
  const [form, setForm] = useState<RecurringTransactionRequest>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        walletId: editing.walletId,
        categoryId: editing.categoryId,
        amount: editing.amount,
        frequency: editing.frequency,
        nextExecutionDate: editing.nextExecutionDate ? editing.nextExecutionDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editing, open]);

  const handleChange = (key: keyof RecurringTransactionRequest, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('Vui lòng nhập tên hóa đơn/giao dịch');
    if (!form.amount || form.amount <= 0) return toast.error('Số tiền phải lớn hơn 0');
    if (!form.walletId) return toast.error('Vui lòng chọn ví nguồn');
    if (!form.categoryId) return toast.error('Vui lòng chọn danh mục');
    if (!form.nextExecutionDate) return toast.error('Vui lòng chọn ngày bắt đầu chạy');

    // Validation: Ví được chọn không được có số dư = 0
    const selectedWallet = wallets.find(w => w.id === form.walletId);
    if (selectedWallet && selectedWallet.balance <= 0) {
      return toast.error(`Ví "${selectedWallet.name}" đang có số dư 0đ. Vui lòng chọn ví khác!`);
    }

    setLoading(true);
    try {
      const res = editing
        ? await recurringTransactionApi.updateRecurringTransaction(editing.id, form)
        : await recurringTransactionApi.createRecurringTransaction(form);

      if (res.code === 0) {
        toast.success(editing ? 'Cập nhật thành công!' : 'Tạo lịch tự động thành công!');
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Thao tác thất bại');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {editing ? 'Sửa lịch tự động' : 'Thêm giao dịch tự động'}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <TextField
          fullWidth label="Tên hóa đơn (VD: Tiền điện, Netflix)"
          value={form.name} onChange={e => handleChange('name', e.target.value)}
          sx={{ mb: 2, mt: 1 }} autoFocus
        />
        <TextField
          fullWidth label="Số tiền sẽ trừ" type="number"
          value={form.amount || ''} onChange={e => handleChange('amount', Number(e.target.value))}
          InputProps={{ startAdornment: <InputAdornment position="start">₫</InputAdornment> }}
          sx={{ mb: 2, '& input': { fontSize: '1.2rem', fontWeight: 'bold' } }}
        />
        <TextField
          fullWidth select label="Tài khoản / Ví rút tiền"
          value={form.walletId || ''} onChange={e => handleChange('walletId', Number(e.target.value))}
          sx={{ mb: 2 }}
        >
          {wallets.map(w => (
            <MenuItem key={w.id} value={w.id}>{w.name} — Số dư: {formatCurrency(w.balance)}</MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth select label="Danh mục thẻ"
          value={form.categoryId || ''} onChange={e => handleChange('categoryId', Number(e.target.value))}
          sx={{ mb: 2 }}
        >
          {categories.filter(c => c.type === TransactionType.EXPENSE).map(c => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth select label="Chu kỳ"
          value={form.frequency} onChange={e => handleChange('frequency', e.target.value)}
          sx={{ mb: 2 }}
        >
          {FREQUENCIES.map(f => (
            <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth label="Ngày chạy tiếp theo (BD trừ tiền)" type="date"
          value={form.nextExecutionDate} onChange={e => handleChange('nextExecutionDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">Hủy</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Lưu cài đặt'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────
const RecurringPage: React.FC = () => {
  const toast = useToastify();
  const [data, setData] = useState<RecurringTransaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [recRes, walRes, catRes] = await Promise.all([
        recurringTransactionApi.getMyRecurringTransactions(),
        walletApi.getMyWallets(),
        categoryApi.getMyCategories()
      ]);
      if (recRes.code === 0 && recRes.data) setData(recRes.data);
      if (walRes.code === 0 && walRes.data) setWallets(walRes.data);
      if (catRes.code === 0 && catRes.data) setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchAll(); }, []);

  const handleEdit = (item: RecurringTransaction) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa lịch trừ tiền này không?\n\nMẹo: Nếu bạn chỉ muốn tạm dừng, hãy dùng nút Tắt trạng thái thay vì xóa hoàn toàn để không cần cài đặt lại vào tháng sau!")) return;
    try {
      const res = await recurringTransactionApi.deleteRecurringTransaction(id);
      if (res.code === 0) {
        toast.success('Đã xóa lịch tự động');
        void fetchAll();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleToggle = async (item: RecurringTransaction) => {
    // Optimistic UI update
    setData(prev => prev.map(r => r.id === item.id ? { ...r, active: !r.active } : r));

    try {
      const res = await recurringTransactionApi.toggleRecurringStatus(item.id);
      if (res.code !== 0) {
        // Revert on failure
        toast.error(res.message || 'Thay đổi trạng thái thất bại');
        setData(prev => prev.map(r => r.id === item.id ? { ...r, active: item.active } : r));
      } else {
        toast.success(`Đã ${!item.active ? 'bật' : 'tắt'} tự động thanh toán`);
      }
    } catch (err) {
      // Revert on failure
      toast.error('Có lỗi xảy ra khi đổi trạng thái');
      setData(prev => prev.map(r => r.id === item.id ? { ...r, active: item.active } : r));
    }
  };

  const calculateUpcoming30Days = () => {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);

    return data.filter(d => d.active).reduce((sum, item) => {
      // Very basic estimation: if next execution is within 30 days, add it up.
      // (For complex frequency logic, the calculation would be more involved)
      const executionDate = new Date(item.nextExecutionDate || '');
      if (executionDate >= now && executionDate <= in30Days) {
        return sum + item.amount;
      }
      return sum;
    }, 0);
  };

  return (
    <Box sx={{ pb: 8 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Hóa đơn & Giao dịch định kỳ</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditingItem(null); setFormOpen(true); }}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Thêm lịch tự động
        </Button>
      </Box>

      {/* Thống kê 30 ngày tới */}
      <Paper sx={{
        mb: 4, p: 4, borderRadius: 4,
        background: 'red',
        color: 'white',
        boxShadow: '0 8px 32px rgba(43, 88, 118, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: 3
      }}>
        <AlarmIcon sx={{ fontSize: 56, opacity: 0.8 }} />
        <Box>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Tổng tiền dự kiến sẽ tự động trừ trong 30 ngày tới:
          </Typography>
          <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>
            {formatCurrency(calculateUpcoming30Days())}
          </Typography>
        </Box>
      </Paper>

      {/* Grid Danh sách thẻ (Subscriptions style) */}
      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>
      ) : data.length === 0 ? (
        <Box textAlign="center" mt={6}>
          <Typography color="text.secondary" mb={2}>Chưa có dịch vụ đăng ký tự động nào.</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
            Thêm gói cước
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {data.map(item => {
            const walletName = wallets.find(w => w.id === item.walletId)?.name || 'Ví không xác định';
            const catName = categories.find(c => c.id === item.categoryId)?.name || 'Chi tiêu';

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                <Card elevation={2} sx={{
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: '0.2s',
                  bgcolor: item.active ? 'white' : '#fafafa',
                  border: '1px solid',
                  borderColor: item.active ? 'transparent' : 'grey.300',
                  opacity: item.active ? 1 : 0.8
                }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          {catName}
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2, mt: 0.5, mb: 1 }}>
                          {item.name}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <RepeatIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {FREQUENCIES.find(f => f.value === item.frequency)?.label} • {walletName}
                          </Typography>
                        </Box>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={item.active}
                            color="success"
                            onChange={() => handleToggle(item)}
                          />
                        }
                        label={item.active ? "Đang chạy" : "Tạm dừng"}
                        labelPlacement="bottom"
                        sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: '0.7rem', color: 'text.secondary', mt: 0.5 } }}
                      />
                    </Box>

                    <Typography variant="h4" fontWeight="bold" color={item.active ? "error.main" : "text.secondary"}>
                      -{formatCurrency(item.amount)}
                    </Typography>
                  </CardContent>

                  <Divider sx={{ mt: 2 }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1} bgcolor="grey.50">
                    <Typography variant="caption" color="text.secondary" fontWeight={item.active ? "bold" : "normal"}>
                      {item.active ? `Sẽ trừ tiền vào: ${formatDate(item.nextExecutionDate)}` : "Đã tạm dừng tự động trừ"}
                    </Typography>
                    <Box>
                      <Tooltip title="Sửa">
                        <IconButton size="small" onClick={() => handleEdit(item)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa dịch vụ">
                        <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Forms */}
      <RecurringFormDialog
        open={formOpen}
        editing={editingItem}
        wallets={wallets}
        categories={categories}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchAll}
      />
    </Box>
  );
};

export default RecurringPage;
