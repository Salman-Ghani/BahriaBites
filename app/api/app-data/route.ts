import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import type { AppAction, AppData, AppMenuItem, AppOrder, AppOrderItem, AppStaff, AppTransaction, AppUser } from "@/lib/app-data";

export const dynamic = "force-dynamic";

const seedMenu: AppMenuItem[] = [
  { id: 1, name: "Chicken Biryani", category: "Meals", price: 300, image: "/assets/chicken-biryani.jpg", description: "Aromatic basmati rice with tender chicken, special spices, served with raita and salad.", rating: 4.8, popular: true, available: true },
  { id: 2, name: "Zinger Burger", category: "Snacks", price: 350, image: "/assets/zinger-burger.jpg", description: "Crispy chicken fillet, fresh lettuce and our creamy house sauce in a soft sesame bun.", rating: 4.7, popular: true, available: true },
  { id: 3, name: "Loaded Fries", category: "Snacks", price: 280, image: "/assets/loaded-fries.jpg", description: "Golden fries loaded with cheese sauce, garlic mayo and a spicy drizzle.", rating: 4.6, available: true },
  { id: 4, name: "Chicken Roll", category: "Snacks", price: 220, image: "/assets/chicken-roll.jpg", description: "Soft paratha wrapped around juicy chicken, crunchy vegetables and chutney.", rating: 4.5, available: true },
  { id: 5, name: "Pancakes", category: "Desserts", price: 250, image: "/assets/pancakes.jpg", description: "Fluffy pancake stack with banana, chocolate drizzle and a touch of honey.", rating: 4.7, available: true },
  { id: 6, name: "Cold Coffee", category: "Drinks", price: 180, image: "/assets/cold-coffee.jpg", description: "Chilled, creamy coffee blended fresh and finished with chocolate drizzle.", rating: 4.9, popular: true, available: true },
  { id: 7, name: "Beef Pulao", category: "Meals", price: 320, image: "/assets/chicken-biryani.jpg", description: "Fragrant rice cooked with tender beef, whole spices and fresh herbs.", rating: 4.6, available: true },
  { id: 8, name: "Chicken Pasta", category: "Meals", price: 280, image: "/assets/loaded-fries.jpg", description: "Creamy chicken pasta with vegetables, herbs and a light cheese topping.", rating: 4.4, available: true },
  { id: 9, name: "Chocolate Shake", category: "Drinks", price: 220, image: "/assets/cold-coffee.jpg", description: "Rich chocolate shake blended with chilled milk and ice cream.", rating: 4.8, available: true },
];

function database() {
  if (!env.DB) throw new Error("Shared application data is temporarily unavailable.");
  return env.DB;
}

