import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Clock,
  ShoppingCart,
  Store,
  ArrowRight,
  ArrowLeft,
  Building2,
  User as UserIcon,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from './AuthContext';
import { User, Shop } from '@/types';

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    shop_name: '',
    shop_type: 'Kirana Store',
    phone: '',
    name: '',
    email: '',
    password: '',
    confirm_password: '',
    address: '',
    city: '',
    state: 'Telangana',
    pincode: '',
    landmark: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateStep1 = () => {
    if (!formData.shop_name.trim()) return 'Please enter your shop name';
    if (!formData.phone.trim()) return 'Please enter your contact phone number';
    return null;
  };

  const validateStep2 = () => {
    if (!formData.name.trim()) return 'Please enter your full name';
    if (!formData.email.trim() || !formData.email.includes('@')) return 'Please enter a valid email address';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirm_password) return 'Passwords do not match';
    return null;
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) return setError(err);
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) return setError(err);
      setStep(3);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        shop_name: formData.shop_name,
        shop_type: formData.shop_type,
        phone: formData.phone,
        address: formData.address,
        city: formData.city || 'Hyderabad',
        state: formData.state,
        pincode: formData.pincode,
      };

      const res = await api.post<{ token: string; user: User; shop: Shop }>('/auth/register', payload);
      login(res.token, res.user, res.shop);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to complete shop registration');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Shop Details', desc: 'Basic information' },
    { num: 2, title: 'Owner Details', desc: 'Your information' },
    { num: 3, title: 'Location', desc: 'Shop address' },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Outer Card matching Reference 2 & Reference 3 */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px]">
        {/* Left Side: Illustration and value props */}
        <div className="md:col-span-5 bg-gradient-to-b from-orange-50/50 to-white p-8 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#f95721] flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                N
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-900">
                  NUTANA <span className="text-[#f95721]">AI</span>
                </h1>
                <p className="text-xs text-gray-500 font-medium">Zero-Waste Grocery Intelligence</p>
              </div>
            </div>

            <div className="space-y-3.5 mt-8">
              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Manage Your Stock</h4>
                  <p className="text-[10px] text-gray-500">Keep accurate inventory records</p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Reduce Food Waste</h4>
                  <p className="text-[10px] text-gray-500">Get expiry alerts on time</p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Smart Recommendations</h4>
                  <p className="text-[10px] text-gray-500">Know what to sell, markdown, or order</p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Connect with Nearby Shops</h4>
                  <p className="text-[10px] text-gray-500">Exchange surplus or find needed stock</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 pt-6">
            Already registered?{' '}
            <Link to="/login" className="text-[#f95721] font-bold hover:underline">
              Sign in to your shop
            </Link>
          </div>
        </div>

        {/* Right Side: Step Progress & Registration Fields matching Reference 2 & 3 */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          {/* Step Timeline Indicator */}
          <div className="flex items-center justify-between mb-8 max-w-lg mx-auto w-full px-2">
            {stepsList.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === s.num
                        ? 'bg-[#f95721] text-white ring-4 ring-orange-100'
                        : step > s.num
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-xs font-bold ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>{s.title}</p>
                    <p className="text-[10px] text-gray-400">{s.desc}</p>
                  </div>
                </div>
                {idx < stepsList.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? 'bg-orange-400' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {error && (
            <div className="mb-4 max-w-lg mx-auto w-full p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <div className="max-w-lg mx-auto w-full">
            {/* STEP 1: SHOP DETAILS */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900">Register Your Shop</h2>
                  <p className="text-xs text-gray-500 mt-1">Let's set up your NUTANA shop account</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Shop Name <span className="text-[#f95721]">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      name="shop_name"
                      value={formData.shop_name}
                      onChange={handleChange}
                      placeholder="e.g. Sri Lakshmi Stores"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] text-sm text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Shop Type <span className="text-[#f95721]">*</span>
                  </label>
                  <select
                    name="shop_type"
                    value={formData.shop_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] text-sm text-gray-900 bg-white"
                  >
                    <option value="Kirana Store">Kirana Store</option>
                    <option value="General Store">General Store</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Dairy / Milk Parlour">Dairy / Milk Parlour</option>
                    <option value="Mini-Market">Mini-Market</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number <span className="text-[#f95721]">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] text-sm text-gray-900 placeholder-gray-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full mt-4 py-3 bg-[#f95721] hover:bg-[#e04512] text-white font-bold rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: OWNER DETAILS */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900">Owner Details</h2>
                  <p className="text-xs text-gray-500 mt-1">Create your login credentials</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Owner Full Name <span className="text-[#f95721]">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Ramesh Reddy"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] text-sm text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address <span className="text-[#f95721]">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. ramesh@store.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] text-sm text-gray-900 placeholder-gray-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Password <span className="text-[#f95721]">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 6 characters"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Confirm Password <span className="text-[#f95721]">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] text-sm text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 py-3 bg-[#f95721] hover:bg-[#e04512] text-white font-bold rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: LOCATION (NON-MAP as required by prompt) */}
            {step === 3 && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900">Shop Location</h2>
                  <p className="text-xs text-gray-500 mt-1">Enter your store address and locality</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Shop Address <span className="text-[#f95721]">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g. 12-3-45, Main Road, Near Bus Stop"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] text-sm text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">City / Town</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Hyderabad"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="e.g. Telangana"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] text-sm text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="e.g. 500072"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Landmark (Optional)</label>
                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      placeholder="e.g. Opp. State Bank"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#f95721] focus:ring-1 focus:ring-[#f95721] text-sm text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-[#f95721] hover:bg-[#e04512] text-white font-bold rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? 'Creating Shop...' : 'Complete Registration'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
