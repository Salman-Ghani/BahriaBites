"use client";

import { useAppData } from "@/lib/use-app-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const money = (value: number) => `Rs. ${value.toLocaleString("en-PK")}`;

export default function UniversityAdministrationPage() {
  const { data, loading, error } = useAppData();

  return <div className="university-direct">
    <header>
      <div className="university-direct-brand">
        <img src="/assets/bahria-bites-logo.png" alt="Bahria Bites"/>
        <div><b>Bahria Bites</b><span>University Administration</span></div>
      </div>
      <span className="university-readonly">Read-only</span>
    </header>
    <main>
      <section className="university-direct-panel">
        <div className="university-direct-heading">
          <h1>Cafeteria Menu</h1>
          <p>Current items published by the cafeteria.</p>
        </div>
        {loading ? <p className="university-direct-state">Loading menu...</p> : error ? <p className="university-direct-state error" role="alert">{error}</p> : <div className="university-direct-table">
          <Table>
            <TableHeader><TableRow><TableHead>Item name</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Availability</TableHead></TableRow></TableHeader>
            <TableBody>{data.menu.map(item => <TableRow key={item.id}>
              <TableCell><b>{item.name}</b></TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>{money(item.price)}</TableCell>
              <TableCell><span className={item.available ? "available" : "sold-out"}>{item.available ? "Available" : "Sold Out"}</span></TableCell>
            </TableRow>)}{!data.menu.length && <TableRow><TableCell colSpan={4} className="university-direct-state">No menu items available.</TableCell></TableRow>}</TableBody>
          </Table>
        </div>}
      </section>
    </main>
  </div>;
}