async function ensureMenu() {
  const db = database();
  const count = await db.prepare("SELECT COUNT(*) AS count FROM menu_items").first<{ count: number }>();
  if (Number(count?.count || 0) > 0) return;
  await db.batch(seedMenu.map(item => db.prepare(`INSERT OR IGNORE INTO menu_items
    (id, name, category, price, image, description, rating, popular, available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(item.id, item.name, item.category, item.price, item.image, item.description, item.rating, item.popular ? 1 : 0, item.available ? 1 : 0)));
}

async function ensureStaff() {
  const db = database();
  const count = await db.prepare("SELECT COUNT(*) AS count FROM staff_accounts").first<{ count: number }>();
  if (Number(count?.count || 0) > 0) return;
  const email = "staff@bahriabites.com";
  await db.prepare(`INSERT INTO staff_accounts (id, name, email, password_hash, enabled, created_at)
    VALUES (?, 'Maha Khan', ?, ?, 1, ?)`).bind(crypto.randomUUID(), email, await passwordHash(email, "demo123"), Date.now()).run();
}

async function passwordHash(email: string, password: string) {
  const bytes = new TextEncoder().encode(`${email.trim().toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, "0")).join("");
}

function pickupCode() {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return String(1000 + (value[0] % 9000));
}

async function readData(): Promise<AppData> {
  await Promise.all([ensureMenu(), ensureStaff()]);
  const db = database();
  const [userRows, staffRows, menuRows, orderRows, itemRows, transactionRows] = await Promise.all([
    db.prepare("SELECT id, customer_id, name, email, program, wallet_balance FROM users ORDER BY created_at DESC").all<Record<string, unknown>>(),
    db.prepare("SELECT id, name, email, enabled, created_at FROM staff_accounts ORDER BY created_at DESC").all<Record<string, unknown>>(),
    db.prepare("SELECT * FROM menu_items ORDER BY id").all<Record<string, unknown>>(),
    db.prepare("SELECT * FROM orders ORDER BY ordered_at DESC").all<Record<string, unknown>>(),
    db.prepare("SELECT * FROM order_items ORDER BY rowid").all<Record<string, unknown>>(),
    db.prepare("SELECT * FROM transactions ORDER BY created_at DESC").all<Record<string, unknown>>(),
  ]);
  const users: AppUser[] = userRows.results.map(row => ({
    id: String(row.id), customerId: String(row.customer_id), name: String(row.name), email: String(row.email),
    program: String(row.program), balance: Number(row.wallet_balance),
  }));
  const staff: AppStaff[] = staffRows.results.map(row => ({
    id: String(row.id), name: String(row.name), email: String(row.email), enabled: Boolean(row.enabled), createdAt: Number(row.created_at),
  }));
  const menu: AppMenuItem[] = menuRows.results.map(row => ({
    id: Number(row.id), name: String(row.name), category: String(row.category) as AppMenuItem["category"], price: Number(row.price),
    image: String(row.image), description: String(row.description), rating: Number(row.rating), popular: Boolean(row.popular), available: Boolean(row.available),
  }));
  const items = itemRows.results.map(row => ({
    orderId: String(row.order_id),
    item: {
      id: String(row.id), productId: Number(row.product_id), name: String(row.name), image: String(row.image), unitPrice: Number(row.unit_price),
      quantity: Number(row.quantity), extras: JSON.parse(String(row.extras_json || "[]")), lineTotal: Number(row.line_total),
    } satisfies AppOrderItem,
  }));
  const orders: AppOrder[] = orderRows.results.map(row => ({
    id: String(row.id), customerUserId: String(row.customer_user_id), customerId: String(row.customer_id), customerName: String(row.customer_name),
    items: items.filter(entry => entry.orderId === String(row.id)).map(entry => entry.item),
    total: Number(row.total), payment: String(row.payment) as AppOrder["payment"], pickupTime: String(row.pickup_time), pickupCode: String(row.pickup_code),
    status: String(row.status) as AppOrder["status"], rejectReason: row.reject_reason ? String(row.reject_reason) : undefined,
    orderedAt: Number(row.ordered_at), updatedAt: Number(row.updated_at),
  }));
  const transactions: AppTransaction[] = transactionRows.results.map(row => ({
    id: String(row.id), customerUserId: String(row.customer_user_id), customerId: String(row.customer_id), customerName: String(row.customer_name),
    amount: Number(row.amount), type: String(row.type) as AppTransaction["type"], staff: String(row.staff),
    orderId: row.order_id ? String(row.order_id) : undefined, createdAt: Number(row.created_at),
  }));
  return { users, staff, menu, orders, transactions };
}

function failure(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    return NextResponse.json({ data: await readData() });
  } catch (error) {
    console.error("app-data GET failed", error);
    return failure("Shared application data is temporarily unavailable.", 503);
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json() as AppAction;
    const db = database();
    let result: unknown = null;

    if (input.action === "signup") {
      const name = input.name.trim();
      const email = input.email.trim().toLowerCase();
      if (!name || !email || input.password.length < 6) return failure("Enter a name, valid email, and a password of at least 6 characters.");
      const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
      if (existing) return failure("An account with this email already exists.", 409);
      const userId = crypto.randomUUID();
      const customerId = `BU-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      await db.prepare(`INSERT INTO users (id, customer_id, name, email, password_hash, program, wallet_balance, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)`)
        .bind(userId, customerId, name, email, await passwordHash(email, input.password), "Bahria University Student", Date.now()).run();
      result = { userId };
    } else if (input.action === "login") {
      const email = input.email.trim().toLowerCase();
      const user = await db.prepare("SELECT id, password_hash FROM users WHERE email = ?").bind(email).first<{ id: string; password_hash: string }>();
      if (!user || user.password_hash !== await passwordHash(email, input.password)) return failure("Invalid email or password.", 401);
      result = { userId: user.id };
    } else if (input.action === "staff_login") {
      const email = input.email.trim().toLowerCase();
      const staff = await db.prepare("SELECT id, password_hash, enabled FROM staff_accounts WHERE email = ?").bind(email).first<{ id: string; password_hash: string; enabled: number }>();
      if (!staff || staff.password_hash !== await passwordHash(email, input.password)) return failure("Invalid staff email or password.", 401);
      if (!Boolean(staff.enabled)) return failure("This staff account is disabled.", 403);
      result = { staffId: staff.id };
    } else if (input.action === "staff_create") {
      const name = input.name.trim();
      const email = input.email.trim().toLowerCase();
      if (!name || !email || input.password.length < 6) return failure("Enter a name, valid email, and a password of at least 6 characters.");
      const existing = await db.prepare("SELECT id FROM staff_accounts WHERE email = ?").bind(email).first();
      if (existing) return failure("A staff account with this email already exists.", 409);
      const staffId = crypto.randomUUID();
      await db.prepare(`INSERT INTO staff_accounts (id, name, email, password_hash, enabled, created_at)
        VALUES (?, ?, ?, ?, 1, ?)`).bind(staffId, name, email, await passwordHash(email, input.password), Date.now()).run();
      result = { staffId };
    } else if (input.action === "staff_toggle") {
      const update = await db.prepare("UPDATE staff_accounts SET enabled = ? WHERE id = ?").bind(input.enabled ? 1 : 0, input.staffId).run();
      if (!update.meta.changes) return failure("Staff account not found.", 404);
      result = { staffId: input.staffId, enabled: input.enabled };
    } else if (input.action === "wallet_topup") {
      const amount = Math.floor(Number(input.amount));
      if (amount <= 0) return failure("Enter a valid top-up amount.");
      const user = await db.prepare("SELECT id, customer_id, name FROM users WHERE customer_id = ?").bind(input.customerId.trim()).first<{ id: string; customer_id: string; name: string }>();
      if (!user) return failure("Customer not found.", 404);
      const transactionId = `WT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const now = Date.now();
      await db.batch([
        db.prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?").bind(amount, user.id),
        db.prepare(`INSERT INTO transactions (id, customer_user_id, customer_id, customer_name, amount, type, staff, order_id, created_at)
          VALUES (?, ?, ?, ?, ?, 'topup', ?, NULL, ?)`)
          .bind(transactionId, user.id, user.customer_id, user.name, amount, input.staff, now),
      ]);
      result = { transactionId, createdAt: now };
    } else if (input.action === "place_order") {
      const user = await db.prepare("SELECT id, customer_id, name, wallet_balance FROM users WHERE id = ?").bind(input.userId).first<{ id: string; customer_id: string; name: string; wallet_balance: number }>();
      if (!user) return failure("Please log in before placing an order.", 401);
      if (!input.items.length) return failure("Your cart is empty.");
      const ids = [...new Set(input.items.map(item => Number(item.productId)))];
      const placeholders = ids.map(() => "?").join(",");
      const menuRows = await db.prepare(`SELECT * FROM menu_items WHERE id IN (${placeholders})`).bind(...ids).all<Record<string, unknown>>();
      const preparedItems = input.items.map(item => {
        const menu = menuRows.results.find(row => Number(row.id) === Number(item.productId));
        if (!menu || !Boolean(menu.available)) throw new Error("One or more cart items are sold out.");
        const extras = item.extras || [];
        const extrasTotal = extras.reduce((sum, name) => sum + (name === "Extra Raita" ? 50 : name === "Extra Chicken" ? 120 : name === "Soft Drink" ? 100 : 0), 0);
        const unitPrice = Number(menu.price);
        const quantity = Math.max(1, Math.floor(Number(item.quantity)));
        return { productId: Number(menu.id), name: String(menu.name), image: String(menu.image), unitPrice, quantity, extras, lineTotal: (unitPrice + extrasTotal) * quantity };
      });
      const total = preparedItems.reduce((sum, item) => sum + item.lineTotal, 0);
      if (input.payment === "wallet" && Number(user.wallet_balance) < total) return failure(`Insufficient wallet balance. Add ${Math.max(0, total - Number(user.wallet_balance))} more rupees.`);
      const orderId = `BB-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      const code = pickupCode();
      const now = Date.now();
      const statements = [
        db.prepare(`INSERT INTO orders (id, customer_user_id, customer_id, customer_name, total, payment, pickup_time, pickup_code, status, reject_reason, ordered_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NULL, ?, ?)`)
          .bind(orderId, user.id, user.customer_id, user.name, total, input.payment, input.pickupTime, code, now, now),
        ...preparedItems.map(item => db.prepare(`INSERT INTO order_items (id, order_id, product_id, name, image, unit_price, quantity, extras_json, line_total)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(crypto.randomUUID(), orderId, item.productId, item.name, item.image, item.unitPrice, item.quantity, JSON.stringify(item.extras), item.lineTotal)),
      ];
      if (input.payment === "wallet") {
        const transactionId = `WD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        statements.unshift(db.prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ? AND wallet_balance >= ?").bind(total, user.id, total));
        statements.push(db.prepare(`INSERT INTO transactions (id, customer_user_id, customer_id, customer_name, amount, type, staff, order_id, created_at)
          VALUES (?, ?, ?, ?, ?, 'debit', 'Customer Order', ?, ?)`)
          .bind(transactionId, user.id, user.customer_id, user.name, -total, orderId, now));
      }
      await db.batch(statements);
      result = { orderId, pickupCode: code };
    } else if (input.action === "order_status") {
      const allowed = ["Pending", "Accepted", "Preparing", "Ready", "Collected", "Rejected"];
      if (!allowed.includes(input.status)) return failure("Invalid order status.");
      const update = await db.prepare("UPDATE orders SET status = ?, reject_reason = ?, updated_at = ? WHERE id = ?")
        .bind(input.status, input.reason || null, Date.now(), input.orderId).run();
      if (!update.meta.changes) return failure("Order not found.", 404);
      result = { orderId: input.orderId, status: input.status };
    } else if (input.action === "menu_toggle") {
      await db.prepare("UPDATE menu_items SET available = ? WHERE id = ?").bind(input.available ? 1 : 0, input.itemId).run();
    } else if (input.action === "menu_remove") {
      await db.prepare("DELETE FROM menu_items WHERE id = ?").bind(input.itemId).run();
    } else if (input.action === "menu_save") {
      const item = input.item;
      if (!item.name.trim() || Number(item.price) <= 0) return failure("Enter a name and valid price.");
      if (item.id) {
        await db.prepare("UPDATE menu_items SET name = ?, category = ?, price = ?, image = ?, available = ? WHERE id = ?")
          .bind(item.name.trim(), item.category, Math.floor(Number(item.price)), item.image, item.available ? 1 : 0, item.id).run();
      } else {
        const next = await db.prepare("SELECT COALESCE(MAX(id), 0) + 1 AS id FROM menu_items").first<{ id: number }>();
        await db.prepare(`INSERT INTO menu_items (id, name, category, price, image, description, rating, popular, available)
          VALUES (?, ?, ?, ?, ?, ?, 4.5, 0, ?)`)
          .bind(Number(next?.id || 1), item.name.trim(), item.category, Math.floor(Number(item.price)), item.image, item.description || "Freshly prepared at the Bahria Bites cafeteria.", item.available ? 1 : 0).run();
      }
    } else {
      return failure("Unsupported application action.");
    }

    return NextResponse.json({ result, data: await readData() });
  } catch (error) {
    console.error("app-data POST failed", error);
    const message = error instanceof Error ? error.message : "The request could not be completed.";
    return failure(message, message.includes("sold out") ? 409 : 500);
  }
}
