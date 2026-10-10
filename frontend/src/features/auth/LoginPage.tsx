import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, ArrowRight, CheckCircle2, TrendingUp, Clock, ShoppingCart, Store } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from './AuthContext';
import { User, Shop } from '@/types';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'ramesh@kirana.com',
      password: 'password123',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    const demoUser: User = {
      id: 'demo-user-1',
      name: 'Ramesh Reddy',
      email: 'ramesh@kirana.com',
      role: 'owner',
      shop_id: 'demo-shop',
    };
    const demoShop: Shop = {
      id: 'demo-shop',
      name: 'Sri Lakshmi Stores',
      shop_type: 'Kirana Store',
      contact_phone: '+91 98765 43210',
      currency: 'INR',
      expiry_warning_days: 7,
      expiry_critical_days: 3,
    };

    // If using the demo credentials, sign in directly to avoid database connection failure
    if (data.email.toLowerCase() === 'ramesh@kirana.com' && data.password === 'password123') {
      login('demo-jwt-token', demoUser, demoShop);
      navigate('/dashboard', { replace: true });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await api.post<{ token: string; user: User; shop: Shop }>('/auth/login', data);
      login(res.token, res.user, res.shop);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Invalid email or password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Outer Card matching Reference 1 */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Side: Illustration and value props */}
        <div className="md:col-span-6 bg-gradient-to-b from-orange-50/60 to-white p-8 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
          <div>
            {/* Header Brand */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                <img src="/nutana-logo.png" alt="Nutana Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-900">
                  NUTANA <span className="text-[#f95721]">AI</span>
                </h1>
                <p className="text-xs text-gray-500 font-medium">Zero-Waste Grocery Intelligence for Kirana Stores</p>
              </div>
            </div>

            {/* 4 Feature Pills matching Reference Image 1 */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Manage Stock</h4>
                  <p className="text-[10px] text-gray-500">Accurate inventory</p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Reduce Waste</h4>
                  <p className="text-[10px] text-gray-500">Timely expiry alerts</p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Smart Advice</h4>
                  <p className="text-[10px] text-gray-500">Markdowns & orders</p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Nearby Shops</h4>
                  <p className="text-[10px] text-gray-500">Surplus stock trade</p>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Kirana Store illustration backdrop info */}
          <div className="mt-8 bg-orange-500/5 rounded-2xl p-5 border border-orange-500/10">
            <div className="flex items-center gap-2 text-[#f95721] font-semibold text-xs mb-1">
              <CheckCircle2 className="w-4 h-4" /> Built for real small-store operating conditions
            </div>
            <p className="text-xs text-gray-600">
              Deterministic FEFO stock tracking, instant billing, and zero-waste suggestions built specifically for Indian retail.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form matching Reference 1 */}
        <div className="md:col-span-6 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">Welcome Back!</h2>
            <p className="text-sm text-gray-500 mb-4 font-medium">Sign in to your NUTANA account</p>

            {/* Static Login Credentials Banner */}
            <div className="mb-4 p-3.5 bg-orange-50/80 border border-orange-200/80 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#f95721] uppercase tracking-wider">Demo Login Credentials</span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-orange-600 font-bold border border-orange-100">Click to fill</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setValue('email', 'ramesh@kirana.com');
                    setValue('password', 'password123');
                  }}
                  className="text-left bg-white p-2 rounded-xl border border-orange-100 hover:border-orange-300 transition"
                >
                  <p className="text-[10px] text-gray-400 font-semibold">Email</p>
                  <p className="font-bold text-gray-900 truncate">ramesh@kirana.com</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('email', 'ramesh@kirana.com');
                    setValue('password', 'password123');
                  }}
                  className="text-left bg-white p-2 rounded-xl border border-orange-100 hover:border-orange-300 transition"
                >
                  <p className="text-[10px] text-gray-400 font-semibold">Password</p>
                  <p className="font-bold text-gray-900">password123</p>
                </button>
              </div>
            </div>

            {serverError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email or Username</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="e.g. shopowner@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] text-sm text-gray-900 placeholder-gray-400"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">Password</label>
                  <button type="button" className="text-xs text-[#f95721] hover:underline font-semibold">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] text-sm text-gray-900 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 bg-[#f95721] hover:bg-[#e04512] text-white font-bold rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center pt-4">
                <p className="text-xs text-gray-500">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-[#f95721] font-bold hover:underline">
                    Register Your Shop
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
