import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, Search, ArrowRightLeft, Send, Plus, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';
import { formatCurrency } from '@/lib/utils';

import { STATIC_OFFERS, STATIC_PARTNER_SHOPS } from '@/services/mockData';

export const NearbyExchangePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'surplus' | 'partners'>('surplus');
  const [search, setSearch] = useState('');
  const [selectedShop, setSelectedShop] = useState<any | null>(null);
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [reqQuantity, setReqQuantity] = useState(5);
  const [reqPrice, setReqPrice] = useState(20);

  // Offers from partner stores
  const { data: offers, isLoading: isOffersLoading } = useQuery<any[]>({
    queryKey: ['exchange-offers'],
    queryFn: async () => {
      try {
        const res = await api.get<any[]>('/exchange/offers');
        if (res && res.length > 0) return res;
        return STATIC_OFFERS;
      } catch {
        return STATIC_OFFERS;
      }
    },
  });

  // Participating partner shops
  const { data: partnerShops, isLoading: isShopsLoading } = useQuery<any[]>({
    queryKey: ['exchange-shops', search],
    queryFn: async () => {
      try {
        const res = await api.get<any[]>(`/exchange/shops?search=${encodeURIComponent(search)}`);
        if (res && res.length > 0) return res;
        return STATIC_PARTNER_SHOPS.filter(
          (s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.locality.toLowerCase().includes(search.toLowerCase())
        );
      } catch {
        return STATIC_PARTNER_SHOPS.filter(
          (s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.locality.toLowerCase().includes(search.toLowerCase())
        );
      }
    },
  });

  const requestMutation = useMutation({
    mutationFn: (data: any) => api.post('/exchange/requests', data),
    onSuccess: () => {
      setReqModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['exchange-offers'] });
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header matching Reference 4 (Bottom Center) & Reference 5 (Bottom) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Nearby Shops</h1>
          <p className="text-xs text-gray-500 font-medium">
            Connect with local retailers to exchange surplus stock and eliminate waste (Non-map directory)
          </p>
        </div>

        {/* Tab switch matching UI Reference 5: "Shops with Surplus" / "Partner Stores" */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('surplus')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'surplus' ? 'bg-[#f95721] text-white shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            Shops with Surplus
          </button>
          <button
            onClick={() => setActiveTab('partners')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'partners' ? 'bg-[#f95721] text-white shadow-xs' : 'text-gray-600 hover:text-black'
            }`}
          >
            Participating Stores
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search participating stores or surplus products..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#f95721]"
          />
        </div>
      </div>

      {/* Content depending on Tab matching UI Reference 5 (Bottom) */}
      {activeTab === 'surplus' ? (
        <div className="space-y-4">
          {isOffersLoading ? (
            <div className="py-12 text-center text-xs text-gray-400">Loading surplus exchange offers...</div>
          ) : (offers || []).length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
              <Store className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-900">No Public Surplus Offers Available</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No nearby store has listed extra inventory for transfer right now. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offers?.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-gray-900">{offer.sender_shop_name}</span>
                      <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">Verified Shop</span>
                    </div>

                    <div className="flex items-center gap-3 my-2">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#f95721] flex items-center justify-center font-bold text-sm">
                        {offer.product_name[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{offer.product_name}</h4>
                        <p className="text-xs text-gray-500">
                          Surplus: <span className="font-semibold text-gray-800">{offer.quantity} {offer.unit}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs">
                      <span className="text-gray-500">Asking Price:</span>
                      <span className="font-extrabold text-[#f95721]">{formatCurrency(offer.agreed_price)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedShop(offer);
                      setReqQuantity(offer.quantity);
                      setReqPrice(offer.agreed_price);
                      setReqModalOpen(true);
                    }}
                    className="w-full mt-4 py-2.5 bg-[#f95721] hover:bg-[#e04512] text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 transition cursor-pointer"
                  >
                    Request Transfer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Participating Stores Directory matching UI Reference 4 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isShopsLoading ? (
            <div className="col-span-full py-12 text-center text-xs text-gray-400">Loading store directory...</div>
          ) : (partnerShops || []).length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-gray-100">
              <Store className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-900">No other registered shops found yet</h3>
              <p className="text-xs text-gray-400 mt-1">As more retailers join NUTANA, they will be discoverable here.</p>
            </div>
          ) : (
            partnerShops?.map((shop) => (
              <div
                key={shop.id}
                className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{shop.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{shop.shop_type} • {shop.locality}</p>
                  <p className="text-[11px] text-[#f95721] font-semibold mt-1">
                    {shop.active_offers_count} surplus items available
                  </p>
                </div>

                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition"
                >
                  Send Message
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Request Modal */}
      {reqModalOpen && selectedShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Request Stock Transfer</h3>
            <p className="text-xs text-gray-500">
              Initiate a formal cross-shop transaction with <span className="font-bold">{selectedShop.sender_shop_name}</span>
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Transfer Quantity</label>
              <input
                type="number"
                min="1"
                max={selectedShop.quantity}
                value={reqQuantity}
                onChange={(e) => setReqQuantity(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Offered Unit Price (₹)</label>
              <input
                type="number"
                min="0"
                value={reqPrice}
                onChange={(e) => setReqPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setReqModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  requestMutation.mutate({
                    target_shop_id: selectedShop.sender_shop_id,
                    product_id: selectedShop.product_id,
                    quantity: reqQuantity,
                    offered_price: reqPrice,
                    terms: 'Standard hand-off transfer',
                  })
                }
                className="flex-1 py-2.5 bg-[#f95721] text-white rounded-xl text-xs font-bold hover:bg-[#e04512]"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
