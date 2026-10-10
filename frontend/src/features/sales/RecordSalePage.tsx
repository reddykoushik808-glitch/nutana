import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Trash2,
  Minus,
  CheckCircle,
  AlertCircle,
  Receipt,
  ShoppingCart,
} from 'lucide-react';
import { api } from '@/services/api';
import { Product, Sale } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
}

export const RecordSalePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: products } = useQuery<Product[]>({
    queryKey: ['products-for-sale', searchTerm],
    queryFn: () => api.get<Product[]>(`/products?search=${encodeURIComponent(searchTerm)}`),
  });

  const addToCart = (product: Product) => {
    setErrorMessage(null);
    const existing = cart.find((i) => i.product.id === product.id);
    if (existing) {
      if (existing.quantity + 1 > product.available_quantity) {
        setErrorMessage(`Cannot exceed available stock of ${product.available_quantity} ${product.unit}`);
        return;
      }
      setCart(
        cart.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
      );
    } else {
      if (product.available_quantity < 1) {
        setErrorMessage(`Product ${product.name} has no available sellable stock!`);
        return;
      }
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          unit_price: product.selling_price,
          discount: 0,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setErrorMessage(null);
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.available_quantity) {
              setErrorMessage(`Cannot exceed available stock (${item.product.available_quantity})`);
              return item;
            }
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, discount: Math.max(0, discount) } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((i) => i.product.id !== productId));
  };

  const totalAmount = cart.reduce(
    (acc, item) => acc + Math.max(0, item.quantity * item.unit_price - item.discount),
    0
  );

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        line_items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_selling_price: i.unit_price,
          discount: i.discount,
        })),
      };

      await api.post<Sale>('/sales', payload);
      navigate('/sales');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to complete sale deduction');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header matching Reference 5 (Top: "6. Sales Entry") */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Record a Sale</h1>
          <p className="text-xs text-gray-500 font-medium">
            Fast FEFO stock deduction and customer billing checkout
          </p>
        </div>

        <div className="text-xs text-gray-500 font-semibold bg-white px-3.5 py-1.5 rounded-xl border border-gray-200 shadow-xs self-start sm:self-auto">
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* POS Checkout Layout matching UI Reference 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Product Selection Search & Quick Catalogue */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Product Search</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search product name or SKU..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#f95721]"
              />
            </div>

            <div className="divide-y divide-gray-100 max-h-[460px] overflow-y-auto">
              {products?.map((p) => (
                <div
                  key={p.id}
                  className="py-3 flex items-center justify-between hover:bg-gray-50/80 px-2 rounded-xl transition cursor-pointer"
                  onClick={() => addToCart(p)}
                >
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">{p.name}</h5>
                    <p className="text-[10px] text-gray-500">
                      Avail: {p.available_quantity} {p.unit} • {formatCurrency(p.selling_price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={p.available_quantity <= 0}
                    className="p-1.5 rounded-lg bg-orange-50 text-[#f95721] hover:bg-[#f95721] hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {products?.length === 0 && (
                <div className="py-8 text-center text-xs text-gray-400">No matching products found</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Selected Sale Items Table matching Reference 5 */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#f95721]" /> Active Sale Basket
            </h3>

            {cart.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <ShoppingCart className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-600">No items selected</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Click products on the left to add to sale</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase">
                      <th className="py-2.5">Product</th>
                      <th className="py-2.5">Stock</th>
                      <th className="py-2.5">Sell Qty</th>
                      <th className="py-2.5">Price</th>
                      <th className="py-2.5">Discount</th>
                      <th className="py-2.5 text-right">Total</th>
                      <th className="py-2.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cart.map((item) => (
                      <tr key={item.product.id}>
                        <td className="py-3 font-bold text-gray-900">{item.product.name}</td>
                        <td className="py-3 text-gray-500">
                          {item.product.available_quantity} {item.product.unit}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-xl w-fit">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="text-gray-500 hover:text-black font-bold"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-xs px-1 text-gray-900">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="text-gray-500 hover:text-black font-bold"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 font-semibold text-gray-900">{formatCurrency(item.unit_price)}</td>
                        <td className="py-3">
                          <input
                            type="number"
                            min="0"
                            value={item.discount}
                            onChange={(e) => updateDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs"
                          />
                        </td>
                        <td className="py-3 font-bold text-gray-900 text-right">
                          {formatCurrency(Math.max(0, item.quantity * item.unit_price - item.discount))}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom Total & Record Sale Button matching Reference 5 */}
          <div className="pt-6 border-t border-gray-100 mt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-600">Total Amount:</span>
              <span className="text-2xl font-black text-[#f95721]">{formatCurrency(totalAmount)}</span>
            </div>

            <button
              type="button"
              disabled={cart.length === 0 || isSubmitting}
              onClick={handleCompleteSale}
              className="w-full py-3.5 bg-[#f95721] hover:bg-[#e04512] text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all text-sm disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              {isSubmitting ? 'Recording Sale...' : 'Record Sale'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
