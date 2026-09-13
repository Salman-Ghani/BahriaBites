export type OrderStatus = "Pending" | "Accepted" | "Preparing" | "Ready" | "Collected" | "Rejected";

export type AppUser = {
  id: string;
  customerId: string;
  name: string;
  email: string;
  program: string;
  balance: number;
};

export type AppStaff = {
  id: string;
  name: string;
  email: string;
  enabled: boolean;
  createdAt: number;
};

export type AppMenuItem = {
  id: number;
  name: string;
  category: "Meals" | "Snacks" | "Desserts" | "Drinks";
  price: number;
  image: string;
  description: string;
  rating: number;
  popular?: boolean;
  available: boolean;
};

export type AppOrderItem = {
  id: string;
  productId: number;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  extras: string[];
  lineTotal: number;
};

export type AppOrder = {
  id: string;
  customerUserId: string;
  customerId: string;
  customerName: string;
  items: AppOrderItem[];
  total: number;
  payment: "wallet" | "demo";
  pickupTime: string;
  pickupCode: string;
  status: OrderStatus;
  rejectReason?: string;
  orderedAt: number;
  updatedAt: number;
};

export type AppTransaction = {
  id: string;
  customerUserId: string;
  customerId: string;
  customerName: string;
  amount: number;
  type: "topup" | "debit";
  staff: string;
  orderId?: string;
  createdAt: number;
};

export type AppData = {
  users: AppUser[];
  staff: AppStaff[];
  orders: AppOrder[];
  menu: AppMenuItem[];
  transactions: AppTransaction[];
};

export type AppAction =
  | { action: "signup"; name: string; email: string; password: string }
  | { action: "login"; email: string; password: string }
  | { action: "staff_login"; email: string; password: string }
  | { action: "staff_create"; name: string; email: string; password: string }
  | { action: "staff_toggle"; staffId: string; enabled: boolean }
  | { action: "place_order"; userId: string; payment: "wallet" | "demo"; pickupTime: string; items: Array<{ productId: number; quantity: number; extras: string[] }> }
  | { action: "order_status"; orderId: string; status: OrderStatus; reason?: string }
  | { action: "wallet_topup"; customerId: string; amount: number; staff: string }
  | { action: "menu_save"; item: Partial<AppMenuItem> & Pick<AppMenuItem, "name" | "category" | "price" | "image" | "available"> }
  | { action: "menu_toggle"; itemId: number; available: boolean }
  | { action: "menu_remove"; itemId: number };
