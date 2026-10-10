import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, MessageSquareHeart, CheckCircle, Award } from 'lucide-react';
import { api } from '@/services/api';
import { formatDate } from '@/lib/utils';

import { STATIC_FEEDBACK } from '@/services/mockData';

export const FeedbackPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [decision, setDecision] = useState('accepted');

  const { data: feedbacks, isLoading } = useQuery<any[]>({
    queryKey: ['feedback-list'],
    queryFn: async () => {
      try {
        const res = await api.get<any[]>('/feedback');
        if (res && res.length > 0) return res;
        return STATIC_FEEDBACK;
      } catch {
        return STATIC_FEEDBACK;
      }
    },
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post('/feedback', {
        rating,
        comment,
        decision,
      }),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['feedback-list'] });
    },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Feedback & Impact</h1>
        <p className="text-xs text-gray-500 font-medium">
          Evaluate recommendation accuracy and measure zero-waste kirana impact
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Form Submission */}
        <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Submit Recommendation Feedback</h3>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Decision Outcome</label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#f95721] bg-white"
            >
              <option value="accepted">Accepted Recommendation</option>
              <option value="rejected">Rejected Recommendation</option>
              <option value="edited">Edited Quantities</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Accuracy Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-1.5 rounded-lg ${rating >= star ? 'text-amber-400' : 'text-gray-200'}`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Comments & Observations</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Markdown helped sell 15 milk packets before 2-day expiry."
              className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#f95721]"
            />
          </div>

          <button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
            className="w-full py-2.5 bg-[#f95721] hover:bg-[#e04512] text-white font-bold rounded-xl text-xs transition shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-60"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Log Feedback'}
          </button>
        </div>

        {/* Feedback History Log */}
        <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Recorded Feedback & Impact History</h3>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px]">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-gray-400">Loading history...</div>
            ) : (feedbacks || []).length === 0 ? (
              <div className="py-16 text-center text-xs text-gray-400">
                No feedback logged yet. Track recommendation outcomes to calibrate model confidence over time.
              </div>
            ) : (
              feedbacks?.map((f) => (
                <div key={f.id} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 capitalize">{f.decision}</span>
                    <div className="flex items-center text-amber-400 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-current mr-1" /> {f.rating}/5
                    </div>
                  </div>
                  {f.comment && <p className="text-xs text-gray-600 mt-1">{f.comment}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
