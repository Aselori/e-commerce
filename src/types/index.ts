export type Category = {
  id: string;
  name: string;
  slug: string | null;
  created_at: string;
};

export type ProductType = "individual" | "kit";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  stock: number;
  category_id: string | null;
  type: ProductType;
  images: string[] | null;
  active: boolean;
  created_at: string;
  // Joined via select("*, category:categories(*)")
  category?: Category | null;
};

export type OrderStatus =
  | "pending"
  | "payment_review"
  | "confirmed"
  | "shipped"
  | "ready_for_pickup"
  | "delivered"
  | "cancelled";

export type DeliveryMethod = "shipping" | "pickup";

export type Order = {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  shipping_address: Record<string, unknown> | null;
  postal_code: string | null;
  shipping_cost: number | null;
  total: number;
  notes: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
};

export type PaymentReceipt = {
  id: string;
  order_id: string;
  image_url: string;
  uploaded_at: string;
  reviewed: boolean;
};
