import { createClient } from "@/lib/supabase/client";
import type { InventoryData } from "../types/inventory";

const supabase = createClient();

export async function getInventory(clinicId: number, branchId: number): Promise<InventoryData> {
  const [products, suppliers, orders, movements] = await Promise.all([
    supabase.from("inventory_products").select("*, supplier:inventory_suppliers(name)").eq("clinic_id", clinicId).eq("branch_id", branchId).order("name"),
    supabase.from("inventory_suppliers").select("*").eq("clinic_id", clinicId).order("name"),
    supabase.from("inventory_purchase_orders").select("*, supplier:inventory_suppliers(name), items:inventory_purchase_order_items(id,product_id,quantity,received_quantity,unit_cost)").eq("clinic_id", clinicId).eq("branch_id", branchId).order("created_at", { ascending: false }),
    supabase.from("inventory_movements").select("*, product:inventory_products(name,unit), doctor:staff(staff_name), service:services(name)").eq("clinic_id", clinicId).eq("branch_id", branchId).order("occurred_at", { ascending: false }).limit(200),
  ]);
  const error = products.error || suppliers.error || orders.error || movements.error;
  if (error) throw new Error(error.message);
  return { products: (products.data ?? []) as InventoryData["products"], suppliers: (suppliers.data ?? []) as InventoryData["suppliers"], orders: (orders.data ?? []) as InventoryData["orders"], movements: (movements.data ?? []) as InventoryData["movements"] };
}

export async function addSupplier(input: { clinic_id: number; name: string; phone?: string; email?: string }) {
  const { error } = await supabase.from("inventory_suppliers").insert(input);
  if (error) throw new Error(error.message);
}

export async function addProduct(input: Record<string, unknown>) {
  const { error } = await supabase.from("inventory_products").insert(input);
  if (error) throw new Error(error.message);
}

export async function addMovement(input: Record<string, unknown>) {
  const { error } = await supabase.from("inventory_movements").insert(input);
  if (error) throw new Error(error.message);
}

export async function addPurchaseOrder(input: { order: Record<string, unknown>; items: Array<Record<string, unknown>> }) {
  const { data, error } = await supabase.from("inventory_purchase_orders").insert(input.order).select("id").single();
  if (error) throw new Error(error.message);
  const { error: itemError } = await supabase.from("inventory_purchase_order_items").insert(input.items.map((item) => ({ ...item, purchase_order_id: data.id })));
  if (itemError) throw new Error(itemError.message);
}

export async function receivePurchaseOrder(order: { id: number; clinic_id: number; branch_id: number; items: Array<{ id: number; product_id: number; quantity: number; received_quantity: number; unit_cost: number }> }) {
  const remaining = order.items.filter((item) => item.quantity > item.received_quantity);
  if (!remaining.length) return;
  const { error: movementError } = await supabase.from("inventory_movements").insert(remaining.map((item) => ({ clinic_id: order.clinic_id, branch_id: order.branch_id, product_id: item.product_id, movement_type: "purchase", quantity: item.quantity - item.received_quantity, unit_cost: item.unit_cost, purchase_order_id: order.id, notes: "Purchase order delivery" })));
  if (movementError) throw new Error(movementError.message);
  for (const item of remaining) {
    const { error } = await supabase.from("inventory_purchase_order_items").update({ received_quantity: item.quantity }).eq("id", item.id);
    if (error) throw new Error(error.message);
  }
  const { error } = await supabase.from("inventory_purchase_orders").update({ status: "received", received_at: new Date().toISOString() }).eq("id", order.id);
  if (error) throw new Error(error.message);
}
