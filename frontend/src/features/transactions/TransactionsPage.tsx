import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, Check, X, CheckCheck } from 'lucide-react';
import { api } from '@/services/api';
import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/features/auth/AuthContext';

import { STATIC_TRANSACTIONS } from '@/services/mockData';

export const TransactionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { shop } = useAuth();

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      try {
        const res = await api.get<Transaction[]>('/transactions');
        if (res && res.length > 0) return res;
        return STATIC_TRANSACTIONS;
      } catch {
        return STATIC_TRANSACTIONS;
      }
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (txId: string) => api.post(`/transactions/${txId}/accept`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (txId: string) => api.post(`/transactions/${txId}/reject`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const confirmMutation = useMutation({
    mutationFn: (txId: string) => api.post(`/transactions/${txId}/confirm-handover`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Cross-Shop Transactions</h1>
        <p className="text-xs text-gray-500 font-medium">
          Secure multi-step stock exchange lifecycle with conditional batch reservations
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase bg-gray-50/50">
                <th className="py-4 px-6">Transaction</th>
                <th className="py-4 px-4">From Store</th>
                <th className="py-4 px-4">To Store</th>
                <th className="py-4 px-4">Item & Qty</th>
                <th className="py-4 px-4">Agreed Amount</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">Loading transactions...</td>
                </tr>
              ) : (transactions || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <ArrowLeftRight className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-700">No transactions recorded yet</p>
                    <p className="text-xs text-gray-400 mt-1">Cross-shop requests and transfers appear here</p>
                  </td>
                </tr>
              ) : (
                transactions?.map((t) => {
                  const isSender = t.sender_shop_id === shop?.id;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-4 px-6 font-bold text-gray-900">{t.id.slice(-6).toUpperCase()}</td>
                      <td className="py-4 px-4 font-semibold text-gray-800">{t.sender_shop_name}</td>
                      <td className="py-4 px-4 font-semibold text-gray-800">{t.receiver_shop_name}</td>
                      <td className="py-4 px-4 font-bold text-gray-900">
                        {t.product_name} ({t.quantity} {t.unit})
                      </td>
                      <td className="py-4 px-4 font-black text-gray-900">{formatCurrency(t.total_amount)}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          t.status === 'completed'
                            ? 'bg-green-50 text-green-700'
                            : t.status === 'accepted'
                            ? 'bg-blue-50 text-blue-700'
                            : t.status === 'requested'
                            ? 'bg-orange-50 text-[#f95721]'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isSender && t.status === 'requested' && (
                            <>
                              <button
                                onClick={() => acceptMutation.mutate(t.id)}
                                className="px-3 py-1 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
                              >
                                Accept & Reserve
                              </button>
                              <button
                                onClick={() => rejectMutation.mutate(t.id)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {t.status === 'accepted' && (
                            <button
                              onClick={() => confirmMutation.mutate(t.id)}
                              className="px-3 py-1 bg-[#f95721] text-white font-bold rounded-lg hover:bg-[#e04512] transition"
                            >
                              Confirm Handover
                            </button>
                          )}
                          {t.status === 'completed' && (
                            <span className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                              <CheckCheck className="w-3.5 h-3.5" /> Transferred
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
