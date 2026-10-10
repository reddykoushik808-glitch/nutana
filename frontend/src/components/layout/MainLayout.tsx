import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/features/auth/AuthContext';
import { Menu, X, Bell, User as UserIcon, Search } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f95721]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 w-64 max-w-xs h-full bg-[#111216]">
            <Sidebar onMobileClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header matching reference images */}
        <header className="h-16 bg-white border-b border-gray-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-black rounded-lg hover:bg-gray-100"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Quick search input */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-100/80 px-3.5 py-1.5 rounded-xl text-gray-500 w-72 text-sm focus-within:ring-2 focus-within:ring-[#f95721]/30 focus-within:bg-white transition-all">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, stock, or suggestions..."
                className="bg-transparent border-none outline-none w-full text-xs text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#f95721] rounded-full" />
            </button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-[#f95721] flex items-center justify-center font-bold text-xs">
                {user?.name?.[0]?.toUpperCase() || <UserIcon className="w-4 h-4" />}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-gray-900 leading-tight">Hi, {user?.name || 'Owner'}</span>
                <span className="text-[10px] text-gray-500 font-medium">Store Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable page body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
