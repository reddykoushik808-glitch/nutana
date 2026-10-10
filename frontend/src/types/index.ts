export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  shop_id: string;
}

export interface Shop {
  id: string;
  name: string;
  shop_type: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  currency: string;
  expiry_warning_days: number;
  expiry_critical_days: number;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category: string;
  brand?: string;
  unit: string;
  selling_price: number;
  minimum_stock_threshold: number;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  batch_count: number;
  nearest_expiry?: string;
  stock_status: "In Stock" | "Low Stock" | "Expiring Soon" | "Out of Stock";
  is_active: boolean;
}

export interface Batch {
  id: string;
  shop_id: string;
  product_id: string;
  product_name?: string;
  batch_number?: string;
  quantity_received: number;
  quantity_available: number;
  quantity_reserved: number;
  unit_purchase_cost: number;
  purchase_date: string;
  expiry_date?: string;
  supplier?: string;
  status: string;
  days_until_expiry?: number;
}

export interface SaleLineItem {
  product_id: string;
  product_name: string;
  unit: string;
  quantity: number;
  unit_selling_price: number;
  discount: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  sale_reference: string;
  sold_at: string;
  line_items: SaleLineItem[];
  gross_total: number;
  discount_total: number;
  net_total: number;
  status: string;
}

export interface Recommendation {
  id: string;
  recommendation_type: "markdown" | "transfer" | "replenishment" | "freshness_alert";
  product_id?: string;
  product_name?: string;
  batch_id?: string;
  suggested_action: string;
  evidence: string;
  assumptions: string;
  confidence: number;
  estimated_benefit?: string;
  status: "pending" | "approved" | "rejected" | "dismissed";
  created_at: string;
}

export interface Transaction {
  id: string;
  sender_shop_id: string;
  sender_shop_name: string;
  receiver_shop_id: string;
  receiver_shop_name: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  agreed_price: number;
  total_amount: number;
  status: string;
  terms?: string;
  created_at: string;
}

export interface ReplenishmentSuggestion {
  product_id: string;
  product_name: string;
  category: string;
  unit: string;
  available_quantity: number;
  reserved_quantity: number;
  minimum_threshold: number;
  suggested_order_quantity: number;
  estimated_daily_demand: number;
  lead_time_days: number;
  estimated_unit_cost: number;
  confidence: number;
}

export interface DashboardSummary {
  total_products: number;
  total_available_units: number;
  inventory_cost_value: number;
  today_sales: number;
  expiring_soon_count: number;
  estimated_spoilage_exposure: number;
  low_stock_count: number;
  pending_recommendations: number;
  recent_activity: { title: string; subtitle: string; timestamp: string }[];
}
