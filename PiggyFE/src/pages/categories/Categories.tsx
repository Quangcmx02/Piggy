import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Tabs, Tab, List, ListItem, ListItemAvatar,
  Avatar, ListItemText, ListItemSecondaryAction, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  RadioGroup, FormControlLabel, Radio, CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

import { categoryApi } from '../../api/category.api';
import type { CategoryRequest } from '../../api/category.api';
import { TransactionType } from '../../types/models';
import type { Category } from '../../types/models';
import { useToastify } from '../../hooks/useToastify';

// Helper to assign some random nice colors to icons
const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 45%)`;
};

// ─── Modal Add/Edit Category ──────────────────────────────────────
interface CategoryFormDialogProps {
  open: boolean;
  editing: Category | null;
  selectedType: TransactionType;
  onClose: () => void;
  onSuccess: () => void;
}

const CategoryFormDialog: React.FC<CategoryFormDialogProps> = ({ open, editing, selectedType, onClose, onSuccess }) => {
  const toast = useToastify();
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>(selectedType);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setType(editing.type);
    } else {
      setName('');
      // Default to what user is viewing in the Tabs if not editing
      setType(selectedType === TransactionType.EXPENSE ? TransactionType.EXPENSE : TransactionType.INCOME);
    }
  }, [editing, selectedType, open]);

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error('Vui lòng nhập tên danh mục');

    setLoading(true);
    try {
      const payload: CategoryRequest = { name: name.trim(), type };
      const res = editing
        ? await categoryApi.updateCategory(editing.id, payload)
        : await categoryApi.createCategory(payload);

      if (res.code === 0) {
        toast.success(editing ? 'Lưu thành công!' : 'Tạo danh mục mới thành công!');
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
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {editing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 1, mt: 1, fontWeight: 'bold' }}>Loại danh mục</Typography>
        <RadioGroup
          row
          value={type}
          onChange={(e) => setType(e.target.value as TransactionType)}
          sx={{ mb: 3 }}
        >
          <FormControlLabel
            value={TransactionType.EXPENSE}
            control={<Radio color="error" />}
            label="Chi tiêu"
          />
          <FormControlLabel
            value={TransactionType.INCOME}
            control={<Radio color="success" />}
            label="Thu nhập"
          />
        </RadioGroup>

        <TextField
          fullWidth
          label="Tên danh mục"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Mua sắm quần áo..."
          autoFocus
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">Hủy</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Lưu lại'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────
const CategoriesPage: React.FC = () => {
  const toast = useToastify();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter tabs
  const [currentTab, setCurrentTab] = useState<TransactionType>(TransactionType.EXPENSE);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryApi.getMyCategories();
      if (res.code === 0 && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchCategories(); }, []);

  const handleEdit = (cat: Category) => {
    setEditingCat(cat);
    setModalOpen(true);
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${cat.name}"?`)) return;
    try {
      const res = await categoryApi.deleteCategory(cat.id);
      if (res.code === 0) {
        toast.success('Đã xóa thành công');
        void fetchCategories();
      } else {
        toast.error(res.message || 'Xóa thất bại');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Divide data into System and Custom arrays based on current tab
  const activeTabsCategories = categories.filter(c => c.type === currentTab);
  const systemCats = activeTabsCategories.filter(c => !c.userId);
  const customCats = activeTabsCategories.filter(c => !!c.userId);

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Quản lý Danh mục</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditingCat(null); setModalOpen(true); }}
          sx={{ borderRadius: 2 }}
        >
          Thêm danh mục
        </Button>
      </Box>

      {/* Tabs Layout */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={currentTab}
          onChange={(_, val) => setCurrentTab(val)}
          variant="fullWidth"
          textColor="inherit"
          indicatorColor={currentTab === TransactionType.EXPENSE ? 'secondary' : 'primary'}
          sx={{
            bgcolor: 'grey.50',
            borderBottom: 1,
            borderColor: 'divider',
            '& .Mui-selected': {
              color: currentTab === TransactionType.EXPENSE ? 'error.main' : 'success.main',
              fontWeight: 'bold',
            }
          }}
        >
          <Tab value={TransactionType.EXPENSE} label="Chi tiêu (Expense)" />
          <Tab value={TransactionType.INCOME} label="Thu Nhập (Income)" />
        </Tabs>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', px: 2, mt: 1, fontWeight: 'bold' }}>
              Danh mục của tôi
            </Typography>
            <List disablePadding>
              {customCats.length === 0 ? (
                <ListItem>
                  <ListItemText secondary="Bạn chưa tạo danh mục nào ở phân loại này." />
                </ListItem>
              ) : (
                customCats.map(cat => (
                  <ListItem
                    key={cat.id}
                    sx={{ bgcolor: 'white', mb: 1, borderRadius: 2, border: '1px solid #eee' }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getAvatarColor(cat.name) }}>
                        {cat.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={cat.name} sx={{ '& .MuiListItemText-primary': { fontWeight: 500 } }} />
                    <ListItemSecondaryAction>
                      <Tooltip title="Sửa">
                        <IconButton edge="end" onClick={() => handleEdit(cat)} sx={{ color: 'primary.main', mr: 1 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton edge="end" onClick={() => handleDelete(cat)} sx={{ color: 'error.main' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
              )}
            </List>

            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', px: 2, mt: 4, fontWeight: 'bold' }}>
              Danh mục hệ thống (Mặc định)
            </Typography>
            <List disablePadding>
              {systemCats.length === 0 ? (
                <ListItem>
                  <ListItemText secondary="Không có danh mục hệ thống." />
                </ListItem>
              ) : (
                systemCats.map(cat => (
                  <ListItem
                    key={cat.id}
                    sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 2, opacity: 0.9 }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'grey.400' }}>
                        {cat.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={cat.name} />
                    <ListItemSecondaryAction>
                      <Tooltip title="Không thể sửa danh mục hệ thống">
                        <IconButton disabled edge="end">
                          <LockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
              )}
            </List>
          </Box>
        )}
      </Paper>

      {/* Modal Add / Edit */}
      <CategoryFormDialog
        open={modalOpen}
        editing={editingCat}
        selectedType={currentTab}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchCategories}
      />
    </Box>
  );
};

export default CategoriesPage;
