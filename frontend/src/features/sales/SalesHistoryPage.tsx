import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Receipt, Plus, Calendar, ArrowRight } from 'lucide-react';
import { api } from '@/services/api';
import { Sale } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

import { STATIC_SALES_HISTORY } from '@/services/mockData';

export const SalesHistoryPage: React.FC = () => {
  const { data: sales, isLoading } = useQuery<Sale[]>({
    queryKey: ['sales-history'],
    queryFn: async () => {
      try {
        const res = await api.get<Sale[]>('/sales?limit=50');
        if (res && res.length > 0) return res;
        return STATIC_SALES_HISTORY as unknown as Sale[];
      } catch {
        return STATIC_SALES_HISTORY as unknown as Sale[];
      }
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Sales History</h1>
          <p className="text-xs text-gray-500 font-medium">Logged customer sales transactions and stock deductions</p>
        </div>

        <Link
          to="/sales/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f95721] hover:bg-[#e04512] text-white text-xs font-bold transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Sale
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <th className="py-4 px-6">Sale Reference</th>
                <th className="py-4 px-4">Date & Time</th>
                <th className="py-4 px-4">Line Items</th>
                <th className="py-4 px-4">Gross Total</th>
                <th className="py-4 px-4">Discount</th>
                <th className="py-4 px-4">Net Total</th>
                <th className="py-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Loading sales records...
                  </td>
                </tr>
              ) : (sales || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-700">No sales recorded yet</p>
                    <p className="text-xs text-gray-400 mt-1">Transactions will appear here when you log them</p>
                  </td>
                </tr>
              ) : (
                sales?.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900">{s.sale_reference}</td>
                    <td className="py-4 px-4 text-gray-500">{formatDate(s.sold_at)}</td>
                    <td className="py-4 px-4 font-medium text-gray-700">
                      {s.line_items.map((i) => `${i.product_name} (${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-4 px-4 text-gray-600">{formatCurrency(s.gross_total)}</td>
                    <td className="py-4 px-4 text-gray-600">{formatCurrency(s.discount_total)}</td>
                    <td className="py-4 px-4 font-black text-gray-900">{formatCurrency(s.net_total)}</td>
                    <td className="py-4 px-6 text-right">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700">
                        {s.status}
                      </span>
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
