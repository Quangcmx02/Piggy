import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { walletApi } from '../../api/wallet.api';
import { reportApi } from '../../api/report.api';
import type { MonthlySummaryResponse, CategoryBreakdownResponse } from '../../api/report.api';
import { transactionApi } from '../../api/transaction.api';
import type { Transaction } from '../../types/models';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ed4b82', '#6a1b9a', '#2e7d32'];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Hàm hỗ trợ format Date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);

  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyReport, setMonthlyReport] = useState<MonthlySummaryResponse | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryBreakdownResponse[]>([]);
  const [barChartData, setBarChartData] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // getMonth is 0-indexed

        // 1. Tổng số dư ví
        const walletsRes = await walletApi.getMyWallets();
        if (walletsRes.code === 0 && walletsRes.data) {
          const sum = walletsRes.data.reduce((acc, wallet) => acc + wallet.balance, 0);
          setTotalBalance(sum);
        }

        // 2. Report Thu/Chi của tháng này
        const currentMonthReportRes = await reportApi.getMonthlySummary(year, month);
        if (currentMonthReportRes.code === 0 && currentMonthReportRes.data) {
          setMonthlyReport(currentMonthReportRes.data);
        }

        // 3. Category Breakdown (Pie Chart) -> Chỉ lấy các giao dịch EXPENSE (Chi) của tháng này để phân tích
        const categoryRes = await reportApi.getCategoryBreakdown(year, month);
        if (categoryRes.code === 0 && categoryRes.data) {
          // Lọc những doanh mục có biến động trên 0
          setCategoryData(categoryRes.data.filter(c => c.totalAmount > 0));
        }

        // 4. Monthly Summary (Bar Chart) - Lấy data của 6 tháng gần nhất
        const monthsToFetch: { year: number; month: number; label: string }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(year, now.getMonth() - i, 1);
          monthsToFetch.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: `T${d.getMonth() + 1}/${d.getFullYear()}` });
        }

        const sixMonthsReportPromises = monthsToFetch.map(item => reportApi.getMonthlySummary(item.year, item.month));
        const sixMonthsReports = await Promise.all(sixMonthsReportPromises);

        const formattedBarChartData = sixMonthsReports.map((res, index) => ({
          name: monthsToFetch[index].label,
          Thu: res.code === 0 && res.data ? res.data.totalIncome : 0,
          Chi: res.code === 0 && res.data ? res.data.totalExpense : 0,
        }));
        setBarChartData(formattedBarChartData);

        // 5. Giao dịch gần nhất
        const transactionsRes = await transactionApi.getMyTransactions({ size: 5 });
        if (transactionsRes.code === 0 && transactionsRes.data) {
          const sorted = transactionsRes.data.content.sort(
            (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
          );
          setRecentTransactions(sorted);
        }

      } catch (error) {
        console.error("Dashboard Widget Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom color="text.primary">
        Tổng quan tài chính
      </Typography>

      {/* Khu vực 1: Widget thống kê */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56, mr: 2 }}>
                <WalletIcon color="primary" />
              </Avatar>
              <Box>
                <Typography color="text.secondary" variant="subtitle2">Tổng số dư các ví</Typography>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(totalBalance)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: '#e8f5e9', width: 56, height: 56, mr: 2 }}>
                <TrendingUpIcon color="success" />
              </Avatar>
              <Box>
                <Typography color="text.secondary" variant="subtitle2">Thu tháng này</Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  {formatCurrency(monthlyReport?.totalIncome || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: '#ffebee', width: 56, height: 56, mr: 2 }}>
                <TrendingDownIcon color="error" />
              </Avatar>
              <Box>
                <Typography color="text.secondary" variant="subtitle2">Chi tháng này</Typography>
                <Typography variant="h5" fontWeight="bold" color="error.main">
                  {formatCurrency(monthlyReport?.totalExpense || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Khu vực 2: Biểu đồ */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Biểu đồ phân bổ chi tiêu bằng PieChart */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: 400 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Phân bổ dòng tiền tháng này
            </Typography>
            {categoryData.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="80%">
                <Typography color="text.secondary">Chưa có giao dịch thống kê</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="totalAmount"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ payload, percent }: any) => `${payload.categoryName} (${(percent * 100).toFixed(1)}%)`}
                  >
                    {categoryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={((value: any) => formatCurrency(Number(value))) as any} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Biểu đồ tổng quan 6 tháng */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: 400 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Thu / Chi 6 tháng gần nhất
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(val) => `${val / 1000}k`} />
                <RechartsTooltip formatter={((value: any) => formatCurrency(Number(value))) as any} />
                <Legend />
                <Bar dataKey="Thu" fill="#2e7d32" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Chi" fill="#d32f2f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Khu vực 3: Giao dịch gần nhất */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Giao dịch gần nhất
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Thời gian</TableCell>
                <TableCell>Ví</TableCell>
                <TableCell>Hạng mục</TableCell>
                <TableCell>Ghi chú</TableCell>
                <TableCell align="right">Số tiền</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentTransactions.map((tx) => {
                const isExpense = tx.type === 'EXPENSE';
                const isIncome = tx.type === 'INCOME';

                const amountColor = isExpense ? 'error.main' : isIncome ? 'success.main' : 'inherit';
                const amountPrefix = isExpense ? '-' : isIncome ? '+' : '';

                return (
                  <TableRow key={tx.id}>
                    <TableCell>{formatDate(tx.transactionDate)}</TableCell>
                    <TableCell>{tx.walletName}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={tx.categoryName || '---'}
                        color={isExpense ? 'error' : isIncome ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{tx.note}</TableCell>
                    <TableCell align="right" sx={{ color: amountColor, fontWeight: 'bold' }}>
                      {amountPrefix}{formatCurrency(tx.amount)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {recentTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">Chưa có giao dịch nào.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Dashboard;
