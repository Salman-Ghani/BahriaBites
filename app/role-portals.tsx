"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, ClipboardList, CreditCard, LayoutDashboard, LogOut, Menu as MenuIcon, ReceiptText, ShieldCheck, ShoppingBag, Users, UserRoundCog, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AppAction, AppData, AppOrder } from "@/lib/app-data";

type PortalRole = "owner" | "university" | "system-admin";
type PortalAction = (input: AppAction) => Promise<unknown>;

const roleConfig = {
  owner: { title: "Cafeteria Owner", email: "owner@bahriabites.com", password: "owner123", icon: Building2 },
  university: { title: "University Administration", email: "university@bahriabites.com", password: "university123", icon: ShieldCheck },
  "system-admin": { title: "System Administrator", email: "admin@bahriabites.com", password: "admin123", icon: UserRoundCog },
} as const;

const money = (value: number) => `Rs. ${value.toLocaleString("en-PK")}`;
const portalGo = (role: PortalRole, page = "dashboard") => {
  window.location.hash = `#/${role}/${page}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
};
const paymentLabel = (payment: AppOrder["payment"]) => payment === "wallet" ? "Bahria Wallet" : "Online Payment (Demo)";
const todayOrders = (orders: AppOrder[]) => {
  const today = new Date();
  return orders.filter(order => {
    const date = new Date(order.orderedAt);
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  });
};

function PortalLogin({ role, onLogin }: { role: PortalRole; onLogin: () => void }) {
  const config = roleConfig[role];
  const Icon = config.icon;
  const [email, setEmail] = useState(config.email);
  const [password, setPassword] = useState(config.password);
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (email.trim().toLowerCase() !== config.email || password !== config.password) {
      setError(`Invalid ${config.title.toLowerCase()} email or password.`);
      return;
    }
    onLogin();
  };
  return <main className="portal-login"><section><button className="portal-brand" onClick={() => { window.location.hash = "#/"; }}><img src="/assets/bahria-bites-logo.png" alt="Bahria Bites"/><span>Bahria Bites</span></button><div className="portal-login-icon"><Icon /></div><h1>{config.title}</h1><p>Sign in to continue.</p><form onSubmit={submit}><Label>Email<Input type="email" required value={email} onChange={event => setEmail(event.target.value)}/></Label><Label>Password<Input type="password" required value={password} onChange={event => setPassword(event.target.value)}/></Label>{error && <p className="portal-error" role="alert">{error}</p>}<button type="submit" className="portal-primary">Sign in <ArrowRight /></button></form><button className="portal-return" onClick={() => { window.location.hash = "#/"; }}>Return to customer website</button></section></main>;
}

function PortalShell({ role, page, children, onLogout }: { role: PortalRole; page: string; children: React.ReactNode; onLogout: () => void }) {
  const config = roleConfig[role];
  const nav = role === "system-admin"
    ? [["dashboard", "Dashboard", LayoutDashboard], ["users", "Users", Users], ["staff", "Staff", UserRoundCog], ["orders", "Orders", ShoppingBag], ["transactions", "Transactions", ReceiptText]] as const
    : role === "university"
      ? [["dashboard", "Menu Overview", ClipboardList]] as const
      : [["dashboard", "Sales Overview", LayoutDashboard], ["orders", "Recent Orders", ShoppingBag]] as const;
  const navItems = <nav>{nav.map(([id, label, Icon]) => <button key={id} className={page === id ? "active" : ""} onClick={() => portalGo(role, id)}><Icon /><span>{label}</span></button>)}</nav>;
  return <div className="portal-app"><aside><button className="portal-brand" onClick={() => portalGo(role)}><img src="/assets/bahria-bites-logo.png" alt="Bahria Bites"/><span><b>Bahria Bites</b><small>{config.title}</small></span></button>{navItems}<button className="portal-logout" onClick={onLogout}><LogOut />Log out</button></aside><div className="portal-workspace"><header><Sheet><SheetTrigger className="portal-mobile-menu" aria-label="Open navigation"><MenuIcon /></SheetTrigger><SheetContent side="left" className="portal-mobile-sheet"><SheetTitle>{config.title}</SheetTitle>{nav.map(([id, label, Icon]) => <SheetClose key={id} render={<button className={page === id ? "active" : ""} onClick={() => portalGo(role, id)}><Icon />{label}</button>}/>)}</SheetContent></Sheet><div><h1>{page === "dashboard" ? config.title : page.charAt(0).toUpperCase() + page.slice(1)}</h1><p>{new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div><span className="portal-role-icon"><config.icon /></span></header>{children}</div></div>;
}

function OrderTable({ orders, limit }: { orders: AppOrder[]; limit?: number }) {
  const visible = typeof limit === "number" ? orders.slice(0, limit) : orders;
  return <div className="portal-table-wrap"><Table><TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Payment</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Ordered</TableHead></TableRow></TableHeader><TableBody>{visible.map(order => <TableRow key={order.id}><TableCell><b>{order.id}</b></TableCell><TableCell>{order.customerName}<small>{order.customerId}</small></TableCell><TableCell>{paymentLabel(order.payment)}</TableCell><TableCell><b>{money(order.total)}</b></TableCell><TableCell><span className={`portal-status ${order.status.toLowerCase()}`}>{order.status}</span></TableCell><TableCell>{new Date(order.orderedAt).toLocaleString("en-PK")}</TableCell></TableRow>)}{!visible.length && <TableRow><TableCell colSpan={6} className="portal-empty">No orders yet.</TableCell></TableRow>}</TableBody></Table></div>;
}

function OwnerPortal({ data, page }: { data: AppData; page: string }) {
  const today = todayOrders(data.orders).filter(order => order.status === "Collected");
  const sales = today.reduce((sum, order) => sum + order.total, 0);
  const walletSales = today.filter(order => order.payment === "wallet").reduce((sum, order) => sum + order.total, 0);
  const onlineSales = today.filter(order => order.payment === "demo").reduce((sum, order) => sum + order.total, 0);
  return <main className="portal-main"><div className="portal-stats owner-stats"><article><span><CreditCard /></span><small>Today&apos;s Sales</small><b>{money(sales)}</b></article><article><span><ShoppingBag /></span><small>Total Orders</small><b>{data.orders.length}</b></article><article><span><Wallet /></span><small>Wallet Sales</small><b>{money(walletSales)}</b></article><article><span><CreditCard /></span><small>Online Payment Sales</small><b>{money(onlineSales)}</b></article></div><section className="portal-panel"><div className="portal-panel-head"><div><h2>{page === "orders" ? "All Orders" : "Recent Orders"}</h2><p>Read-only order and payment information.</p></div></div><OrderTable orders={data.orders} limit={page === "orders" ? undefined : 8}/></section></main>;
}

function UniversityPortal({ data }: { data: AppData }) {
  return <main className="portal-main"><section className="portal-panel"><div className="portal-panel-head"><div><h2>Cafeteria Menu</h2><p>{data.menu.length} items across {new Set(data.menu.map(item => item.category)).size} categories. Read-only access.</p></div></div><div className="university-menu">{data.menu.map(item => <article key={item.id}><img src={item.image} alt={item.name}/><div><small>{item.category}</small><h3>{item.name}</h3><b>{money(item.price)}</b></div><span className={item.available ? "available" : "sold-out"}>{item.available ? "Available" : "Sold Out"}</span></article>)}</div>{!data.menu.length && <p className="portal-empty">No menu items available.</p>}</section></main>;
}

function SystemPortal({ data, page, action }: { data: AppData; page: string; action: PortalAction }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const createStaff = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await action({ action: "staff_create", name, email, password });
      setName(""); setEmail(""); setPassword(""); setNotice("Staff account created.");
      window.setTimeout(() => setNotice(""), 2400);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create staff account."); }
  };
  const toggleStaff = async (staffId: string, enabled: boolean) => {
    setError("");
    try { await action({ action: "staff_toggle", staffId, enabled }); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to update staff account."); }
  };
  if (page === "users") return <main className="portal-main"><section className="portal-panel"><div className="portal-panel-head"><div><h2>Customers</h2><p>Registered Bahria Bites customer accounts.</p></div></div><div className="portal-table-wrap"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Customer ID</TableHead><TableHead>Email</TableHead><TableHead>Wallet Balance</TableHead></TableRow></TableHeader><TableBody>{data.users.map(user => <TableRow key={user.id}><TableCell><b>{user.name}</b></TableCell><TableCell>{user.customerId}</TableCell><TableCell>{user.email}</TableCell><TableCell>{money(user.balance)}</TableCell></TableRow>)}</TableBody></Table></div></section></main>;
  if (page === "orders") return <main className="portal-main"><section className="portal-panel"><div className="portal-panel-head"><div><h2>Orders</h2><p>All customer orders.</p></div></div><OrderTable orders={data.orders}/></section></main>;
  if (page === "transactions") return <main className="portal-main"><section className="portal-panel"><div className="portal-panel-head"><div><h2>Transactions</h2><p>Wallet top-ups and order debits.</p></div></div><div className="portal-table-wrap"><Table><TableHeader><TableRow><TableHead>Transaction</TableHead><TableHead>Customer</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Staff / Source</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>{data.transactions.map(transaction => <TableRow key={transaction.id}><TableCell><b>{transaction.id}</b></TableCell><TableCell>{transaction.customerName}<small>{transaction.customerId}</small></TableCell><TableCell>{transaction.type === "topup" ? "Wallet Top-Up" : "Order Payment"}</TableCell><TableCell className={transaction.amount < 0 ? "portal-debit" : "portal-credit"}>{transaction.amount > 0 ? "+" : ""}{money(transaction.amount)}</TableCell><TableCell>{transaction.staff}</TableCell><TableCell>{new Date(transaction.createdAt).toLocaleString("en-PK")}</TableCell></TableRow>)}</TableBody></Table></div></section></main>;
  if (page === "staff") return <main className="portal-main system-staff-grid"><section className="portal-panel"><div className="portal-panel-head"><div><h2>Staff Accounts</h2><p>Create or disable cafeteria staff access.</p></div></div>{notice && <div className="portal-notice"><CheckCircle2 />{notice}</div>}{error && <p className="portal-error" role="alert">{error}</p>}<div className="staff-account-list">{data.staff.map(staff => <article key={staff.id}><div><b>{staff.name}</b><span>{staff.email}</span><small>Created {new Date(staff.createdAt).toLocaleDateString("en-PK")}</small></div><label><Switch checked={staff.enabled} onCheckedChange={enabled => void toggleStaff(staff.id, enabled)}/><span>{staff.enabled ? "Enabled" : "Disabled"}</span></label></article>)}</div></section><section className="portal-panel create-staff"><div className="portal-panel-head"><div><h2>Create Staff Account</h2><p>Credentials are issued privately to cafeteria staff.</p></div></div><form onSubmit={createStaff}><Label>Full name<Input required value={name} onChange={event => setName(event.target.value)}/></Label><Label>Email<Input required type="email" value={email} onChange={event => setEmail(event.target.value)}/></Label><Label>Temporary password<Input required type="password" minLength={6} value={password} onChange={event => setPassword(event.target.value)}/></Label><button className="portal-primary" type="submit">Create Account</button></form></section></main>;
  return <main className="portal-main"><div className="portal-stats"><article><span><Users /></span><small>Total Users</small><b>{data.users.length}</b></article><article><span><UserRoundCog /></span><small>Cafeteria Staff</small><b>{data.staff.filter(staff => staff.enabled).length}</b></article><article><span><ShoppingBag /></span><small>Orders</small><b>{data.orders.length}</b></article><article><span><ReceiptText /></span><small>Transactions</small><b>{data.transactions.length}</b></article></div><section className="portal-panel"><div className="portal-panel-head"><div><h2>System Overview</h2><p>Live totals from the shared Bahria Bites application data.</p></div></div><div className="system-overview"><p><span>Available menu items</span><b>{data.menu.filter(item => item.available).length}</b></p><p><span>Active orders</span><b>{data.orders.filter(order => !["Collected", "Rejected"].includes(order.status)).length}</b></p><p><span>Disabled staff accounts</span><b>{data.staff.filter(staff => !staff.enabled).length}</b></p></div></section></main>;
}

export default function RolePortal({ role, route, data, action }: { role: PortalRole; route: string; data: AppData; action: PortalAction }) {
  const storageKey = `bb-${role}-auth`;
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => setAuthenticated(localStorage.getItem(storageKey) === "yes"), [storageKey]);
  const page = useMemo(() => route.split("/")[1] || "dashboard", [route]);
  if (!authenticated) return <PortalLogin role={role} onLogin={() => { localStorage.setItem(storageKey, "yes"); setAuthenticated(true); portalGo(role); }}/>;
  const logout = () => { localStorage.removeItem(storageKey); setAuthenticated(false); window.location.hash = `#/${role}`; };
  return <PortalShell role={role} page={page} onLogout={logout}>{role === "owner" ? <OwnerPortal data={data} page={page}/> : role === "university" ? <UniversityPortal data={data}/> : <SystemPortal data={data} page={page} action={action}/>}</PortalShell>;
}
