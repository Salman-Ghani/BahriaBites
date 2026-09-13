import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  program: text("program").notNull().default("Bahria University Student"),
  walletBalance: integer("wallet_balance").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const staffAccounts = sqliteTable("staff_accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull(),
});

export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: integer("price").notNull(),
  image: text("image").notNull(),
  description: text("description").notNull(),
  rating: real("rating").notNull().default(4.5),
  popular: integer("popular", { mode: "boolean" }).notNull().default(false),
  available: integer("available", { mode: "boolean" }).notNull().default(true),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  customerUserId: text("customer_user_id").notNull(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  total: integer("total").notNull(),
  payment: text("payment").notNull(),
  pickupTime: text("pickup_time").notNull(),
  pickupCode: text("pickup_code").notNull(),
  status: text("status").notNull().default("Pending"),
  rejectReason: text("reject_reason"),
  orderedAt: integer("ordered_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  productId: integer("product_id").notNull(),
  name: text("name").notNull(),
  image: text("image").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  extrasJson: text("extras_json").notNull().default("[]"),
  lineTotal: integer("line_total").notNull(),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  customerUserId: text("customer_user_id").notNull(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  staff: text("staff").notNull(),
  orderId: text("order_id"),
  createdAt: integer("created_at").notNull(),
});
