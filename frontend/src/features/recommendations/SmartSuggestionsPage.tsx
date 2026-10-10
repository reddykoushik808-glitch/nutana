import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  TrendingDown,
  ArrowRightLeft,
  Truck,
  Check,
  X,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/services/api';
import { Recommendation } from '@/types';

export const SmartSuggestionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>('all');

  const { data: recommendations, isLoading } = useQuery<Recommendation[]>({
    queryKey: ['recommendations'],
    queryFn: () => api.get<Recommendation[]>('/recommendations'),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post('/recommendations/generate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });

  const decisionMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: string }) =>
      api.post(`/recommendations/${id}/decision`, { decision }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const filtered = (recommendations || []).filter((r) => {
    if (filterType === 'all') return true;
    return r.recommendation_type === filterType;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header matching UI Reference 4 (Bottom Left: "Smart Suggestions") */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Smart Suggestions</h1>
          <p className="text-xs text-gray-500 font-medium">
            Get recommendations to reduce waste and increase grocery sales
          </p>
        </div>

        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f95721] hover:bg-[#e04512] text-white text-xs font-bold transition shadow-sm cursor-pointer self-start sm:self-auto disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
          Run AI Multi-Agent Analysis
        </button>
      </div>

      {/* Filter Tabs matching Reference 4 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', 'markdown', 'transfer', 'replenishment'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterType === type
                ? 'bg-[#f95721] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:text-black border border-gray-100'
            }`}
          >
            {type === 'all'
              ? 'All Suggestions'
              : type === 'markdown'
              ? 'Discount Suggestions'
              : type === 'transfer'
              ? 'Surplus Transfers'
              : 'Replenishment'}
          </button>
        ))}
      </div>

      {/* Cards Grid matching Reference 4 */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-gray-400">Evaluating multi-agent suggestions...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
          <Sparkles className="w-10 h-10 text-[#f95721] mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-bold text-gray-900">No Pending Suggestions</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Click 'Run AI Multi-Agent Analysis' to re-scan expiry windows, sales velocity, and stock thresholds.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((rec) => (
            <div
              key={rec.id}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      rec.recommendation_type === 'markdown'
                        ? 'bg-orange-50 text-[#f95721]'
                        : rec.recommendation_type === 'transfer'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-purple-50 text-purple-600'
                    }`}
                  >
                    {rec.recommendation_type.toUpperCase()}
                  </span>

                  <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {Math.round(rec.confidence * 100)}% Confidence
                  </span>
                </div>

                <h4 className="text-sm font-bold text-gray-900 leading-snug">{rec.suggested_action}</h4>

                <div className="mt-3.5 space-y-2 text-xs">
                  <div className="p-2.5 bg-gray-50 rounded-xl">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Evidence</p>
                    <p className="text-[11px] text-gray-700 font-medium mt-0.5">{rec.evidence}</p>
                  </div>

                  <div className="p-2.5 bg-orange-50/50 rounded-xl border border-orange-100/50">
                    <p className="text-[10px] text-[#f95721] font-bold uppercase">Estimated Benefit</p>
                    <p className="text-[11px] text-gray-800 font-semibold mt-0.5">{rec.estimated_benefit}</p>
                  </div>
                </div>
              </div>

              {/* Action Controls matching UI Reference 4 */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                {rec.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => decisionMutation.mutate({ id: rec.id, decision: 'rejected' })}
                      className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition cursor-pointer flex-1"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => decisionMutation.mutate({ id: rec.id, decision: 'approved' })}
                      className="px-4 py-2 rounded-xl bg-[#f95721] hover:bg-[#e04512] text-white font-bold text-xs shadow-md shadow-orange-500/20 transition cursor-pointer flex-1"
                    >
                      Apply Suggestion
                    </button>
                  </>
                ) : (
                  <span className="w-full text-center py-1.5 text-xs font-bold text-gray-500 bg-gray-100 rounded-xl">
                    Status: {rec.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
