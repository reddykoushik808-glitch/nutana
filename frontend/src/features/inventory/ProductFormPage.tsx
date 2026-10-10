import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { api } from '@/services/api';
import { Product } from '@/types';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  unit: z.string().min(1, 'Unit of measurement is required'),
  selling_price: z.number().min(0, 'Selling price must be positive'),
  minimum_stock_threshold: z.number().min(0, 'Threshold must be positive'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  notes: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export const ProductFormPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const isEdit = Boolean(productId);
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      category: 'Dairy',
      unit: 'packet',
      selling_price: 30,
      minimum_stock_threshold: 5,
    },
  });

  useEffect(() => {
    if (productId) {
      api.get<Product>(`/products/${productId}`).then((p) => {
        setValue('name', p.name);
        setValue('category', p.category);
        setValue('brand', p.brand || '');
        setValue('unit', p.unit);
        setValue('selling_price', p.selling_price);
        setValue('minimum_stock_threshold', p.minimum_stock_threshold);
        setValue('sku', p.sku || '');
        setValue('barcode', p.barcode || '');
      });
    }
  }, [productId, setValue]);

  const onSubmit = async (data: ProductFormValues) => {
    setServerError(null);
    try {
      if (isEdit) {
        await api.patch(`/products/${productId}`, data);
      } else {
        await api.post('/products', data);
      }
      navigate('/inventory');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Failed to save product catalogue item');
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header matching UI Reference 4 (Top Right) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/inventory"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-black"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-black tracking-tight">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-xs text-gray-500 font-medium">Define catalogue properties and pricing rules</p>
          </div>
        </div>
      </div>

      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
          {serverError}
        </div>
      )}

      {/* Form Card matching UI Reference 4 */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Product Name <span className="text-[#f95721]">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. Milk Packet (1L) or Wheat Flour (5kg)"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Category <span className="text-[#f95721]">*</span>
            </label>
            <select
              {...register('category')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721] bg-white"
            >
              <option value="Dairy">Dairy</option>
              <option value="Bakery">Bakery</option>
              <option value="Grains & Flours">Grains & Flours</option>
              <option value="Snacks & Packaged">Snacks & Packaged</option>
              <option value="Beverages">Beverages</option>
              <option value="Cooking & Oils">Cooking & Oils</option>
              <option value="Personal Care">Personal Care</option>
              <option value="General">General</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Brand (Optional)</label>
            <input
              type="text"
              {...register('brand')}
              placeholder="e.g. Amul, Britannia, Aashirvaad"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Unit of Measurement</label>
            <select
              {...register('unit')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721] bg-white"
            >
              <option value="packet">Packet</option>
              <option value="kg">Kilogram (kg)</option>
              <option value="g">Gram (g)</option>
              <option value="l">Liter (L)</option>
              <option value="ml">Milliliter (ml)</option>
              <option value="piece">Piece</option>
              <option value="box">Box</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Selling Price (₹) <span className="text-[#f95721]">*</span>
            </label>
            <input
              type="number"
              step="any"
              {...register('selling_price', { valueAsNumber: true })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
            {errors.selling_price && <p className="text-xs text-red-500 mt-1">{errors.selling_price.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Minimum Stock Threshold</label>
            <input
              type="number"
              step="any"
              {...register('minimum_stock_threshold', { valueAsNumber: true })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">SKU / Barcode (Optional)</label>
            <input
              type="text"
              {...register('sku')}
              placeholder="e.g. AMUL-MILK-1L"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
          </div>
        </div>

        {/* Action Controls matching Reference 4 (Cancel / Save Product) */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            to="/inventory"
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#f95721] hover:bg-[#e04512] text-white font-bold text-xs shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            {isSubmitting ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};
