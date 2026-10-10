import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Calendar, Layers } from 'lucide-react';
import { api } from '@/services/api';
import { Product } from '@/types';

const batchSchema = z.object({
  quantity_received: z.number().gt(0, 'Quantity received must be greater than zero'),
  unit_purchase_cost: z.number().min(0, 'Purchase cost must be zero or greater'),
  batch_number: z.string().optional(),
  purchase_date: z.string().optional(),
  expiry_date: z.string().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

type BatchFormValues = z.infer<typeof batchSchema>;

export const AddBatchPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      quantity_received: 10,
      unit_purchase_cost: 25,
      purchase_date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (productId) {
      api.get<Product>(`/products/${productId}`).then(setProduct);
    }
  }, [productId]);

  const onSubmit = async (data: BatchFormValues) => {
    setServerError(null);
    try {
      const payload = {
        ...data,
        product_id: productId,
        purchase_date: data.purchase_date ? new Date(data.purchase_date).toISOString() : undefined,
        expiry_date: data.expiry_date ? new Date(data.expiry_date).toISOString() : undefined,
      };

      await api.post(`/products/${productId}/batches`, payload);
      navigate('/inventory');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Failed to add inventory batch');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/inventory"
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-black tracking-tight">Add Inventory Batch</h1>
          <p className="text-xs text-gray-500 font-medium">
            Record physical stock received for <span className="font-bold text-gray-900">{product?.name}</span>
          </p>
        </div>
      </div>

      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Quantity Received ({product?.unit || 'units'}) <span className="text-[#f95721]">*</span>
            </label>
            <input
              type="number"
              step="any"
              {...register('quantity_received', { valueAsNumber: true })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
            {errors.quantity_received && <p className="text-xs text-red-500 mt-1">{errors.quantity_received.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Unit Purchase Cost (₹) <span className="text-[#f95721]">*</span>
            </label>
            <input
              type="number"
              step="any"
              {...register('unit_purchase_cost', { valueAsNumber: true })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
            {errors.unit_purchase_cost && <p className="text-xs text-red-500 mt-1">{errors.unit_purchase_cost.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Batch / Lot Identifier</label>
            <input
              type="text"
              {...register('batch_number')}
              placeholder="e.g. LOT-2026-04A"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Expiry Date</label>
            <input
              type="date"
              {...register('expiry_date')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
            <p className="text-[10px] text-gray-400 mt-1">Leave empty only for non-perishable goods</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Supplier</label>
            <input
              type="text"
              {...register('supplier')}
              placeholder="e.g. Metro Cash & Carry, Local Distributor"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Purchase Date</label>
            <input
              type="date"
              {...register('purchase_date')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f95721]"
            />
          </div>
        </div>

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
            {isSubmitting ? 'Recording...' : 'Add Batch Stock'}
          </button>
        </div>
      </form>
    </div>
  );
};
