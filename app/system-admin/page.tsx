"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppData } from "@/lib/use-app-data";

const money = (value: number) => `Rs. ${value.toLocaleString("en-PK")}`;
const paymentLabel = (payment: "wallet" | "demo") => payment === "wallet" ? "Bahria Bites Wallet" : "Online Payment";

export default function SystemAdministratorPage() {
  const { data, loading, error: loadError, runAction } = useAppData();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  const createStaff = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setActionError("");
    setNotice("");
    try {
      await runAction({ action: "staff_create", name, email, password });
      setName("");
      setEmail("");
      setPassword("");
      setNotice("Staff account created successfully.");
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Unable to create the staff account.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStaff = async (staffId: string, enabled: boolean) => {
    setSaving(true);
    setActionError("");
    setNotice("");
    try {
      await runAction({ action: "staff_toggle", staffId, enabled });
      setNotice(`Staff account ${enabled ? "enabled" : "disabled"}.`);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Unable to update the staff account.");
    } finally {
      setSaving(false);
    }
  };

  return <div className="system-admin-direct">
    <header>
      <div className="system-admin-brand">
        <img src="/assets/bahria-bites-logo.png" alt="Bahria Bites"/>
        <div><b>Bahria Bites</b><span>System Administrator</span></div>
      </div>
      <span className="system-admin-access">Direct access</span>
    </header>
    <main>
      <div className="system-admin-heading">
        <h1>System Administration</h1>
        <p>Shared application records and cafeteria staff access.</p>
      </div>
      {loading ? <p className="system-admin-state">Loading dashboard...</p> : loadError ? <p className="system-admin-state error" role="alert">{loadError}</p> : <>
        <section className="system-admin-stats">
          <article><small>Total Users</small><b>{data.users.length}</b></article>
          <article><small>Total Cafeteria Staff</small><b>{data.staff.length}</b></article>
          <article><small>Total Orders</small><b>{data.orders.length}</b></article>
          <article><small>Total Transactions</small><b>{data.transactions.length}</b></article>
        </section>

        <Tabs defaultValue="users" className="system-admin-tabs">
          <div className="system-admin-tab-scroll"><TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="staff">Cafeteria Staff</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList></div>

          <TabsContent value="users"><section className="system-admin-panel">
            <div className="system-admin-panel-head"><h2>Users</h2><p>Registered Bahria Bites customer accounts.</p></div>
            <div className="system-admin-table"><Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Customer ID</TableHead><TableHead>Email</TableHead><TableHead>Program</TableHead><TableHead>Wallet Balance</TableHead></TableRow></TableHeader>
              <TableBody>{data.users.map(user => <TableRow key={user.id}><TableCell><b>{user.name}</b></TableCell><TableCell>{user.customerId}</TableCell><TableCell>{user.email}</TableCell><TableCell>{user.program}</TableCell><TableCell>{money(user.balance)}</TableCell></TableRow>)}{!data.users.length && <TableRow><TableCell colSpan={5} className="system-admin-state">No users yet.</TableCell></TableRow>}</TableBody>
            </Table></div>
          </section></TabsContent>

          <TabsContent value="staff"><div className="system-admin-staff-layout">
            <section className="system-admin-panel">
              <div className="system-admin-panel-head"><h2>Cafeteria Staff</h2><p>Enable or disable existing staff access.</p></div>
              {(notice || actionError) && <p className={`system-admin-message ${actionError ? "error" : "success"}`} role={actionError ? "alert" : "status"}>{actionError || notice}</p>}
              <div className="system-admin-staff-list">{data.staff.map(staff => <article key={staff.id}>
                <div><b>{staff.name}</b><span>{staff.email}</span><small>Created {new Date(staff.createdAt).toLocaleDateString("en-PK")}</small></div>
                <label><Switch checked={staff.enabled} disabled={saving} onCheckedChange={enabled => void toggleStaff(staff.id, enabled)} aria-label={`${staff.enabled ? "Disable" : "Enable"} ${staff.name}`}/><span>{staff.enabled ? "Enabled" : "Disabled"}</span></label>
              </article>)}{!data.staff.length && <p className="system-admin-state">No staff accounts yet.</p>}</div>
            </section>
            <section className="system-admin-panel system-admin-create">
              <div className="system-admin-panel-head"><h2>Create Staff Account</h2><p>Add a cafeteria staff login.</p></div>
              <form onSubmit={createStaff}>
                <Label>Full name<Input required value={name} onChange={event => setName(event.target.value)}/></Label>
                <Label>Email<Input required type="email" value={email} onChange={event => setEmail(event.target.value)}/></Label>
                <Label>Temporary password<Input required type="password" minLength={6} value={password} onChange={event => setPassword(event.target.value)}/></Label>
                <button type="submit" disabled={saving}>{saving ? "Saving..." : "Create Staff Account"}</button>
              </form>
            </section>
          </div></TabsContent>

          <TabsContent value="orders"><section className="system-admin-panel">
            <div className="system-admin-panel-head"><h2>Orders</h2><p>All customer orders in the shared system.</p></div>
            <div className="system-admin-table"><Table>
              <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead>Payment</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Ordered</TableHead></TableRow></TableHeader>
              <TableBody>{data.orders.map(order => <TableRow key={order.id}><TableCell><b>{order.id}</b></TableCell><TableCell>{order.customerName}<small>{order.customerId}</small></TableCell><TableCell>{order.items.map(item => `${item.quantity}× ${item.name}`).join(", ")}</TableCell><TableCell>{paymentLabel(order.payment)}</TableCell><TableCell><b>{money(order.total)}</b></TableCell><TableCell><span className={`system-admin-status ${order.status.toLowerCase()}`}>{order.status}</span></TableCell><TableCell>{new Date(order.orderedAt).toLocaleString("en-PK")}</TableCell></TableRow>)}{!data.orders.length && <TableRow><TableCell colSpan={7} className="system-admin-state">No orders yet.</TableCell></TableRow>}</TableBody>
            </Table></div>
          </section></TabsContent>

          <TabsContent value="transactions"><section className="system-admin-panel">
            <div className="system-admin-panel-head"><h2>Transactions</h2><p>Wallet top-ups and customer order debits.</p></div>
            <div className="system-admin-table"><Table>
              <TableHeader><TableRow><TableHead>Transaction</TableHead><TableHead>Customer</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Staff / Source</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>{data.transactions.map(transaction => <TableRow key={transaction.id}><TableCell><b>{transaction.id}</b></TableCell><TableCell>{transaction.customerName}<small>{transaction.customerId}</small></TableCell><TableCell>{transaction.type === "topup" ? "Wallet Top-Up" : "Order Payment"}</TableCell><TableCell className={transaction.amount < 0 ? "system-admin-debit" : "system-admin-credit"}>{transaction.amount > 0 ? "+" : ""}{money(transaction.amount)}</TableCell><TableCell>{transaction.staff}</TableCell><TableCell>{new Date(transaction.createdAt).toLocaleString("en-PK")}</TableCell></TableRow>)}{!data.transactions.length && <TableRow><TableCell colSpan={6} className="system-admin-state">No transactions yet.</TableCell></TableRow>}</TableBody>
            </Table></div>
          </section></TabsContent>
        </Tabs>
      </>}
    </main>
  </div>;
}
