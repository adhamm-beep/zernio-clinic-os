"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, Barcode, Boxes, PackageCheck, Plus, RefreshCw, ShoppingCart, Truck, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { useMasterData } from "@/features/appointments/hooks/useMasterData";
import { addMovement, addProduct, addPurchaseOrder, addSupplier, receivePurchaseOrder } from "../api/inventory.api";
import { useInventory } from "../hooks/useInventory";

function money(value: number) { return new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 2 }).format(value); }
function date(value: string | null) { return value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value)) : "—"; }

export default function InventoryDashboard() {
  const { clinic, selectedBranch, isLoading: clinicLoading } = useClinic();
  const clinicId = clinic?.id ?? 0;
  const branchId = selectedBranch?.id ?? 0;
  const { data, isLoading, error, refetch, isFetching } = useInventory(clinicId, branchId);
  const { data: master } = useMasterData();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [today] = useState(() => Date.now());

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true); setMessage("");
    try { await action(); await queryClient.invalidateQueries({ queryKey: ["inventory", clinicId, branchId] }); setMessage(success); }
    catch (actionError) { setMessage(actionError instanceof Error ? actionError.message : "Operation failed"); }
    finally { setBusy(false); }
  }

  async function createSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const element = event.currentTarget;
    await run(() => addSupplier({ clinic_id: clinicId, name: String(form.get("name")), phone: String(form.get("phone") || ""), email: String(form.get("email") || "") }), "Supplier added."); element.reset();
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const opening = Number(form.get("opening") || 0); const element = event.currentTarget;
    await run(async () => {
      await addProduct({ clinic_id: clinicId, branch_id: branchId, name: String(form.get("name")), sku: String(form.get("sku") || "") || null, barcode: String(form.get("barcode") || "") || null, category: String(form.get("category") || "") || null, unit: String(form.get("unit") || "unit"), minimum_stock: Number(form.get("minimum") || 0), unit_cost: Number(form.get("cost") || 0), batch_number: String(form.get("batch") || "") || null, expiry_date: String(form.get("expiry") || "") || null, supplier_id: Number(form.get("supplier")) || null, service_variant_id: Number(form.get("variant")) || null });
      if (opening > 0) { const refreshed = await refetch(); const product = refreshed.data?.products.find((item) => item.name === String(form.get("name"))); if (product) await addMovement({ clinic_id: clinicId, branch_id: branchId, product_id: product.id, movement_type: "opening", quantity: opening, unit_cost: Number(form.get("cost") || 0), notes: "Opening stock" }); }
    }, "Product added."); element.reset();
  }

  async function createMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const element = event.currentTarget;
    await run(() => addMovement({ clinic_id: clinicId, branch_id: branchId, product_id: Number(form.get("product")), movement_type: String(form.get("type")), quantity: Number(form.get("quantity")), unit_cost: Number(form.get("cost") || 0), doctor_id: Number(form.get("doctor")) || null, service_id: Number(form.get("service")) || null, notes: String(form.get("notes") || "") || null }), "Stock movement recorded."); element.reset();
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const element = event.currentTarget;
    await run(() => addPurchaseOrder({ order: { clinic_id: clinicId, branch_id: branchId, supplier_id: Number(form.get("supplier")), order_number: String(form.get("number")), status: "ordered", ordered_at: new Date().toISOString(), expected_at: String(form.get("expected") || "") || null }, items: [{ product_id: Number(form.get("product")), quantity: Number(form.get("quantity")), unit_cost: Number(form.get("cost") || 0) }] }), "Purchase order created."); element.reset();
  }

  if (clinicLoading || isLoading) return <div className="rounded-2xl bg-white p-12 text-center">Loading inventory...</div>;
  if (!clinicId || !branchId) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">Select a clinic and branch.</div>;
  if (error || !data) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><strong>Inventory is not active yet.</strong><p className="mt-2 text-sm">{error instanceof Error ? error.message : "Run the Phase 5 SQL setup."}</p></div>;

  const lowStock = data.products.filter((item) => item.is_active && item.current_stock <= item.minimum_stock);
  const expiring = data.products.filter((item) => item.expiry_date && new Date(item.expiry_date).getTime() <= today + 90 * 86_400_000);
  const stockValue = data.products.reduce((sum, item) => sum + item.current_stock * item.unit_cost, 0);
  const doctors = master?.staff.filter((item) => item.is_active && item.role?.toLowerCase().includes("doctor")) ?? [];
  const services = master?.services.filter((item) => item.is_active) ?? [];
  const variants = master?.serviceVariants.filter((item) => item.is_active) ?? [];

  return <div className="space-y-7">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">Phase 5</p><h1 className="mt-1 text-3xl font-black">Inventory Operating System</h1><p className="mt-2 text-slate-500">Products, suppliers, purchasing, deliveries, expiry and clinical consumption.</p></div><Button variant="outline" onClick={() => void refetch()} disabled={isFetching}><RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh</Button></header>
    {message && <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-medium text-cyan-900">{message}</div>}
    <nav className="sticky top-3 z-20 flex gap-2 overflow-x-auto rounded-2xl border bg-white/95 p-2 shadow-sm backdrop-blur">{[["Overview","overview"],["Products","products"],["Consumption","consumption"],["Suppliers","suppliers"],["Purchase Orders","orders"]].map(([label,id]) => <a key={id} href={`#${id}`} className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-950 hover:text-white">{label}</a>)}</nav>
    <section id="overview" className="scroll-mt-24 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Active products",String(data.products.filter((i)=>i.is_active).length),Boxes],["Stock value",money(stockValue),PackageCheck],["Low stock",String(lowStock.length),AlertTriangle],["Expiring ≤ 90 days",String(expiring.length),Barcode]].map(([label,value,Icon]) => { const I=Icon as typeof Boxes; return <article key={String(label)} className="rounded-2xl bg-slate-950 p-5 text-white"><I className="text-cyan-400"/><p className="mt-4 text-sm text-slate-400">{String(label)}</p><p className="mt-1 text-2xl font-bold">{String(value)}</p></article>;})}</section>
    <section id="products" className="scroll-mt-24 grid gap-6 xl:grid-cols-[1fr_1.5fr]"><form onSubmit={createProduct} className="space-y-3 rounded-2xl border bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-bold"><Plus/> Add product</h2><Input name="name" required placeholder="Product name"/><div className="grid grid-cols-2 gap-3"><Input name="sku" placeholder="SKU"/><Input name="barcode" placeholder="Barcode"/><Input name="category" placeholder="Category"/><Input name="unit" placeholder="Unit" defaultValue="unit"/><Input name="opening" type="number" min="0" step="0.01" placeholder="Opening stock"/><Input name="minimum" type="number" min="0" step="0.01" placeholder="Minimum stock"/><Input name="cost" type="number" min="0" step="0.01" placeholder="Unit cost"/><Input name="batch" placeholder="Batch number"/><Input name="expiry" type="date"/><select name="supplier" className="h-9 rounded-md border px-3"><option value="">Supplier</option>{data.suppliers.filter((i)=>i.is_active).map((i)=><option key={i.id} value={i.id}>{i.name}</option>)}</select></div><select name="variant" className="h-10 w-full rounded-md border px-3"><option value="">Treatment material link (optional)</option>{variants.map((i)=><option key={i.id} value={i.id}>{i.name}</option>)}</select><p className="text-xs text-slate-500">Linking a material automatically deducts stock when it is used in a treatment session.</p><Button disabled={busy}>Add product</Button></form><div className="overflow-x-auto rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Product stock</h2><table className="mt-5 w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="pb-3">Product</th><th>SKU / Barcode</th><th>Stock</th><th>Cost</th><th>Expiry</th><th>Supplier</th></tr></thead><tbody>{data.products.map((item)=><tr key={item.id} className="border-b last:border-0"><td className="py-4 font-semibold">{item.name}</td><td>{item.sku || item.barcode || "—"}</td><td><span className={item.current_stock<=item.minimum_stock?"font-bold text-red-600":"font-bold text-emerald-700"}>{item.current_stock} {item.unit}</span></td><td>{money(item.unit_cost)}</td><td>{date(item.expiry_date)}</td><td>{item.supplier?.name||"—"}</td></tr>)}</tbody></table></div></section>
    <section id="consumption" className="scroll-mt-24 grid gap-6 xl:grid-cols-[1fr_1.5fr]"><form onSubmit={createMovement} className="space-y-3 rounded-2xl border bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-bold"><ShoppingCart/> Record stock movement</h2><select name="product" required className="h-10 w-full rounded-md border px-3"><option value="">Product</option>{data.products.filter((i)=>i.is_active).map((i)=><option key={i.id} value={i.id}>{i.name} ({i.current_stock})</option>)}</select><select name="type" required className="h-10 w-full rounded-md border px-3"><option value="consumption">Clinical consumption</option><option value="adjustment_in">Adjustment in</option><option value="adjustment_out">Adjustment out</option><option value="expired">Expired</option><option value="return">Return</option></select><div className="grid grid-cols-2 gap-3"><Input name="quantity" required type="number" min="0.01" step="0.01" placeholder="Quantity"/><Input name="cost" type="number" min="0" step="0.01" placeholder="Unit cost"/></div><select name="doctor" className="h-10 w-full rounded-md border px-3"><option value="">Doctor (optional)</option>{doctors.map((i)=><option key={i.id} value={i.id}>{i.staff_name}</option>)}</select><select name="service" className="h-10 w-full rounded-md border px-3"><option value="">Service (optional)</option>{services.map((i)=><option key={i.id} value={i.id}>{i.name}</option>)}</select><Input name="notes" placeholder="Notes"/><Button disabled={busy}>Save movement</Button></form><div className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Consumption & movement history</h2><div className="mt-5 space-y-3">{data.movements.slice(0,20).map((item)=><div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><p className="font-semibold">{item.product?.name}</p><p className="text-xs text-slate-500">{item.movement_type.replaceAll("_"," ")} · {item.doctor?.staff_name || "No doctor"} · {item.service?.name || "No service"}</p></div><strong>{item.quantity} {item.product?.unit}</strong></div>)}</div></div></section>
    <section id="suppliers" className="scroll-mt-24 grid gap-6 lg:grid-cols-2"><form onSubmit={createSupplier} className="space-y-3 rounded-2xl border bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-bold"><Users/> Add supplier</h2><Input name="name" required placeholder="Supplier name"/><Input name="phone" placeholder="Phone"/><Input name="email" type="email" placeholder="Email"/><Button disabled={busy}>Add supplier</Button></form><div className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Suppliers</h2><div className="mt-4 space-y-3">{data.suppliers.map((item)=><div key={item.id} className="rounded-xl bg-slate-50 p-4"><p className="font-semibold">{item.name}</p><p className="text-sm text-slate-500">{item.phone || item.email || "No contact details"}</p></div>)}</div></div></section>
    <section id="orders" className="scroll-mt-24 grid gap-6 xl:grid-cols-[1fr_1.5fr]"><form onSubmit={createOrder} className="space-y-3 rounded-2xl border bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-bold"><Truck/> New purchase order</h2><Input name="number" required placeholder="Order number"/><select name="supplier" required className="h-10 w-full rounded-md border px-3"><option value="">Supplier</option>{data.suppliers.filter((i)=>i.is_active).map((i)=><option key={i.id} value={i.id}>{i.name}</option>)}</select><select name="product" required className="h-10 w-full rounded-md border px-3"><option value="">Product</option>{data.products.filter((i)=>i.is_active).map((i)=><option key={i.id} value={i.id}>{i.name}</option>)}</select><div className="grid grid-cols-2 gap-3"><Input name="quantity" required type="number" min="0.01" step="0.01" placeholder="Quantity"/><Input name="cost" required type="number" min="0" step="0.01" placeholder="Unit cost"/></div><Input name="expected" type="date"/><Button disabled={busy}>Create order</Button></form><div className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Orders & deliveries</h2><div className="mt-5 space-y-3">{data.orders.map((order)=><div key={order.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4"><div><p className="font-semibold">{order.order_number} · {order.supplier?.name}</p><p className="text-xs text-slate-500">{order.status.replaceAll("_"," ")} · Expected {date(order.expected_at)}</p></div>{order.status!=="received"&&order.status!=="cancelled"&&<Button size="sm" disabled={busy} onClick={()=>void run(()=>receivePurchaseOrder({id:order.id,clinic_id:clinicId,branch_id:branchId,items:order.items??[]}),"Delivery received and stock updated.")}>Receive delivery</Button>}</div>)}</div></div></section>
  </div>;
}
