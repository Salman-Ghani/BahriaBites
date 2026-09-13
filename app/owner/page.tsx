"use client";

import { useAppData } from "@/lib/use-app-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const money = (value: number) => `Rs. ${value.toLocaleString("en-PK")}`;

export default function CafeteriaOwnerPage() {
  const { data, loading, error } = useAppData();
  const now = new Date();
  const completedToday = data.orders.filter(order => {
    const orderedAt = new Date(order.orderedAt);
    return order.status === "Collected"
      && orderedAt.getFullYear() === now.getFullYear()
      && orderedAt.getMonth() === now.getMonth()
      && orderedAt.getDate() === now.getDate();
  });
  const todaySales = completedToday.reduce((sum, order) => sum + order.total, 0);
  const walletSales = completedToday.filter(order => order.payment === "wallet").reduce((sum, order) => sum + order.total, 0);
  const onlineSales = completedToday.filter(order => order.payment === "demo").reduce((sum, order) => sum + order.total, 0);

  return <div className="owner-direct">
    <header>
      <div className="owner-direct-brand">
        <img src="/assets/bahria-bites-logo.png" alt="Bahria Bites"/>
        <div><b>Bahria Bites</b><span>Cafeteria Owner</span></div>
      </div>
      <span className="owner-readonly">Read-only</span>
    </header>
    <main>
      <h1>Sales Overview</h1>
      <p className="owner-direct-date">{now.toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      {loading ? <p className="owner-direct-state">Loading dashboard...</p> : error ? <p className="owner-direct-state error" role="alert">{error}</p> : <>
        <section className="owner-direct-stats">
          <article><small>Today&apos;s Sales</small><b>{money(todaySales)}</b></article>
          <article><small>Total Orders</small><b>{data.orders.length}</b></article>
          <article><small>Bahria Bites Wallet Sales</small><b>{money(walletSales)}</b></article>
          <article><small>Online Payment Sales</small><b>{money(onlineSales)}</b></article>
        </section>
        <section className="owner-direct-panel">
          <div className="owner-direct-heading"><h2>Recent Orders</h2><p>Latest orders from the shared ordering system.</p></div>
          <div className="owner-direct-table"><Table>
            <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Payment</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Ordered</TableHead></TableRow></TableHeader>
            <TableBody>{data.orders.slice(0, 8).map(order => <TableRow key={order.id}>
              <TableCell><b>{order.id}</b></TableCell>
              <TableCell>{order.customerName}<small>{order.customerId}</small></TableCell>
              <TableCell>{order.payment === "wallet" ? "Bahria Bites Wallet" : "Online Payment"}</TableCell>
              <TableCell><b>{money(order.total)}</b></TableCell>
              <TableCell><span className={`owner-order-status ${order.status.toLowerCase()}`}>{order.status}</span></TableCell>
              <TableCell>{new Date(order.orderedAt).toLocaleString("en-PK")}</TableCell>
            </TableRow>)}{!data.orders.length && <TableRow><TableCell colSpan={6} className="owner-direct-state">No orders yet.</TableCell></TableRow>}</TableBody>
          </Table></div>
        </section>
      </>}
    </main>
  </div>;
}
