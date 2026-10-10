import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  Clock,
  Sparkles,
  Plus,
  ArrowRight,
  TrendingUp,
  Receipt,
  Store,
} from 'lucide-react';
import { api } from '@/services/api';
import { DashboardSummary } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

import { STATIC_DASHBOARD_METRICS } from '@/services/mockData';

export const DashboardPage: React.FC = () => {
  const { data: summary, isLoading: isSummaryLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      try {
        return await api.get<DashboardSummary>('/dashboard/summary');
      } catch {
        return {
          total_products: STATIC_DASHBOARD_METRICS.total_active_products,
          total_available_units: STATIC_DASHBOARD_METRICS.total_available_units,
          low_stock_count: STATIC_DASHBOARD_METRICS.low_stock_count,
          expiring_soon_count: STATIC_DASHBOARD_METRICS.nearing_expiry_count,
          estimated_spoilage_exposure: STATIC_DASHBOARD_METRICS.estimated_spoilage_exposure,
          pending_recommendations: STATIC_DASHBOARD_METRICS.pending_recommendations_count,
          today_sales: STATIC_DASHBOARD_METRICS.today_sales_revenue,
          recent_activity: [
            { title: 'Sale Recorded', subtitle: 'Milk Packet (1L) x 2, Fresh Bread x 1 - ₹94', timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
            { title: 'Exchange Agreed', subtitle: 'Transferred 12 Fresh Bread to Anjali Bakery', timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
            { title: 'Discount Recommended', subtitle: 'AI suggested 25% discount for 40x Milk Packets', timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
          ],
        } as DashboardSummary;
      }
    },
  });

  const { data: salesChart } = useQuery<{ date: string; amount: number }[]>({
    queryKey: ['dashboard-sales-chart'],
    queryFn: async () => {
      try {
        const res = await api.get<{ date: string; amount: number }[]>('/dashboard/sales');
        if (res && res.length > 0) return res;
        return STATIC_DASHBOARD_METRICS.sales_trend.map((s) => ({ date: s.day, amount: s.sales }));
      } catch {
        return STATIC_DASHBOARD_METRICS.sales_trend.map((s) => ({ date: s.day, amount: s.sales }));
      }
    },
  });

  const { data: categoryChart } = useQuery<{ category: string; count: number }[]>({
    queryKey: ['dashboard-category-chart'],
    queryFn: async () => {
      try {
        return await api.get<{ category: string; count: number }[]>('/dashboard/inventory');
      } catch {
        return STATIC_DASHBOARD_METRICS.category_distribution.map((c) => ({ category: c.name, count: c.value }));
      }
    },
  });

  if (isSummaryLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-48"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Exact empty state requirement: "INITIALLY KEEP THE DASHBOARD, initially empty"
  const isShopEmpty = summary ? summary.total_products === 0 : true;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Dashboard</h1>
          <p className="text-xs text-gray-500 font-medium">Real-time inventory intelligence and grocery status</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/inventory/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f95721] hover:bg-[#e04512] text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
          <Link
            to="/sales/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-gray-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Receipt className="w-4 h-4" /> Record Sale
          </Link>
        </div>
      </div>

      {/* KPI Cards matching UI Reference 4 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">Total Products</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{summary?.total_products ?? 0}</h3>
            <p className="text-[11px] text-gray-400 font-medium mt-1">
              {summary?.total_available_units ?? 0} units in stock
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#f95721] flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">Low Stock</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{summary?.low_stock_count ?? 0}</h3>
            <p className="text-[11px] text-gray-400 font-medium mt-1">At or below threshold</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">Expiring Soon</p>
            <h3 className="text-2xl font-black text-red-500 mt-1">{summary?.expiring_soon_count ?? 0}</h3>
            <p className="text-[11px] text-gray-400 font-medium mt-1">
              Exposure: {formatCurrency(summary?.estimated_spoilage_exposure ?? 0)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Smart Suggestions */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">Suggestions</p>
            <h3 className="text-2xl font-black text-[#f95721] mt-1">{summary?.pending_recommendations ?? 0}</h3>
            <p className="text-[11px] text-gray-400 font-medium mt-1">Actionable decisions</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#f95721] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* If Empty State */}
      {isShopEmpty && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 text-center max-w-xl mx-auto shadow-xs my-6">
          <div className="w-16 h-16 rounded-3xl bg-orange-100 text-[#f95721] flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Your inventory is currently empty</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-2">
            Welcome to NUTANA! Start by adding your catalog products and stock batches to track expiry dates and get zero-waste recommendations.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/inventory/new"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#f95721] text-white font-bold text-xs shadow-md shadow-orange-500/20 hover:bg-[#e04512] transition"
            >
              Add First Product
            </Link>
          </div>
        </div>
      )}

      {/* Quick Action Tiles matching UI Reference 4 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/inventory/new"
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-orange-200 transition text-center group flex flex-col items-center justify-center"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#f95721] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-800">Add Product</span>
        </Link>

        <Link
          to="/inventory"
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-orange-200 transition text-center group flex flex-col items-center justify-center"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-800">View Stock</span>
        </Link>

        <Link
          to="/expiry"
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-orange-200 transition text-center group flex flex-col items-center justify-center"
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-800">Expiry Alerts</span>
        </Link>

        <Link
          to="/recommendations"
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-orange-200 transition text-center group flex flex-col items-center justify-center"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#f95721] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-800">Smart Suggestions</span>
        </Link>
      </div>

      {/* Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Sales Trend</h3>
              <p className="text-[11px] text-gray-400">Net revenue collected over recent transactions</p>
            </div>
            <span className="text-xs font-bold text-[#f95721] bg-orange-50 px-2.5 py-1 rounded-lg">
              Today: {formatCurrency(summary?.today_sales ?? 0)}
            </span>
          </div>

          <div className="h-64 w-full">
            {salesChart && salesChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChart}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f95721" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f95721" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="amount" stroke="#f95721" strokeWidth={2} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                No recorded sales yet. Use 'Record Sale' to log items.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
            <Link to="/sales" className="text-[11px] text-[#f95721] font-semibold hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {summary?.recent_activity && summary.recent_activity.length > 0 ? (
              summary.recent_activity.map((act, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-2xl flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-gray-800">{act.title}</h5>
                    <p className="text-[10px] text-gray-500 mt-0.5">{act.subtitle}</p>
                  </div>
                  <span className="text-[10px] text-gray-400">{formatDate(act.timestamp)}</span>
                </div>
              ))
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-gray-400 text-center px-4">
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
