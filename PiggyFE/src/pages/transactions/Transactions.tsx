import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Grid,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';


import { transactionApi } from '../../api/transaction.api';
import type { TransactionRequest } from '../../api/transaction.api';
import { walletApi } from '../../api/wallet.api';
import { categoryApi } from '../../api/category.api';
import type { Transaction, Wallet, Category, PagedResponse } from '../../types/models';
import { useToastify } from '../../hooks/useToastify';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const TAB_TYPES = ['EXPENSE', 'INCOME', 'TRANSFER'] as const;
type TabType = typeof TAB_TYPES[number];

const TAB_LABELS: Record<TabType, string> = {
  EXPENSE: 'Chi tiêu',
  INCOME: 'Thu nhập',
  TRANSFER: 'Chuyển ví',
};

const EMPTY_FORM: TransactionRequest = {
  walletId: 0,
  categoryId: 0,
  amount: 0,
  note: '',
  transactionDate: new Date().toISOString().slice(0, 16),
};

// ═══════════════════ Add Transaction Modal ═══════════════════
interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  wallets: Wallet[];
  categories: Category[];
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  open, onClose, onSuccess, wallets, categories,
}) => {
  const toast = useToastify();
  const [tab, setTab] = useState<TabType>('EXPENSE');
  const [form, setForm] = useState<TransactionRequest>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  // Filter categories by type matching current tab
  const filteredCategories = categories.filter(c => c.type === tab);
  // Group into system (no userId) and custom (has userId)
  const systemCats = filteredCategories.filter(c => !c.userId);
  const customCats = filteredCategories.filter(c => !!c.userId);

  const handleTabChange = (_: React.SyntheticEvent, val: TabType) => {
    setTab(val);
    setForm(prev => ({ ...prev, categoryId: 0, targetWalletId: undefined }));
  };

  const handleChange = (key: keyof TransactionRequest, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.walletId) return toast.error('Vui lòng chọn ví');
    if (!form.categoryId && tab !== 'TRANSFER') return toast.error('Vui lòng chọn danh mục');
    if (!form.amount || form.amount <= 0) return toast.error('Vui lòng nhập số tiền hợp lệ');
    if (tab === 'TRANSFER' && !form.targetWalletId) return toast.error('Vui lòng chọn ví đích');

    setLoading(true);
    try {
      const payload: TransactionRequest = {
        ...form,
        ...(tab === 'TRANSFER' ? { categoryId: 0 } : {}),
      };
      const res = await transactionApi.createTransaction(payload);
      if (res.code === 0) {
        toast.success('Thêm giao dịch thành công!');
        setForm(EMPTY_FORM);
        setTab('EXPENSE');
        onSuccess();
        onClose();
      } else {
        toast.error(res.message || 'Thêm giao dịch thất bại');
      }
    } catch (err: any) {
      // Backend returns 400 with { code, message } for business errors (e.g. insufficient balance)
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', pb: 0 }}>Thêm Giao dịch</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
          {TAB_TYPES.map(t => (
            <Tab key={t} label={TAB_LABELS[t]} value={t} />
          ))}
        </Tabs>

        {/* Amount */}
        <TextField
          fullWidth
          label="Số tiền"
          type="number"
          value={form.amount || ''}
          onChange={e => handleChange('amount', Number(e.target.value))}
          InputProps={{
            startAdornment: <InputAdornment position="start">₫</InputAdornment>,
            inputProps: { min: 0 },
          }}
          sx={{ mb: 2, '& input': { fontSize: '1.4rem', fontWeight: 'bold' } }}
          autoFocus
        />

        {/* Source Wallet */}
        <TextField
          fullWidth select label={tab === 'TRANSFER' ? 'Ví nguồn' : 'Ví'} value={form.walletId || ''}
          onChange={e => handleChange('walletId', Number(e.target.value))}
          sx={{ mb: 2 }}
        >
          {wallets.map(w => (
            <MenuItem key={w.id} value={w.id}>{w.name} — {formatCurrency(w.balance)}</MenuItem>
          ))}
        </TextField>

        {/* Target Wallet (TRANSFER only) */}
        {tab === 'TRANSFER' && (
          <TextField
            fullWidth select label="Ví đích" value={form.targetWalletId || ''}
            onChange={e => handleChange('targetWalletId', Number(e.target.value))}
            sx={{ mb: 2 }}
          >
            {wallets.filter(w => w.id !== form.walletId).map(w => (
              <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
            ))}
          </TextField>
        )}

        {/* Category (not for TRANSFER) */}
        {tab !== 'TRANSFER' && (
          <TextField
            fullWidth select label="Danh mục" value={form.categoryId || ''}
            onChange={e => handleChange('categoryId', Number(e.target.value))}
            sx={{ mb: 2 }}
          >
            {systemCats.length > 0 && [
              <MenuItem key="__sys" disabled sx={{ opacity: 0.6, fontStyle: 'italic', fontSize: 12 }}>
                — Hệ thống —
              </MenuItem>,
              ...systemCats.map(c => <MenuItem key={c.id} value={c.id}>{c.icon} {c.name}</MenuItem>),
            ]}
            {customCats.length > 0 && [
              <MenuItem key="__cus" disabled sx={{ opacity: 0.6, fontStyle: 'italic', fontSize: 12 }}>
                — Tùy chỉnh —
              </MenuItem>,
              ...customCats.map(c => <MenuItem key={c.id} value={c.id}>{c.icon} {c.name}</MenuItem>),
            ]}
          </TextField>
        )}

        {/* Date */}
        <TextField
          fullWidth
          label="Ngày giờ"
          type="datetime-local"
          value={form.transactionDate}
          onChange={e => handleChange('transactionDate', e.target.value)}
          sx={{ mb: 2 }}
          InputLabelProps={{ shrink: true }}
        />

        {/* Note */}
        <TextField
          fullWidth
          label="Ghi chú"
          multiline
          rows={2}
          value={form.note}
          onChange={e => handleChange('note', e.target.value)}
          placeholder="Mô tả ngắn về giao dịch..."
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Lưu giao dịch'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ═══════════════════ Main Transactions Page ═══════════════════
const TransactionsPage: React.FC = () => {
  const toast = useToastify();

  // Filter state
  const now = new Date();
  const [monthFilter, setMonthFilter] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [walletFilter, setWalletFilter] = useState<number | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Data
  const [paged, setPaged] = useState<PagedResponse<Transaction> | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const [year, month] = monthFilter.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString().slice(0, 10) + 'T00:00:00';
      const endDate   = new Date(year, month, 0).toISOString().slice(0, 10) + 'T23:59:59';

      const res = await transactionApi.getMyTransactions({
        startDate,
        endDate,
        walletId: walletFilter || undefined,
        categoryId: categoryFilter || undefined,
        page,
        size: rowsPerPage,
      });

      if (res.code === 0 && res.data) {
        setPaged(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [monthFilter, walletFilter, categoryFilter, page, rowsPerPage]);

  const fetchMeta = async () => {
    const [walletsRes, categoriesRes] = await Promise.all([
      walletApi.getMyWallets(),
      categoryApi.getMyCategories(),
    ]);
    if (walletsRes.code === 0 && walletsRes.data) setWallets(walletsRes.data);
    if (categoriesRes.code === 0 && categoriesRes.data) setCategories(categoriesRes.data);
  };

  useEffect(() => { void fetchMeta(); }, []);
  useEffect(() => { void fetchTransactions(); }, [fetchTransactions]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return;
    try {
      const res = await transactionApi.deleteTransaction(id);
      if (res.code === 0) {
        toast.success('Đã xóa giao dịch');
        void fetchTransactions();
      }
    } catch {
      toast.error('Xóa giao dịch thất bại');
    }
  };

  const transactions = paged?.content ?? [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Giao dịch</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Thêm giao dịch
        </Button>
      </Box>

      {/* Wallet Balance Summary */}
      {wallets.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, overflowX: 'auto', pb: 1 }}>
          {wallets.map(w => (
            <Paper key={w.id} elevation={1} sx={{
              minWidth: 180, p: 2, borderRadius: 2, flexShrink: 0,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              color: 'white',
            }}>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>{w.name}</Typography>
              <Typography variant="h6" fontWeight="bold">{formatCurrency(w.balance)}</Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Tháng"
              type="month"
              value={monthFilter}
              onChange={e => { setMonthFilter(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth select label="Ví" value={walletFilter} size="small"
              onChange={e => { setWalletFilter(e.target.value === '' ? '' : Number(e.target.value)); setPage(0); }}
            >
              <MenuItem value="">Tất cả ví</MenuItem>
              {wallets.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth select label="Danh mục" value={categoryFilter} size="small"
              onChange={e => { setCategoryFilter(e.target.value === '' ? '' : Number(e.target.value)); setPage(0); }}
            >
              <MenuItem value="">Tất cả danh mục</MenuItem>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.icon} {c.name}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Ngày giờ</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ví</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Danh mục</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ghi chú</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Số tiền</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Không có giao dịch nào trong khoảng thời gian này
                  </TableCell>
                </TableRow>
              ) : transactions.map(tx => {
                const isExpense = tx.type === 'EXPENSE';
                const isIncome = tx.type === 'INCOME';
                const amountColor = isExpense ? 'error.main' : isIncome ? 'success.main' : 'info.main';
                const amountPrefix = isExpense ? '-' : isIncome ? '+' : '⇄ ';

                return (
                  <TableRow key={tx.id} hover>
                    <TableCell>{formatDate(tx.transactionDate)}</TableCell>
                    <TableCell>{tx.walletName}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={tx.categoryName || (tx.type === 'TRANSFER' ? `→ ${tx.targetWalletName}` : '---')}
                        color={isExpense ? 'error' : isIncome ? 'success' : 'info'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.note}
                    </TableCell>
                    <TableCell align="right" sx={{ color: amountColor, fontWeight: 'bold' }}>
                      {amountPrefix}{formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Xóa">
                        <IconButton size="small" color="error" onClick={() => handleDelete(tx.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={paged?.totalCount ?? 0}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Số dòng:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
        />
      </Paper>

      {/* Add Modal */}
      <AddTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchTransactions}
        wallets={wallets}
        categories={categories}
      />
    </Box>
  );
};

export default TransactionsPage;
