import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { api } from '@/services/api';
import { Settings, Shield, Store, Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, shop, refetchUser } = useAuth();

  const [shopName, setShopName] = useState(shop?.name || '');
  const [shopType, setShopType] = useState(shop?.shop_type || 'Kirana Store');
  const [phone, setPhone] = useState(shop?.contact_phone || '');
  const [currency, setCurrency] = useState(shop?.currency || 'INR');
  const [warnDays, setWarnDays] = useState(shop?.expiry_warning_days || 7);
  const [critDays, setCritDays] = useState(shop?.expiry_critical_days || 3);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [shopMsg, setShopMsg] = useState<string | null>(null);

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setShopMsg(null);
    try {
      await api.patch('/shop', {
        name: shopName,
        shop_type: shopType,
        contact_phone: phone,
        currency,
        expiry_warning_days: Number(warnDays),
        expiry_critical_days: Number(critDays),
      });
      await refetchUser();
      setShopMsg('Shop settings updated successfully');
    } catch {
      setShopMsg('Failed to update shop settings');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPwd,
        new_password: newPwd,
      });
      setCurrentPwd('');
      setNewPwd('');
      setPwdMsg('Password updated successfully');
    } catch {
      setPwdMsg('Failed to update password');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Shop Profile & Settings</h1>
        <p className="text-xs text-gray-500 font-medium">Manage store configuration, thresholds, and account security</p>
      </div>

      {/* Shop Profile Settings */}
      <form onSubmit={handleUpdateShop} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Store className="w-4 h-4 text-[#f95721]" /> Store Preferences & Thresholds
        </h3>

        {shopMsg && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl font-medium">
            {shopMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Shop Name</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Shop Type</label>
            <select
              value={shopType}
              onChange={(e) => setShopType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721] bg-white"
            >
              <option value="Kirana Store">Kirana Store</option>
              <option value="General Store">General Store</option>
              <option value="Bakery">Bakery</option>
              <option value="Dairy / Milk Parlour">Dairy / Milk Parlour</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Currency</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Expiry Warning Window (Days)</label>
            <input
              type="number"
              value={warnDays}
              onChange={(e) => setWarnDays(parseInt(e.target.value) || 7)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Critical Expiry Window (Days)</label>
            <input
              type="number"
              value={critDays}
              onChange={(e) => setCritDays(parseInt(e.target.value) || 3)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 bg-[#f95721] hover:bg-[#e04512] text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition cursor-pointer"
        >
          Save Shop Settings
        </button>
      </form>

      {/* Account Security Password Change */}
      <form onSubmit={handleUpdatePassword} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-800" /> Account Security & Password
        </h3>

        {pwdMsg && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-xl font-medium">
            {pwdMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
        >
          Change Password
        </button>
      </form>
    </div>
  );
};
