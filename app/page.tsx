"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Bell, Check, Clock3, Coffee, CreditCard, Camera, Heart, Mail, MapPin, Menu as MenuIcon, Minus, PackageCheck, Phone, Play, Plus, Search, ShoppingBag, ShoppingCart, Sparkles, Star, Trash2, Users, UtensilsCrossed, Wallet, X, } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import StaffApp from "./staff";
import RolePortal from "./role-portals";
import { useAppData } from "@/lib/use-app-data";
import type { AppOrder, AppTransaction, AppUser } from "@/lib/app-data";
declare global {
    interface Document {
        modelContext?: {
            registerTool: (tool: {
                name: string;
                title?: string;
                description: string;
                inputSchema: object;
                annotations?: object;
                execute: (input: unknown) => unknown;
            }, options?: {
                signal: AbortSignal;
            }) => void | Promise<void>;
        };
    }
}
type Category = "Meals" | "Snacks" | "Desserts" | "Drinks";
type Product = {
    id: number;
    name: string;
    category: Category;
    price: number;
    image: string;
    description: string;
    rating: number;
    popular?: boolean;
    available?: boolean;
};
type CartLine = {
    key: string;
    product: Product;
    qty: number;
    extras?: string[];
};
const products: Product[] = [
    { id: 1, name: "Chicken Biryani", category: "Meals", price: 300, image: "/assets/chicken-biryani.jpg", description: "Aromatic basmati rice with tender chicken, special spices, served with raita and salad.", rating: 4.8, popular: true },
    { id: 2, name: "Zinger Burger", category: "Snacks", price: 350, image: "/assets/zinger-burger.jpg", description: "Crispy chicken fillet, fresh lettuce and our creamy house sauce in a soft sesame bun.", rating: 4.7, popular: true },
    { id: 3, name: "Loaded Fries", category: "Snacks", price: 280, image: "/assets/loaded-fries.jpg", description: "Golden fries loaded with cheese sauce, garlic mayo and a spicy drizzle.", rating: 4.6 },
    { id: 4, name: "Chicken Roll", category: "Snacks", price: 220, image: "/assets/chicken-roll.jpg", description: "Soft paratha wrapped around juicy chicken, crunchy vegetables and chutney.", rating: 4.5 },
    { id: 5, name: "Pancakes", category: "Desserts", price: 250, image: "/assets/pancakes.jpg", description: "Fluffy pancake stack with banana, chocolate drizzle and a touch of honey.", rating: 4.7 },
    { id: 6, name: "Cold Coffee", category: "Drinks", price: 180, image: "/assets/cold-coffee.jpg", description: "Chilled, creamy coffee blended fresh and finished with chocolate drizzle.", rating: 4.9, popular: true },
    { id: 7, name: "Beef Pulao", category: "Meals", price: 320, image: "/assets/chicken-biryani.jpg", description: "Fragrant rice cooked with tender beef, whole spices and fresh herbs.", rating: 4.6 },
    { id: 8, name: "Chicken Pasta", category: "Meals", price: 280, image: "/assets/loaded-fries.jpg", description: "Creamy chicken pasta with vegetables, herbs and a light cheese topping.", rating: 4.4 },
    { id: 9, name: "Chocolate Shake", category: "Drinks", price: 220, image: "/assets/cold-coffee.jpg", description: "Rich chocolate shake blended with chilled milk and ice cream.", rating: 4.8 },
];
const categoryMeta = [
    { name: "Meals" as Category, sub: "Biryani, Pulao & more", image: "/assets/chicken-biryani.jpg", icon: UtensilsCrossed },
    { name: "Snacks" as Category, sub: "Burgers, fries & rolls", image: "/assets/zinger-burger.jpg", icon: ShoppingBag },
    { name: "Desserts" as Category, sub: "Something sweet", image: "/assets/pancakes.jpg", icon: Sparkles },
    { name: "Drinks" as Category, sub: "Cold drinks & coffee", image: "/assets/cold-coffee.jpg", icon: Coffee },
];
const navItems = [["Home", "home"], ["Menu", "menu"], ["About", "about"], ["Contact", "contact"]];
const money = (n: number) => `Rs. ${n.toLocaleString("en-PK")}`;
const CART_STORAGE_KEY = "bahria-bites-cart";
const SESSION_USER_KEY = "bb-current-user";
const LAST_ORDER_KEY = "bb-last-order-id";
const extraPrice = (name: string) => name === "Extra Raita" ? 50 : name === "Extra Chicken" ? 120 : name === "Soft Drink" ? 100 : 0;
const lineExtrasTotal = (line: Pick<CartLine, "extras">) => (line.extras || []).reduce((sum, name) => sum + extraPrice(name), 0);
const lineTotal = (line: CartLine) => (line.product.price + lineExtrasTotal(line)) * line.qty;
const cartLineKey = (productId: number, extras: string[] = []) => `${productId}:${[...extras].sort().join("|") || "regular"}`;
function go(route: string) { window.location.hash = route === "home" ? "#/" : `#/${route}`; window.scrollTo({ top: 0, behavior: "smooth" }); }
function routeFromHash() { return typeof window === "undefined" ? "home" : window.location.hash.replace(/^#\/?/, "") || "home"; }
function Logo({ compact = false }: {
    compact?: boolean;
}) { return <button className="brand-logo" onClick={() => go("home")} aria-label="Bahria Bites home"><img src="/assets/bahria-bites-logo.png" alt="Bahria Bites"/><span className={compact ? "sr-only" : "brand-wordmark"}>Good Food • Brighter Days</span></button>; }
function Header({ route, cartCount, user }: {
    route: string;
    cartCount: number;
    user: AppUser | null;
}) {
    const [search, setSearch] = useState("");
    const initials = user ? user.name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase() : "SG";
    return <header className="site-header"><div className="header-inner"><Logo compact/><nav className="desktop-nav" aria-label="Primary navigation">{navItems.map(([label, path]) => <button key={path} className={route === path || (path === "home" && route === "home") ? "active" : ""} onClick={() => go(path)}>{label}</button>)}</nav><form className="header-search" onSubmit={e => { e.preventDefault(); if (search.trim())
        go(`menu?search=${encodeURIComponent(search.trim())}`); }}><Search /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search biryani, burger, fries..." aria-label="Search menu"/></form><button className="wallet-pill" onClick={() => go(user ? "profile" : "login")}><Wallet /><span><small>Wallet</small><b>{money(user?.balance || 0)}</b></span></button><button className="cart-button" onClick={() => go("cart")} aria-label={`Cart with ${cartCount} items`}><ShoppingCart />{cartCount > 0 && <span>{cartCount}</span>}</button><button className="avatar" onClick={() => go(user ? "profile" : "login")} aria-label={user ? "Open profile" : "Sign in"}>{initials}</button><Sheet><SheetTrigger className="mobile-menu" aria-label="Open menu"><MenuIcon /></SheetTrigger><SheetContent side="right" className="mobile-sheet"><SheetTitle className="sr-only">Navigation</SheetTitle><Logo /><div className="mobile-links">{navItems.map(([label, path]) => <SheetClose key={path} render={<button onClick={() => go(path)}>{label}<ArrowRight /></button>}/>)}<SheetClose render={<button onClick={() => go("cart")}>Cart ({cartCount})<ShoppingCart /></button>}/><SheetClose render={<button onClick={() => go("track")}>Track order<Clock3 /></button>}/><SheetClose render={<button onClick={() => go(user ? "profile" : "login")}>{user ? "Profile" : "Login / Signup"}<Users /></button>}/></div></SheetContent></Sheet></div></header>;
}
function Footer() { return <footer><div className="footer-inner"><Logo /><div className="footer-links">{navItems.map(([label, path]) => <button key={path} onClick={() => go(path)}>{label}</button>)}<button onClick={() => go("contact")}>FAQ</button></div><div className="social"><span>Follow us</span><div><Camera /><span className="social-dot">f</span><Play fill="currentColor"/></div></div><div className="uni-mark"><img src="/assets/bahria-university.png" alt="Bahria University crest"/><span>A Bahria University<br />student initiative</span></div></div></footer>; }
function ProductCard({ product, add }: {
    product: Product;
    add: (p: Product) => void;
}) {
    const available = product.available !== false;
    const openDetails = () => available && go(`food/${product.id}`);
    return <article className={`product-card${available ? "" : " product-sold-out"}`} onClick={openDetails} tabIndex={available ? 0 : -1} onKeyDown={e => e.key === "Enter" && openDetails()}><div className="product-image"><img src={product.image} alt={product.name}/>{product.popular && available && <span>Popular</span>}{!available && <span className="sold-out-badge">Sold Out</span>}</div><div className="product-info"><div><h3>{product.name}</h3><p>{product.category}</p><b>{money(product.price)}</b></div><button disabled={!available} onClick={e => { e.stopPropagation(); if (available)
            add(product); }} aria-label={available ? `Add ${product.name}` : `${product.name} is sold out`}><Plus /></button></div></article>;
}
function Home({ add, menuProducts }: {
    add: (p: Product) => void;
    menuProducts: Product[];
}) { return <><main><section className="hero"><div className="hero-copy"><p className="eyebrow">Campus food&nbsp; • &nbsp;Better days</p><h1>Skip<br />the queue.<br /><em>Grab<br />the bite.</em></h1><p className="hero-sub">Order your favourite food before class ends.<br />Pick it up when it’s ready.</p><div className="hero-actions"><button className="primary-btn" onClick={() => go("menu")}>Order Now <ArrowRight /></button><button className="secondary-btn" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}><Play fill="currentColor"/> How It Works</button></div><div className="hero-perks"><span><Clock3 /><b>Save Time</b><small>No more waiting</small></span><span><Users /><b>Student Friendly</b><small>Made for Bahria</small></span><span><Heart /><b>Great Food</b><small>Your favourites</small></span></div></div><div className="hero-visual">
  <img className="hero-food" src="/assets/hero-biryani.jpg" alt="Chicken biryani bowl"/>
</div></section><section className="section categories"><div className="section-heading"><h2>What are you craving?</h2><button onClick={() => go("menu")}>Explore categories <ArrowRight /></button></div><div className="category-grid">{categoryMeta.map((c, i) => <button key={c.name} className={`category-card cat-${i}`} onClick={() => go(`menu?category=${c.name}`)}><c.icon /><span><b>{c.name}</b><small>{c.sub}</small></span><img src={c.image} alt=""/><i><ArrowRight /></i></button>)}</div></section><section className="section favourites"><div className="section-heading"><h2>Campus favourites</h2><div className="filter-pills"><span>All</span><button onClick={() => go("menu?category=Meals")}>Meals</button><button onClick={() => go("menu?category=Snacks")}>Snacks</button><button onClick={() => go("menu?category=Drinks")}>Drinks</button></div></div><div className="product-row">{menuProducts.slice(0, 6).map(p => <ProductCard key={p.id} product={p} add={add}/>)}</div></section><section className="blue-banner"><div><span>Same campus.</span><b>Better bites.</b></div><div className="banner-benefits"><span><Sparkles />Quick Ordering</span><span><CreditCard />Secure Wallet</span><span><Bell />Real-Time Updates</span></div><button onClick={() => go("menu")}>Order now <ArrowRight /></button></section><section className="section how" id="how"><div className="section-heading"><h2>How it works?</h2><span className="script-label">Simple. Fast. Delicious.</span></div><div className="steps">{[[ShoppingBag, "Choose Your Food", "Browse menu & add to cart"], [Wallet, "Pay Securely", "Use your Bahria Bites Wallet"], [Clock3, "Pick a Time", "Quick pickup or choose a time"], [PackageCheck, "Grab Your Order", "Collect from cafeteria & enjoy!"]].map(([Icon, title, sub], i) => <div className="step" key={String(title)}><i>{i + 1}</i><Icon /><b>{String(title)}</b><span>{String(sub)}</span></div>)}</div></section></main><Footer /></>; }
function MenuPage({ add, route, products }: {
    add: (p: Product) => void;
    route: string;
    products: Product[];
}) {
    const params = new URLSearchParams(route.split("?")[1] || "");
    const [cat, setCat] = useState(params.get("category") || "All");
    const [query, setQuery] = useState(params.get("search") || "");
    const filtered = products.filter(p => (cat === "All" || p.category === cat) && p.name.toLowerCase().includes(query.toLowerCase()));
    return <main className="page-main menu-page"><section className="menu-hero"><div><span className="round-icon"><UtensilsCrossed /></span><div><h1>{cat === "All" ? "Menu" : cat}</h1><p>Good food for a better day.</p></div></div><img src={cat === "Drinks" ? "/assets/cold-coffee.jpg" : "/assets/hero-biryani.jpg"} alt="Featured menu item"/></section><div className="mobile-menu-search"><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search the menu"/></div><div className="category-tabs"><button className={cat === "All" ? "active" : ""} onClick={() => setCat("All")}>All</button>{categoryMeta.map(c => <button key={c.name} className={cat === c.name ? "active" : ""} onClick={() => setCat(c.name)}><c.icon />{c.name}</button>)}</div><div className="menu-layout"><aside><h3>Categories</h3><button className={cat === "All" ? "active" : ""} onClick={() => setCat("All")}><ShoppingBag />All items</button>{categoryMeta.map(c => <button key={c.name} className={cat === c.name ? "active" : ""} onClick={() => setCat(c.name)}><c.icon />{c.name}</button>)}<div className="filter-block"><h3>Filters</h3><label><Checkbox /> Vegetarian</label><label><Checkbox /> Popular items</label></div></aside><section className="menu-results"><div className="results-top"><span>{filtered.length} items found</span><div className="inline-search"><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search food"/></div></div>{filtered.length ? <div className="menu-grid">{filtered.map(p => <ProductCard key={p.id} product={p} add={add}/>)}</div> : <div className="empty-state"><Search /><h2>No bites found</h2><p>Try a different search or category.</p><button onClick={() => { setCat("All"); setQuery(""); }}>Show all food</button></div>}</section></div></main>;
}
function FoodDetails({ id, addDetailed, products }: {
    id: number;
    addDetailed: (p: Product, qty: number, extras: string[]) => void;
    products: Product[];
}) {
    const product = products.find(p => p.id === id) || products[0];
    const available = product?.available !== false;
    const [qty, setQty] = useState(1);
    const [extras, setExtras] = useState<string[]>(["Extra Raita"]);
    const toggle = (x: string) => setExtras(v => v.includes(x) ? v.filter(e => e !== x) : [...v, x]);
    const extraTotal = extras.reduce((s, x) => s + extraPrice(x), 0);
    return <main className="page-main detail-page"><button className="back-link" onClick={() => go("menu")}><ArrowLeft /> Back to Menu</button><div className="detail-layout"><div className="detail-gallery"><span className="best-badge">Bestseller</span><img className="detail-main-img" src={product.image} alt={product.name}/><div className="thumbs"><img src={product.image} alt="Alternate view"/><img src="/assets/hero-biryani.jpg" alt="Serving view"/><img src="/assets/chicken-biryani.jpg" alt="Close view"/></div><div className="detail-benefits"><span><Sparkles /><b>Freshly Prepared</b></span><span><Heart /><b>Student Favourite</b></span><span><BadgeCheck /><b>Quality Ingredients</b></span></div></div><section className="detail-info"><p className="eyebrow">{product.category} • Student favourite</p><h1>{product.name}</h1><p className="detail-desc">{product.description}</p><h2>{money(product.price)}</h2><p className="rating"><Star fill="currentColor"/> {product.rating} <span>(120+ orders)</span></p><div className="option-card"><h3>Quantity</h3><div className="qty-control"><button aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))}><Minus /></button><b>{qty}</b><button aria-label="Increase quantity" onClick={() => setQty(qty + 1)}><Plus /></button></div><h3>Add Extras <span>(Optional)</span></h3>{[["Extra Raita", 50], ["Extra Chicken", 120], ["Soft Drink", 100]].map(([name, price]) => <label key={String(name)}><Checkbox checked={extras.includes(String(name))} onCheckedChange={() => toggle(String(name))}/><span>{String(name)}</span><b>+ {money(Number(price))}</b></label>)}</div><button className="add-cart-big" disabled={!available} onClick={() => { if (!available) return; addDetailed(product, qty, extras); go("cart"); }}><ShoppingCart />{available ? "Add to Cart" : "Sold Out"}<span /><b>{money((product.price + extraTotal) * qty)}</b></button></section></div></main>;
}
function CartPage({ cart, updateQty, remove, clear, products }: {
    cart: CartLine[];
    updateQty: (key: string, d: number) => void;
    remove: (key: string) => void;
    clear: () => void;
    products: Product[];
}) {
    const subtotal = cart.reduce((s, l) => s + lineTotal(l), 0);
    return <main className="page-main cart-page"><div className="page-title-row"><div><span className="round-icon"><ShoppingCart /></span><div><h1>Your Cart</h1><p>{cart.length ? "Almost there! Review your bites." : "Your next favourite bite is waiting."}</p></div></div>{cart.length > 0 && <button className="clear-btn" onClick={clear}><Trash2 /> Clear Cart</button>}</div>{cart.length ? <div className="cart-layout"><section className="cart-list">{cart.map(line => <article className="cart-line" key={line.key}><img src={line.product.image} alt={line.product.name}/><div className="cart-item-info"><h3>{line.product.name}</h3>{line.extras?.length ? <p>+ {line.extras.join(", ")}</p> : <p>{line.product.category}</p>}</div><div className="qty-control"><button aria-label={`Decrease ${line.product.name} quantity`} onClick={() => updateQty(line.key, -1)}><Minus /></button><b>{line.qty}</b><button aria-label={`Increase ${line.product.name} quantity`} onClick={() => updateQty(line.key, 1)}><Plus /></button></div><b>{money(lineTotal(line))}</b><button className="remove-btn" aria-label={`Remove ${line.product.name}`} onClick={() => remove(line.key)}><X /></button></article>)}<div className="cart-more"><h3>Add more from the menu</h3><div>{products.filter(p => p.available !== false && !cart.some(l => l.product.id === p.id)).slice(0, 3).map(p => <button key={p.id} onClick={() => go(`food/${p.id}`)}><img src={p.image} alt=""/><span>{p.name}<small>{money(p.price)}</small></span><Plus /></button>)}</div></div></section><aside className="summary-card"><h2>Order Summary</h2><p><span>Subtotal</span><b>{money(subtotal)}</b></p><p><span>Service fee</span><b>Rs. 0</b></p><hr /><p className="total"><span>Total</span><b>{money(subtotal)}</b></p><button className="primary-btn" onClick={() => go("checkout")}>Proceed to Checkout <ArrowRight /></button><small><BadgeCheck /> No hidden charges</small></aside></div> : <div className="empty-cart"><ShoppingCart /><h2>Your cart is empty</h2><p>Add something delicious from the cafeteria menu.</p><button className="primary-btn" onClick={() => go("menu")}>Explore Menu <ArrowRight /></button></div>}</main>;
}
function Checkout({ cart, placeOrder, user }: {
    cart: CartLine[];
    placeOrder: (details: { pickupTime: string; payment: "wallet" | "demo"; }) => Promise<void>;
    user: AppUser | null;
}) {
    const [pickupTime, setPickupTime] = useState("15 min");
    const [payment, setPayment] = useState<"wallet" | "demo">("wallet");
    const [error, setError] = useState("");
    const [placing, setPlacing] = useState(false);
    const subtotal = cart.reduce((s, l) => s + lineTotal(l), 0);
    const insufficient = payment === "wallet" && !!user && user.balance < subtotal;
    return <main className="page-main checkout-page"><div className="page-title-row"><div><span className="round-icon"><ShoppingBag /></span><div><h1>Checkout</h1><p>Just a few more steps to get your food!</p></div></div></div>{cart.length === 0 ? <div className="empty-cart"><ShoppingBag /><h2>Nothing to checkout yet</h2><p>Add your favourite food first.</p><button className="primary-btn" onClick={() => go("menu")}>Browse Menu</button></div> : <div className="checkout-layout"><section><div className="checkout-block"><h2><span>1</span> Pickup Time</h2><div className="time-grid">{["10 min", "15 min", "20 min", "30 min"].map(t => <button key={t} className={pickupTime === t ? "active" : ""} onClick={() => setPickupTime(t)}><b>{t}</b><small>{t === "10 min" ? "Quick pickup" : "Popular"}</small></button>)}</div><label className="schedule-label">Or schedule for later<select value={pickupTime.startsWith("Today") ? pickupTime : ""} onChange={e => e.target.value && setPickupTime(e.target.value)}><option value="">Choose a time</option><option>Today, 1:30 PM</option><option>Today, 2:00 PM</option><option>Today, 2:30 PM</option></select></label></div><div className="checkout-block"><h2><span>2</span> Payment Method</h2><RadioGroup value={payment} onValueChange={setPayment} className="payment-grid"><Label className={payment === "wallet" ? "active" : ""}><RadioGroupItem value="wallet"/><Wallet /><span><b>Bahria Bites Wallet</b><small>Balance: {money(user?.balance || 0)}</small></span></Label><Label className={payment === "demo" ? "active" : ""}><RadioGroupItem value="demo"/><CreditCard /><span><b>Online Payment</b><small>Demo only</small></span></Label></RadioGroup></div></section><aside className="summary-card"><h2>Order Summary</h2>{cart.map(l => <p key={l.key}><span>{l.product.name} × {l.qty}</span><b>{money(lineTotal(l))}</b></p>)}<hr /><p className="total"><span>Total</span><b>{money(subtotal)}</b></p><p className="pickup-summary"><Clock3 /><span>{pickupTime.startsWith("Today") ? "Scheduled for " : "Ready in approximately "}<b>{pickupTime}</b></span></p><>{error && <p className="checkout-error" role="alert">{error}</p>}<button className="primary-btn" disabled={placing || insufficient} onClick={async () => { if (!user) { go("login"); return; } if (insufficient) { setError(`Insufficient wallet balance. Add ${money(subtotal - user.balance)} more.`); return; } setPlacing(true); setError(""); try { await placeOrder({ pickupTime, payment }); } catch (failure) { setError(failure instanceof Error ? failure.message : "Order could not be placed."); setPlacing(false); } }}>{placing ? "Placing Order..." : insufficient ? "Insufficient Wallet Balance" : "Place Order"} <ArrowRight /></button></><small><BadgeCheck /> Demo checkout — no real payment</small></aside></div>}</main>;
}
function Tracking({ order }: { order: AppOrder | null; }) {
    const steps = ["Placed", "Accepted", "Preparing", "Ready", "Collected"];
    const currentIndex = !order ? -1 : order.status === "Pending" ? 0 : order.status === "Accepted" ? 1 : order.status === "Preparing" ? 2 : order.status === "Ready" ? 3 : order.status === "Collected" ? 4 : -1;
    const statusLabel = order?.status === "Pending" ? "placed" : order?.status.toLowerCase();
    if (!order)
        return <main className="tracking-page"><section className="tracking-hero"><p>No active order</p><h1>Your next bite<br /><em>starts here.</em></h1></section><div className="empty-cart"><ShoppingBag /><h2>No order to track yet</h2><p>Place an order and its live status will appear here.</p><button className="primary-btn" onClick={() => go("menu")}>Browse Menu</button></div></main>;
    return <main className="tracking-page"><section className="tracking-hero"><p>Order #{order.id}</p><h1>Your order is<br /><em>{statusLabel}.</em></h1><span>{order.pickupTime.startsWith("Today") ? "Scheduled Pickup" : "Estimated Ready Time"}</span><strong>{order.pickupTime}</strong><div className="track-steps">{steps.map((step, index) => <div className={index < currentIndex ? "done" : index === currentIndex ? "current" : ""} key={step}><i>{index < currentIndex || (index === 0 && currentIndex === 0) ? <Check /> : index === currentIndex ? <Clock3 /> : null}</i><b>{step}</b>{index < steps.length - 1 && <span />}</div>)}</div></section>{order.status === "Rejected" && <div className="reject-reason"><X /> Order rejected{order.rejectReason ? `: ${order.rejectReason}` : "."}</div>}<section className="order-detail-card"><div><h2>Order Details</h2>{order.items.map(item => <article key={item.id}><img src={item.image} alt=""/><span><b>{item.name} × {item.quantity}</b><small>{item.extras.length ? item.extras.join(", ") : "Regular"}</small></span><b>{money(item.lineTotal)}</b></article>)}<hr /><p><MapPin /><span><small>Pickup Counter</small><b>Main Cafeteria</b></span></p><p><CreditCard /><span><small>Payment</small><b>{order.payment === "wallet" ? "Bahria Bites Wallet" : "Online Payment (Demo)"}</b></span></p></div><aside><span>{order.pickupCode}</span><b>Pickup code</b><p>Show this code at the counter</p></aside></section><div className="tracking-note"><Bell /> We’ll notify you when your order is ready!</div></main>;
}
function AuthPage({ onAuthenticated }: { onAuthenticated: (userId: string) => void; }) {
    const [tab, setTab] = useState<"login" | "signup">("login");
    const [done, setDone] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const switchTab = (next: "login" | "signup") => { setTab(next); setError(""); setPassword(""); setConfirmPassword(""); };
    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (tab === "signup" && password !== confirmPassword) { setError("Passwords do not match."); return; }
        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/app-data", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(tab === "signup" ? { action: "signup", name, email, password } : { action: "login", email, password }),
            });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || "Unable to sign in.");
            onAuthenticated(body.result.userId);
            setDone(true);
        } catch (failure) {
            setError(failure instanceof Error ? failure.message : "Unable to sign in.");
        } finally {
            setLoading(false);
        }
    };
    if (done)
        return <main className="auth-wrap"><div className="auth-card success-card"><Logo /><span className="success-check"><Check /></span><h1>Welcome to Bahria Bites!</h1><p>Your customer profile is ready.</p><button className="primary-btn" onClick={() => go("profile")}>View Profile <ArrowRight /></button></div></main>;
    return <main className="auth-wrap"><div className="auth-card"><Logo /><div className="auth-tabs"><button className={tab === "login" ? "active" : ""} onClick={() => switchTab("login")}>Login</button><button className={tab === "signup" ? "active" : ""} onClick={() => switchTab("signup")}>Sign Up</button></div><h1>{tab === "login" ? "Good to see you again!" : "Join Bahria Bites"}</h1><p>{tab === "login" ? "Sign in to continue" : "Create your account and start ordering"}</p><form onSubmit={submit}>{tab === "signup" && <Input required value={name} onChange={event => setName(event.target.value)} placeholder="Full Name"/>}<Input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email / Student ID"/><Input required minLength={6} type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Password"/>{tab === "signup" && <Input required minLength={6} type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Confirm Password"/>}{error && <p className="auth-error" role="alert">{error}</p>}{tab === "login" && <div className="auth-options"><label><Checkbox /> Remember me</label><button type="button" onClick={() => setError("Password recovery is unavailable in this demo.")}>Forgot password?</button></div>}<button className="primary-btn" type="submit" disabled={loading}>{loading ? "Please wait..." : tab === "login" ? "Login" : "Create Account"}</button></form><button className="auth-switch" onClick={() => switchTab(tab === "login" ? "signup" : "login")}>{tab === "login" ? "Don’t have an account? Create one →" : "Already have an account? Login →"}</button></div></main>;
}
function Profile({ user, transactions, onLogout }: { user: AppUser; transactions: AppTransaction[]; onLogout: () => void; }) {
    const activity = transactions.filter(transaction => transaction.customerUserId === user.id).slice(0, 5);
    return <main className="page-main profile-page"><div className="page-title-row"><div><span className="round-icon"><Users /></span><div><h1>My Profile</h1><p>Your Bahria Bites customer details and wallet.</p></div></div><button className="clear-btn" onClick={onLogout}><ArrowLeft /> Log out</button></div><div className="profile-layout"><section className="profile-card"><div className="profile-avatar">{user.name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase()}</div><h2>{user.name}</h2><p>{user.email}</p><div className="customer-id-box"><small>Customer ID</small><strong>{user.customerId}</strong><span>Give this ID to cafeteria staff for wallet top-up.</span></div><div className="profile-wallet"><Wallet /><span><small>Bahria Bites Wallet</small><b>{money(user.balance)}</b></span></div></section><section className="profile-activity"><h2>Wallet Activity</h2>{activity.length ? activity.map(transaction => <article key={transaction.id}><span className={transaction.type}><Wallet /></span><div><b>{transaction.type === "topup" ? "Wallet Top-Up" : "Order Payment"}</b><small>{new Date(transaction.createdAt).toLocaleString("en-PK")}{transaction.orderId ? ` • ${transaction.orderId}` : ""}</small></div><strong>{transaction.amount > 0 ? "+" : ""}{money(transaction.amount)}</strong></article>) : <div className="empty-state"><Wallet /><h2>No wallet activity</h2><p>Top-ups and wallet payments will appear here.</p></div>}</section></div></main>;
}
function About() { return <main className="about-page"><section className="about-hero"><img src="/assets/bahria-campus.jpg" alt="Bahria University campus"/><div><p className="eyebrow">Born on campus</p><h1>About<br />Bahria Bites</h1><p>Bahria Bites is a university cafeteria pre-order experience built for Bahria University students. Our goal is simple: less time in queues, more time for what matters.</p><button className="primary-btn" onClick={() => go("menu")}>Explore the menu <ArrowRight /></button></div></section><section className="about-values"><div><Clock3 /><h3>Skip the Queue</h3><p>Order ahead and collect at your chosen time.</p></div><div><Users /><h3>Student First</h3><p>Designed around real campus schedules.</p></div><div><BadgeCheck /><h3>Quality Food</h3><p>Fresh favourites from trusted cafeteria vendors.</p></div><div><Heart /><h3>Better Campus Life</h3><p>Good food should make busy days brighter.</p></div></section><section className="about-story"><div><p className="eyebrow">Our purpose</p><h2>Same campus.<br /><em>Better bites.</em></h2></div><p>Long cafeteria lines can take up the short breaks between classes. Bahria Bites brings the menu to your phone, lets you choose a pickup time and keeps you updated until your meal is ready. This Version 1 uses demo information while we shape the experience with students.</p></section></main>; }
function Contact() { const [sent, setSent] = useState(false); return <main className="page-main contact-page"><section><p className="eyebrow">We’re here to help</p><h1>Get in Touch</h1><p>Questions, feedback or a food suggestion? Send it our way.</p><div className="contact-details"><span><Mail /><b>Email</b><small>support@bahriabites.com</small></span><span><MapPin /><b>Location</b><small>Bahria University, Karachi</small></span><span><Clock3 /><b>Response time</b><small>Within 24 hours</small></span><span><Phone /><b>Student support</b><small>Mon–Sat, 9 AM–6 PM</small></span></div></section><form className="contact-form" onSubmit={e => { e.preventDefault(); setSent(true); }}>{sent ? <div className="sent-state"><span><Check /></span><h2>Message sent!</h2><p>Thanks for reaching out. We’ll get back to you soon.</p><button type="button" onClick={() => setSent(false)}>Send another</button></div> : <><div><Input required placeholder="Your Name"/><Input required type="email" placeholder="Your Email"/></div><Input required placeholder="Subject"/><Textarea required placeholder="Write your message..."/><button className="primary-btn" type="submit">Send Message <ArrowRight /></button></>}</form></main>; }
export default function App() {
    const { data: sharedData, refresh: refreshData, runAction } = useAppData();
    const [route, setRoute] = useState("home");
    const [cart, setCart] = useState<CartLine[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [lastOrderId, setLastOrderId] = useState<string | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const menuProducts: Product[] = useMemo(() => (sharedData.menu.length ? sharedData.menu : products.map(product => ({ ...product, available: true }))) as Product[], [sharedData.menu]);
    const currentUser = sharedData.users.find(user => user.id === currentUserId) || null;
    const lastOrder = currentUserId
        ? sharedData.orders.find(order => order.id === lastOrderId && order.customerUserId === currentUserId)
            || sharedData.orders.find(order => order.customerUserId === currentUserId)
            || null
        : null;
    useEffect(() => {
        const updateRoute = () => setRoute(routeFromHash());
        updateRoute();
        setCurrentUserId(localStorage.getItem(SESSION_USER_KEY));
        setLastOrderId(localStorage.getItem(LAST_ORDER_KEY));
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart) as Array<Partial<CartLine> & Pick<CartLine, "product" | "qty">>;
                setCart(parsed.map(line => ({ ...line, key: line.key || cartLineKey(line.product.id, line.extras) })));
            } catch { }
        }
        setHydrated(true);
        window.addEventListener("hashchange", updateRoute);
        return () => window.removeEventListener("hashchange", updateRoute);
    }, []);
    useEffect(() => {
        if (hydrated) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }, [cart, hydrated]);
    useEffect(() => {
        if (!hydrated) return;
        setCart(current => current.map(line => {
            const latest = menuProducts.find(product => product.id === line.product.id);
            return { ...line, product: latest || { ...line.product, available: false } };
        }));
    }, [menuProducts, hydrated]);
    useEffect(() => {
        void refreshData();
        const timer = window.setInterval(() => void refreshData(), 1500);
        return () => window.clearInterval(timer);
    }, [route, refreshData]);
    const add = (product: Product) => {
        if (product.available === false) return;
        const key = cartLineKey(product.id);
        setCart(current => {
            const found = current.find(line => line.key === key);
            return found ? current.map(line => line.key === key ? { ...line, qty: line.qty + 1 } : line) : [...current, { key, product, qty: 1, extras: [] }];
        });
    };
    const addDetailed = (product: Product, qty: number, extras: string[]) => {
        if (product.available === false) return;
        const key = cartLineKey(product.id, extras);
        setCart(current => {
            const found = current.find(line => line.key === key);
            return found ? current.map(line => line.key === key ? { ...line, qty: line.qty + qty } : line) : [...current, { key, product, qty, extras }];
        });
    };
    useEffect(() => {
        const context = document.modelContext;
        if (!context?.registerTool) return;
        const lifecycle = new AbortController();
        void Promise.resolve(context.registerTool({
            name: "add_food_to_cart",
            title: "Add food to cart",
            description: "Add an available Bahria Bites menu item to the visible shopping cart by product ID and quantity.",
            inputSchema: { type: "object", properties: { productId: { type: "number", minimum: 1 }, quantity: { type: "number", minimum: 1, maximum: 20 } }, required: ["productId"], additionalProperties: false },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute(input) {
                const request = input as { productId?: number; quantity?: number; };
                const product = menuProducts.find(item => item.id === request.productId);
                if (!product || product.available === false) throw new Error("This menu item is unavailable.");
                const quantity = Math.max(1, Math.min(20, Number(request.quantity) || 1));
                const key = cartLineKey(product.id);
                setCart(current => {
                    const found = current.find(line => line.key === key);
                    return found ? current.map(line => line.key === key ? { ...line, qty: line.qty + quantity } : line) : [...current, { key, product, qty: quantity, extras: [] }];
                });
                return { added: product.name, quantity };
            },
        }, { signal: lifecycle.signal })).catch(() => { });
        return () => lifecycle.abort();
    }, [menuProducts]);
    const updateQty = (key: string, delta: number) => setCart(current => current.map(line => line.key === key ? { ...line, qty: line.qty + delta } : line).filter(line => line.qty > 0));
    const cartCount = useMemo(() => cart.reduce((sum, line) => sum + line.qty, 0), [cart]);
    const base = route.split("?")[0];
    if (base.startsWith("staff"))
        return <StaffApp route={base} orders={sharedData.orders} menu={sharedData.menu} users={sharedData.users} staff={sharedData.staff} transactions={sharedData.transactions} action={runAction}/>;
    if (base.startsWith("owner"))
        return <RolePortal role="owner" route={base} data={sharedData} action={runAction}/>;
    if (base.startsWith("university"))
        return <RolePortal role="university" route={base} data={sharedData} action={runAction}/>;
    if (base.startsWith("system-admin"))
        return <RolePortal role="system-admin" route={base} data={sharedData} action={runAction}/>;
    let page: React.ReactNode;
    if (base.startsWith("food/"))
        page = <FoodDetails id={Number(base.split("/")[1])} addDetailed={addDetailed} products={menuProducts}/>;
    else if (base === "menu")
        page = <MenuPage key={route} add={add} route={route} products={menuProducts}/>;
    else if (base === "cart")
        page = <CartPage cart={cart} products={menuProducts} updateQty={updateQty} remove={key => setCart(current => current.filter(line => line.key !== key))} clear={() => setCart([])}/>;
    else if (base === "checkout")
        page = <Checkout cart={cart} user={currentUser} placeOrder={async ({ pickupTime, payment }) => {
            if (!currentUser) throw new Error("Please log in before placing an order.");
            const result = await runAction({
                action: "place_order",
                userId: currentUser.id,
                pickupTime,
                payment,
                items: cart.map(line => ({ productId: line.product.id, quantity: line.qty, extras: line.extras || [] })),
            }) as { orderId: string; pickupCode: string; };
            localStorage.setItem(LAST_ORDER_KEY, result.orderId);
            setLastOrderId(result.orderId);
            setCart([]);
            go("track");
        }}/>;
    else if (base === "track")
        page = <Tracking order={lastOrder}/>;
    else if (base === "login")
        page = <AuthPage onAuthenticated={userId => { localStorage.setItem(SESSION_USER_KEY, userId); setCurrentUserId(userId); void refreshData(); }}/>;
    else if (base === "profile")
        page = currentUser ? <Profile user={currentUser} transactions={sharedData.transactions} onLogout={() => { localStorage.removeItem(SESSION_USER_KEY); localStorage.removeItem(LAST_ORDER_KEY); setCurrentUserId(null); setLastOrderId(null); go("login"); }}/> : <AuthPage onAuthenticated={userId => { localStorage.setItem(SESSION_USER_KEY, userId); setCurrentUserId(userId); void refreshData(); }}/>;
    else if (base === "about")
        page = <About />;
    else if (base === "contact")
        page = <Contact />;
    else
        page = <Home add={add} menuProducts={menuProducts}/>;
    return <div className="app-shell"><Header route={base} cartCount={cartCount} user={currentUser}/>{page}{!["home", "login", "track"].includes(base) && !base.startsWith("food/") && <Footer />}{cartCount > 0 && base !== "cart" && <button className="mobile-cart-bar" onClick={() => go("cart")}><ShoppingCart /><span>{cartCount} item{cartCount === 1 ? "" : "s"}</span><b>View Cart <ArrowRight /></b></button>}</div>;
}
