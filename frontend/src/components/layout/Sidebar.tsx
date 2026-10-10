import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClockAlert,
  Sparkles,
  Store,
  ArrowLeftRight,
  Truck,
  BarChart3,
  MessageSquareHeart,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';

interface SidebarProps {
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onMobileClose }) => {
  const { logout, shop } = useAuth();

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'All Products', to: '/inventory', icon: Package },
    { name: 'Record Sale', to: '/sales/new', icon: ShoppingCart },
    { name: 'Expiry Alerts', to: '/expiry', icon: ClockAlert },
    { name: 'Smart Suggestions', to: '/recommendations', icon: Sparkles },
    { name: 'Nearby Shops', to: '/exchange', icon: Store },
    { name: 'Transactions', to: '/transactions', icon: ArrowLeftRight },
    { name: 'Replenishment', to: '/replenishment', icon: Truck },
    { name: 'Reports', to: '/reports', icon: BarChart3 },
    { name: 'Feedback & Impact', to: '/feedback', icon: MessageSquareHeart },
    { name: 'Shop Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#111216] text-white flex flex-col h-full border-r border-gray-800 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-gray-800/80">
        <div className="w-9 h-9 rounded-xl bg-[#f95721] flex items-center justify-center font-black text-white text-lg tracking-wider shadow-md">
          N
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-xl tracking-wide text-white">NUTANA</span>
          <span className="text-[10px] text-gray-400 font-medium tracking-tight truncate max-w-[140px]">
            {shop?.name || 'Kirana Intelligence'}
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#f95721] text-white font-semibold shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Sign Out */}
      <div className="p-3 border-t border-gray-800/80">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
