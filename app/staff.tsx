"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Banknote, Bell, Check, CheckCircle2, ChefHat, CircleDollarSign, Clock3, Edit3, LayoutDashboard, LogOut, Menu as MenuIcon, PackageCheck, Plus, Search, ShoppingBag, Trash2, UtensilsCrossed, Wallet, XCircle, } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AppAction, AppMenuItem, AppOrder, AppStaff, AppTransaction, AppUser, OrderStatus } from "@/lib/app-data";

type StaffMenuItem = AppMenuItem;
type StaffAction = (input: AppAction) => Promise<unknown>;

const money = (n: number) => `Rs. ${n.toLocaleString("en-PK")}`;
const staffGo = (route: string) => { window.location.hash = `#/staff/${route}`; window.scrollTo({ top: 0, behavior: "smooth" }); };
function StaffLogo() { return <button className="staff-brand" onClick={() => staffGo("orders")}><img src="/assets/bahria-bites-logo.png" alt="Bahria Bites"/><span><b>Bahria Bites</b><small>Cafeteria Operations</small></span></button>; }
function StaffLogin({ action, onLogin }: {
    action: StaffAction;
    onLogin: (staffId: string) => void;
}) {
    const [email, setEmail] = useState("staff@bahriabites.com");
    const [password, setPassword] = useState("demo123");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");
        setLoading(true);
        try {
            const result = await action({ action: "staff_login", email, password }) as { staffId: string };
            onLogin(result.staffId);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Unable to sign in.");
        } finally { setLoading(false); }
    };
    return <main className="staff-login"><section className="staff-login-panel"><StaffLogo /><div className="staff-login-icon"><ChefHat /></div><h1>Staff Portal</h1><p>Sign in with your cafeteria staff account.</p><form onSubmit={submit}><Label>Staff email<Input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@bahriabites.com"/></Label><Label>Password<Input required type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter password"/></Label>{error && <p className="staff-form-error" role="alert">{error}</p>}<button className="staff-primary" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in to Staff Portal"}<ArrowRight /></button></form><div className="staff-account-note"><AlertTriangle /><span>Staff accounts are issued by the System Administrator. Public staff signup is not available.</span></div><button className="back-customer" onClick={() => { window.location.hash = "#/"; }}>← Return to customer website</button></section></main>;
}
function StaffShell({ page, children, onLogout, staff }: {
    page: string;
    children: React.ReactNode;
    onLogout: () => void;
    staff: AppStaff;
}) {
    const nav = [["orders", "Orders", LayoutDashboard], ["menu", "Menu Management", UtensilsCrossed], ["wallet", "Wallet Top-Up", Wallet]] as const;
    const dateLabel = new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const renderNav = (mobile: boolean) => <nav>{nav.map(([id, label, Icon]) => {
        const button = <button key={id} className={page === id ? "active" : ""} onClick={() => staffGo(id)}><Icon /><span>{label}</span></button>;
        return mobile ? <SheetClose key={id} render={button}/> : button;
    })}</nav>;
    const initials = staff.name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
    return <div className="staff-app"><aside className="staff-sidebar"><StaffLogo />{renderNav(false)}<div className="staff-profile"><span>{initials}</span><div><b>{staff.name}</b><small>Cafeteria Staff</small></div><button onClick={onLogout} aria-label="Log out"><LogOut /></button></div></aside><div className="staff-workspace"><header className="staff-topbar"><Sheet><SheetTrigger className="staff-mobile-menu"><MenuIcon /></SheetTrigger><SheetContent side="left" className="staff-mobile-sheet"><SheetTitle className="sr-only">Staff navigation</SheetTitle><StaffLogo />{renderNav(true)}</SheetContent></Sheet><div><h1>{page === "orders" ? "Orders Dashboard" : page === "menu" ? "Menu Management" : "Wallet Top-Up"}</h1><p>{dateLabel}</p></div><div className="staff-top-actions"><button disabled aria-label="Notifications are not available in this demo"><Bell /></button><span>{initials}</span></div></header>{children}</div></div>;
}
function StatusBadge({ status }: {
    status: OrderStatus;
}) { return <span className={`staff-status ${status.toLowerCase()}`}>{status}</span>; }
function OrdersDashboard({ orders, action }: { orders: AppOrder[]; action: StaffAction; }) {
    const [filter, setFilter] = useState("Active");
    const [rejecting, setRejecting] = useState<AppOrder | null>(null);
    const [reason, setReason] = useState("Item Unavailable");
    const [customReason, setCustomReason] = useState("");
    const [notice, setNotice] = useState("");
    const update = async (id: string, status: OrderStatus, why?: string) => {
        await action({ action: "order_status", orderId: id, status, reason: why });
        setNotice(`${id} marked ${status}.`);
        window.setTimeout(() => setNotice(""), 2400);
    };
    const visible = orders.filter(order => filter === "All" || filter === "Active" && !["Collected", "Rejected"].includes(order.status) || order.status === filter);
    const nextAction = (order: AppOrder) => order.status === "Accepted" ? { label: "Mark Preparing", status: "Preparing" as OrderStatus, icon: ChefHat } : order.status === "Preparing" ? { label: "Mark Ready", status: "Ready" as OrderStatus, icon: CheckCircle2 } : order.status === "Ready" ? { label: "Mark Collected", status: "Collected" as OrderStatus, icon: PackageCheck } : null;
    const today = new Date();
    const todayOrders = orders.filter(order => {
        const date = new Date(order.orderedAt);
        return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
    });
    const completedToday = todayOrders.filter(order => order.status === "Collected");
    const salesToday = completedToday.reduce((sum, order) => sum + order.total, 0);
    return <main className="staff-main"><div className="staff-stats"><article><span><ShoppingBag /></span><div><small>Pending Orders</small><b>{orders.filter(order => order.status === "Pending").length}</b><p>Needs attention</p></div></article><article><span><ChefHat /></span><div><small>In Preparation</small><b>{orders.filter(order => order.status === "Preparing").length}</b><p>Kitchen active</p></div></article><article><span><Clock3 /></span><div><small>Ready for Pickup</small><b>{orders.filter(order => order.status === "Ready").length}</b><p>Awaiting students</p></div></article><article><span><CircleDollarSign /></span><div><small>Today’s Sales</small><b>{money(salesToday)}</b><p>{completedToday.length} completed order{completedToday.length === 1 ? "" : "s"}</p></div></article></div>{notice && <div className="staff-toast"><CheckCircle2 />{notice}</div>}<section className="staff-panel"><div className="staff-panel-head"><div><h2>Incoming Orders</h2><p>Review and update customer orders in real time.</p></div><div className="staff-filters">{["Active", "Pending", "Preparing", "Ready", "Collected", "All"].map(value => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value}</button>)}</div></div><div className="orders-list">{visible.map(order => { const advance = nextAction(order); const ActionIcon = advance?.icon; return <article className="staff-order" key={order.id}><div className="staff-order-top"><div><b>{order.id}</b><StatusBadge status={order.status}/></div><span><Clock3 /> Ordered {new Date(order.orderedAt).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" })}</span></div><div className="staff-order-grid"><div className="staff-customer"><span>{order.customerName.split(" ").map(part => part[0]).join("").slice(0, 2)}</span><div><b>{order.customerName}</b><small>{order.customerId}</small></div></div><div className="staff-order-items"><small>Items</small>{order.items.map(item => <b key={item.id}>{item.name} × {item.quantity}</b>)}</div><div><small>Payment</small><b>{order.payment === "wallet" ? "Bahria Wallet" : "Online Payment (Demo)"}</b><strong>{money(order.total)}</strong></div><div><small>Requested Pickup</small><b className="pickup-time"><Clock3 />{order.pickupTime.startsWith("Today") ? order.pickupTime.replace("Today, ", "") : `In ${order.pickupTime}`}</b><small>Pickup Code</small><strong>{order.pickupCode}</strong></div></div>{order.rejectReason && <div className="reject-reason"><XCircle /> Rejected: {order.rejectReason}</div>}<div className="staff-order-actions">{order.status === "Pending" && <><button className="accept" onClick={() => void update(order.id, "Accepted")}><Check />Accept Order</button><button className="reject" onClick={() => { setRejecting(order); setReason("Item Unavailable"); setCustomReason(""); }}><XCircle />Reject</button></>}{advance && ActionIcon && <button className="advance" onClick={() => void update(order.id, advance.status)}><ActionIcon />{advance.label}</button>}{order.status === "Collected" && <span className="completed-label"><CheckCircle2 />Order completed</span>}</div></article>; })}{!visible.length && <div className="staff-empty"><CheckCircle2 /><h3>No orders here</h3><p>Orders matching this status will appear here.</p></div>}</div></section><Dialog open={!!rejecting} onOpenChange={open => !open && setRejecting(null)}><DialogContent className="staff-dialog"><DialogHeader><DialogTitle>Reject {rejecting?.id}?</DialogTitle><DialogDescription>Select a reason. The customer will see it in order tracking.</DialogDescription></DialogHeader><div className="reject-options">{["Item Unavailable", "Kitchen Capacity Full", "Cafeteria Closing", "Other"].map(value => <label key={value}><input type="radio" name="reason" checked={reason === value} onChange={() => setReason(value)}/><span>{value}</span></label>)}</div>{reason === "Other" && <Input value={customReason} placeholder="Enter rejection reason" onChange={event => setCustomReason(event.target.value)}/>}<DialogFooter><button className="staff-secondary" onClick={() => setRejecting(null)}>Cancel</button><button className="staff-danger" disabled={reason === "Other" && !customReason.trim()} onClick={() => { if (rejecting) void update(rejecting.id, "Rejected", reason === "Other" ? customReason.trim() : reason); setRejecting(null); }}>Reject Order</button></DialogFooter></DialogContent></Dialog></main>;
}

const blankItem: StaffMenuItem = { id: 0, name: "", category: "Meals", price: 0, image: "/assets/chicken-biryani.jpg", description: "Freshly prepared at the Bahria Bites cafeteria.", rating: 4.5, popular: false, available: true };
function MenuManagement({ items, action }: { items: AppMenuItem[]; action: StaffAction; }) {
    const [editing, setEditing] = useState<StaffMenuItem | null>(null);
    const [removing, setRemoving] = useState<StaffMenuItem | null>(null);
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All");
    const [notice, setNotice] = useState("");
    const filtered = items.filter(item => (category === "All" || item.category === category) && item.name.toLowerCase().includes(query.toLowerCase()));
    const save = async () => {
        if (!editing || !editing.name.trim() || editing.price <= 0) return;
        await action({ action: "menu_save", item: editing });
        setNotice(editing.id ? "Menu item updated." : "New item added.");
        setEditing(null);
        window.setTimeout(() => setNotice(""), 2300);
    };
    const imageFile = (file?: File) => {
        if (!file || !editing) return;
        const reader = new FileReader();
        reader.onload = () => setEditing(value => value ? { ...value, image: String(reader.result) } : value);
        reader.readAsDataURL(file);
    };
    return <main className="staff-main">{notice && <div className="staff-toast"><CheckCircle2 />{notice}</div>}<section className="staff-panel"><div className="staff-panel-head menu-head"><div><h2>Menu Items</h2><p>{items.filter(item => item.available).length} available • {items.filter(item => !item.available).length} sold out</p></div><button className="staff-primary compact" onClick={() => setEditing({ ...blankItem })}><Plus />Add New Item</button></div><div className="menu-toolbar"><div><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search menu items..."/></div><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["All", "Meals", "Snacks", "Desserts", "Drinks"].map(value => <SelectItem value={value} key={value}>{value}</SelectItem>)}</SelectContent></Select></div><div className="staff-menu-grid">{filtered.map(item => <article key={item.id} className={!item.available ? "sold-out" : ""}><div className="staff-menu-image"><img src={item.image} alt={item.name}/>{!item.available && <span>Sold Out</span>}</div><div className="staff-menu-info"><div><small>{item.category}</small><h3>{item.name}</h3><b>{money(item.price)}</b></div><label><Switch checked={item.available} onCheckedChange={available => void action({ action: "menu_toggle", itemId: item.id, available })}/><span>{item.available ? "Available" : "Sold Out"}</span></label><div className="staff-menu-actions"><button onClick={() => setEditing({ ...item })}><Edit3 />Edit</button><button onClick={() => setRemoving(item)}><Trash2 />Remove</button></div></div></article>)}</div></section><Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}><DialogContent className="staff-dialog menu-edit-dialog"><DialogHeader><DialogTitle>{editing?.id ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle><DialogDescription>Changes apply to the shared customer menu.</DialogDescription></DialogHeader>{editing && <div className="menu-form"><div className="menu-form-preview"><img src={editing.image} alt="Preview"/><label className="upload-button">Change image<input type="file" accept="image/*" onChange={event => imageFile(event.target.files?.[0])}/></label></div><Label>Item name<Input value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} placeholder="e.g. Chicken Karahi"/></Label><div className="menu-form-row"><Label>Price (Rs.)<Input type="number" min="1" value={editing.price || ""} onChange={event => setEditing({ ...editing, price: Number(event.target.value) })}/></Label><Label>Category<Select value={editing.category} onValueChange={value => setEditing({ ...editing, category: value as AppMenuItem["category"] })}><SelectTrigger className="full-select"><SelectValue /></SelectTrigger><SelectContent>{["Meals", "Snacks", "Desserts", "Drinks"].map(value => <SelectItem value={value} key={value}>{value}</SelectItem>)}</SelectContent></Select></Label></div><Label>Image URL<Input value={editing.image.startsWith("data:") ? "Uploaded image" : editing.image} onChange={event => setEditing({ ...editing, image: event.target.value })}/></Label><label className="availability-row"><span><b>Available for ordering</b><small>Turn off to mark this item sold out.</small></span><Switch checked={editing.available} onCheckedChange={available => setEditing({ ...editing, available })}/></label></div>}<DialogFooter><button className="staff-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="staff-primary compact" onClick={() => void save()}>{editing?.id ? "Save Changes" : "Add Item"}</button></DialogFooter></DialogContent></Dialog><AlertDialog open={!!removing} onOpenChange={open => !open && setRemoving(null)}><AlertDialogContent className="staff-dialog"><AlertDialogHeader><AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle><AlertDialogDescription>This removes the item from the shared customer menu.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { if (removing) void action({ action: "menu_remove", itemId: removing.id }); setRemoving(null); }}>Remove Item</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></main>;
}

function WalletTopUp({ customers, transactions, action, staffName }: { customers: AppUser[]; transactions: AppTransaction[]; action: StaffAction; staffName: string; }) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [searched, setSearched] = useState(false);
    const [amount, setAmount] = useState("");
    const [confirm, setConfirm] = useState(false);
    const [receipt, setReceipt] = useState<AppTransaction | null>(null);
    const customer = customers.find(item => item.id === selectedId) || null;
    const search = () => {
        const value = query.trim().toLowerCase();
        const found = customers.find(item => item.customerId.toLowerCase() === value);
        setSearched(true);
        setSelectedId(found?.id || null);
    };
    const complete = async () => {
        if (!customer || Number(amount) <= 0) return;
        const value = Math.floor(Number(amount));
        const result = await action({ action: "wallet_topup", customerId: customer.customerId, amount: value, staff: staffName }) as { transactionId: string; createdAt: number; };
        setReceipt({ id: result.transactionId, customerUserId: customer.id, customerId: customer.customerId, customerName: customer.name, amount: value, type: "topup", staff: staffName, createdAt: result.createdAt });
        setAmount("");
        setConfirm(false);
    };
    return <main className="staff-main wallet-page"><div className="wallet-layout"><section className="staff-panel wallet-card"><div className="staff-panel-head"><div><h2>Customer Wallet Top-Up</h2><p>Receive cash and credit the same amount to a student wallet.</p></div></div><Label className="customer-search-label">Customer ID<div className="customer-search"><Input value={query} onChange={event => { setQuery(event.target.value); setSearched(false); setSelectedId(null); }} placeholder="Enter the Customer ID shown in Profile" onKeyDown={event => event.key === "Enter" && search()}/><button onClick={search}><Search />Search</button></div><small>Ask the customer for the unique ID shown on their Profile page.</small></Label>{searched && customer === null && <div className="customer-not-found"><XCircle /><span><b>Customer not found</b><small>Check the ID and try again.</small></span></div>}{customer && <div className="found-customer"><div className="found-profile"><span>{customer.name.split(" ").map(part => part[0]).join("").slice(0, 2)}</span><div><small>Customer found</small><h3>{customer.name}</h3><p>{customer.customerId} • {customer.program}</p></div><div className="balance-box"><small>Current balance</small><b>{money(customer.balance)}</b></div></div><div className="amount-entry"><Label>Cash amount received (Rs.)<Input type="number" min="1" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Enter amount"/></Label><div className="quick-amounts">{[100, 200, 500, 1000].map(value => <button key={value} onClick={() => setAmount(String(value))}>+ {money(value)}</button>)}</div><div className="new-balance"><span>New wallet balance</span><b>{money(customer.balance + (Number(amount) || 0))}</b></div><button className="staff-primary" disabled={!amount || Number(amount) <= 0} onClick={() => setConfirm(true)}><Banknote />Review Top-Up</button></div></div>}</section><aside className="wallet-safety"><span><CheckCircle2 /></span><h3>Cash-to-Wallet Process</h3><ol><li>Verify the student’s customer ID.</li><li>Confirm their name and current balance.</li><li>Count and receive the cash amount.</li><li>Review the top-up before confirming.</li></ol><p><AlertTriangle /> Never complete a top-up before receiving the full cash amount.</p></aside></div><section className="staff-panel transactions"><div className="staff-panel-head"><div><h2>Recent Wallet Transactions</h2><p>Top-ups and customer wallet payments.</p></div></div><Table><TableHeader><TableRow><TableHead>Transaction ID</TableHead><TableHead>Customer</TableHead><TableHead>Amount</TableHead><TableHead>Staff / Source</TableHead><TableHead>Date & Time</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{transactions.map(transaction => <TableRow key={transaction.id}><TableCell><b>{transaction.id}</b></TableCell><TableCell>{transaction.customerName}<small>{transaction.customerId}</small></TableCell><TableCell className={transaction.amount >= 0 ? "tx-amount" : "tx-debit"}>{transaction.amount > 0 ? "+" : ""} {money(transaction.amount)}</TableCell><TableCell>{transaction.staff}</TableCell><TableCell>{new Date(transaction.createdAt).toLocaleString("en-PK")}</TableCell><TableCell><span className="tx-complete"><Check />Completed</span></TableCell></TableRow>)}</TableBody></Table></section><AlertDialog open={confirm} onOpenChange={setConfirm}><AlertDialogContent className="staff-dialog"><AlertDialogHeader><AlertDialogTitle>Confirm wallet top-up</AlertDialogTitle><AlertDialogDescription>Verify the cash has been received before completing this transaction.</AlertDialogDescription></AlertDialogHeader><div className="confirm-topup"><p><span>Customer</span><b>{customer?.name}</b></p><p><span>Customer ID</span><b>{customer?.customerId}</b></p><p><span>Cash received</span><b>{money(Number(amount) || 0)}</b></p><hr /><p><span>New balance</span><strong>{money((customer?.balance || 0) + (Number(amount) || 0))}</strong></p></div><AlertDialogFooter><AlertDialogCancel>Go Back</AlertDialogCancel><AlertDialogAction onClick={() => void complete()}>Confirm Top-Up</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><Dialog open={!!receipt} onOpenChange={open => !open && setReceipt(null)}><DialogContent className="staff-dialog receipt-dialog"><div className="receipt-check"><Check /></div><DialogHeader><DialogTitle>Top-Up Complete</DialogTitle><DialogDescription>The customer’s wallet balance has been updated.</DialogDescription></DialogHeader><div className="receipt-data"><p><span>Transaction ID</span><b>{receipt?.id}</b></p><p><span>Customer</span><b>{receipt?.customerName}</b></p><p><span>Amount added</span><strong>+ {money(receipt?.amount || 0)}</strong></p><p><span>Completed by</span><b>{receipt?.staff}</b></p><p><span>Date & time</span><b>{receipt ? new Date(receipt.createdAt).toLocaleString("en-PK") : ""}</b></p></div><button className="staff-primary" onClick={() => setReceipt(null)}>Done</button></DialogContent></Dialog></main>;
}

export default function StaffApp({ route, orders, menu, users, staff, transactions, action }: {
    route: string;
    orders: AppOrder[];
    menu: AppMenuItem[];
    users: AppUser[];
    staff: AppStaff[];
    transactions: AppTransaction[];
    action: StaffAction;
}) {
    const [staffId, setStaffId] = useState<string | null>(null);
    useEffect(() => setStaffId(localStorage.getItem("bb-staff-auth")), []);
    const currentStaff = staff.find(item => item.id === staffId && item.enabled) || null;
    const page = route.split("/")[1] || "login";
    if (!currentStaff || page === "login")
        return <StaffLogin action={action} onLogin={id => { localStorage.setItem("bb-staff-auth", id); setStaffId(id); staffGo("orders"); }}/>;
    return <StaffShell page={page} staff={currentStaff} onLogout={() => { localStorage.removeItem("bb-staff-auth"); setStaffId(null); staffGo("login"); }}>{page === "menu" ? <MenuManagement items={menu} action={action}/> : page === "wallet" ? <WalletTopUp customers={users} transactions={transactions} action={action} staffName={currentStaff.name}/> : <OrdersDashboard orders={orders} action={action}/>}</StaffShell>;
}
