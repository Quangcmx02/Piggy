import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Switch,
  Avatar,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Skeleton,
  Tooltip,
  Badge,
} from "@mui/material";
import { Search as SearchIcon, People as PeopleIcon } from "@mui/icons-material";
import { toast } from "react-toastify";
import { adminApi } from "../../api/admin.api";
import type { User } from "../../types/models";

type FilterType = "all" | "active" | "locked";

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAllUsers();
      setUsers(data);
    } catch {
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (user: User) => {
    const newActive = !user.active;
    setTogglingId(user.id);

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, active: newActive } : u))
    );

    try {
      await adminApi.updateUserStatus(user.id, newActive);
      toast.success(
        newActive
          ? `Đã mở khóa tài khoản "${user.username}"`
          : `Đã khóa tài khoản "${user.username}"`
      );
    } catch (err: unknown) {
      // Rollback on failure
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: !newActive } : u))
      );
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Cập nhật trạng thái thất bại";
      toast.error(errMsg);
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.fullName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "active" && u.active) ||
      (filter === "locked" && !u.active);
    return matchSearch && matchFilter;
  });

  const counts = {
    all: users.length,
    active: users.filter((u) => u.active).length,
    locked: users.filter((u) => !u.active).length,
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const getInitials = (user: User) =>
    (user.fullName || user.username).charAt(0).toUpperCase();

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Badge badgeContent={counts.all} color="primary" max={999}>
          <PeopleIcon sx={{ fontSize: 32, color: "primary.main" }} />
        </Badge>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Quản lý người dùng
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {counts.active} đang hoạt động · {counts.locked} bị khóa
          </Typography>
        </Box>
      </Box>

      {/* Controls */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
          alignItems: "center",
        }}
      >
        <TextField
          id="admin-user-search"
          size="small"
          placeholder="Tìm theo username, email, họ tên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 280, flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <ToggleButtonGroup
          id="admin-user-filter"
          size="small"
          value={filter}
          exclusive
          onChange={(_, val) => val && setFilter(val)}
        >
          <ToggleButton value="all">Tất cả ({counts.all})</ToggleButton>
          <ToggleButton value="active">Hoạt động ({counts.active})</ToggleButton>
          <ToggleButton value="locked">Bị khóa ({counts.locked})</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Người dùng</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Quyền</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ngày tạo</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                Trạng thái
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.map((user) => (
                  <TableRow
                    key={user.id}
                    hover
                    sx={{ opacity: user.active ? 1 : 0.6 }}
                  >
                    {/* Avatar + name */}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          src={user.avatarUrl}
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: "primary.main",
                            fontSize: 14,
                          }}
                        >
                          {getInitials(user)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {user.username}
                          </Typography>
                          {user.fullName && (
                            <Typography variant="caption" color="text.secondary">
                              {user.fullName}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Email */}
                    <TableCell>
                      <Typography variant="body2">{user.email}</Typography>
                    </TableCell>

                    {/* Roles */}
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {user.roles?.map((role) => (
                          <Chip
                            key={role}
                            label={role}
                            size="small"
                            color={role === "ADMIN" ? "warning" : "default"}
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>

                    {/* Created at */}
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.createdAt ? formatDate(user.createdAt) : "—"}
                      </Typography>
                    </TableCell>

                    {/* Status toggle */}
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                        }}
                      >
                        <Chip
                          label={user.active ? "Hoạt động" : "Bị khóa"}
                          color={user.active ? "success" : "error"}
                          size="small"
                          sx={{ minWidth: 80 }}
                        />
                        <Tooltip
                          title={
                            user.active
                              ? "Nhấn để khóa tài khoản"
                              : "Nhấn để mở khóa tài khoản"
                          }
                        >
                          <Switch
                            id={`toggle-user-${user.id}`}
                            checked={user.active}
                            disabled={togglingId === user.id}
                            onChange={() => handleToggleActive(user)}
                            color="success"
                            size="small"
                          />
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    {search || filter !== "all"
                      ? "Không tìm thấy người dùng phù hợp"
                      : "Chưa có người dùng nào"}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UserManagement;
