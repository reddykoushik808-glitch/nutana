import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  Layers,
  Clock,
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/services/api';
import { Product } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export const InventoryListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusTab, setStatusTab] = useState<'all' | 'low_stock' | 'expiring_soon'>('all');

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products', categoryFilter, search],
    queryFn: () => {
      let url = `/products?`;
      if (categoryFilter !== 'All') url += `&category=${encodeURIComponent(categoryFilter)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      return api.get<Product[]>(url);
    },
  });

  const filteredProducts = (products || []).filter((p) => {
    if (statusTab === 'low_stock') return p.stock_status === 'Low Stock';
    if (statusTab === 'expiring_soon') return p.stock_status === 'Expiring Soon';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Stock':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            In Stock
          </span>
        );
      case 'Low Stock':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Low Stock
          </span>
        );
      case 'Expiring Soon':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            Expiring Soon
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-600">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Out of Stock
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header matching UI Reference 4 (Top Center) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">All Products</h1>
          <p className="text-xs text-gray-500 font-medium">Manage product catalogue and batch-specific inventory</p>
        </div>

        <Link
          to="/inventory/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f95721] hover:bg-[#e04512] text-white text-xs font-bold transition shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Tabs & Search Filter Bar matching Reference 4 */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setStatusTab('all')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusTab === 'all' ? 'bg-[#f95721] text-white shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            All ({products?.length || 0})
          </button>
          <button
            onClick={() => setStatusTab('low_stock')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusTab === 'low_stock' ? 'bg-[#f95721] text-white shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            Low Stock ({products?.filter((p) => p.stock_status === 'Low Stock').length || 0})
          </button>
          <button
            onClick={() => setStatusTab('expiring_soon')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusTab === 'expiring_soon' ? 'bg-[#f95721] text-white shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            Expiring Soon ({products?.filter((p) => p.stock_status === 'Expiring Soon').length || 0})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or sku..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#f95721]"
          />
        </div>
      </div>

      {/* Products Table matching UI Reference 4 */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <th className="py-4 px-6">Product Name</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4">Stock</th>
                <th className="py-4 px-4">Price</th>
                <th className="py-4 px-4">Expiry Date</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Loading inventory catalogue...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-700">No products found</p>
                    <p className="text-xs text-gray-400 mt-1">Add items or adjust your filter query</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#f95721] flex items-center justify-center font-bold text-xs shrink-0">
                          {p.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{p.name}</p>
                          {p.sku && <p className="text-[10px] text-gray-400">SKU: {p.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-600">{p.category}</td>
                    <td className="py-4 px-4 font-bold text-gray-900">
                      {p.available_quantity} {p.unit}
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-900">{formatCurrency(p.selling_price)}</td>
                    <td className="py-4 px-4 text-gray-500 font-medium">{formatDate(p.nearest_expiry)}</td>
                    <td className="py-4 px-4">{getStatusBadge(p.stock_status)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/inventory/${p.id}/batches/new`}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-orange-50 text-[#f95721] hover:bg-orange-100 transition"
                        >
                          + Batch
                        </Link>
                        <Link
                          to={`/inventory/${p.id}/edit`}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
