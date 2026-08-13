"use client";

import { useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Barcode,
  Boxes,
  PackageCheck,
  Plus,
  RefreshCw,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import { useMasterData } from "@/features/appointments/hooks/useMasterData";
import { usePermission } from "@/features/users/hooks/usePermission";
import {
  addMovement,
  addProduct,
  addPurchaseOrder,
  addSupplier,
  receivePurchaseOrder,
} from "../api/inventory.api";
import { useInventory } from "../hooks/useInventory";

function money(value: number) {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(value);
}
function date(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "—";
}

export default function InventoryDashboard() {
  const { clinic, selectedBranch, isLoading: clinicLoading } = useClinic();
  const clinicId = clinic?.id ?? 0;
  const branchId = selectedBranch?.id ?? 0;
  const canManage = usePermission("inventory.manage").allowed;
  const canViewCosts =
    usePermission("inventory.cost.view").allowed || canManage;
  const { data, isLoading, error, refetch, isFetching } = useInventory(
    clinicId,
    branchId,
    canViewCosts,
  );
  const { data: master } = useMasterData();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [today] = useState(() => Date.now());

  async function run(action: () => Promise<unknown>, success: string) {
    if (!canManage) {
      setMessage("هذه العملية غير متوفرة لك حسب صلاحيات حسابك.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await action();
      await queryClient.invalidateQueries({
        queryKey: ["inventory", clinicId, branchId],
      });
      setMessage(success);
    } catch (actionError) {
      setMessage(
        actionError instanceof Error
          ? actionError.message
          : "تعذر تنفيذ العملية.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function createSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const element = event.currentTarget;
    await run(
      () =>
        addSupplier({
          clinic_id: clinicId,
          name: String(form.get("name")),
          phone: String(form.get("phone") || ""),
          email: String(form.get("email") || ""),
        }),
      "Supplier added.",
    );
    element.reset();
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const opening = Number(form.get("opening") || 0);
    const element = event.currentTarget;
    await run(async () => {
      await addProduct({
        clinic_id: clinicId,
        branch_id: branchId,
        name: String(form.get("name")),
        sku: String(form.get("sku") || "") || null,
        barcode: String(form.get("barcode") || "") || null,
        category: String(form.get("category") || "") || null,
        unit: String(form.get("unit") || "unit"),
        minimum_stock: Number(form.get("minimum") || 0),
        unit_cost: Number(form.get("cost") || 0),
        batch_number: String(form.get("batch") || "") || null,
        expiry_date: String(form.get("expiry") || "") || null,
        supplier_id: Number(form.get("supplier")) || null,
        service_variant_id: Number(form.get("variant")) || null,
      });
      if (opening > 0) {
        const refreshed = await refetch();
        const product = refreshed.data?.products.find(
          (item) => item.name === String(form.get("name")),
        );
        if (product)
          await addMovement({
            clinic_id: clinicId,
            branch_id: branchId,
            product_id: product.id,
            movement_type: "opening",
            quantity: opening,
            unit_cost: Number(form.get("cost") || 0),
            notes: "Opening stock",
          });
      }
    }, "Product added.");
    element.reset();
  }

  async function createMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const element = event.currentTarget;
    await run(
      () =>
        addMovement({
          clinic_id: clinicId,
          branch_id: branchId,
          product_id: Number(form.get("product")),
          movement_type: String(form.get("type")),
          quantity: Number(form.get("quantity")),
          unit_cost: Number(form.get("cost") || 0),
          doctor_id: Number(form.get("doctor")) || null,
          service_id: Number(form.get("service")) || null,
          notes: String(form.get("notes") || "") || null,
        }),
      "Stock movement recorded.",
    );
    element.reset();
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const element = event.currentTarget;
    await run(
      () =>
        addPurchaseOrder({
          order: {
            clinic_id: clinicId,
            branch_id: branchId,
            supplier_id: Number(form.get("supplier")),
            order_number: String(form.get("number")),
            status: "ordered",
            ordered_at: new Date().toISOString(),
            expected_at: String(form.get("expected") || "") || null,
          },
          items: [
            {
              product_id: Number(form.get("product")),
              quantity: Number(form.get("quantity")),
              unit_cost: Number(form.get("cost") || 0),
            },
          ],
        }),
      "Purchase order created.",
    );
    element.reset();
  }

  if (clinicLoading || isLoading)
    return (
      <div className="rounded-2xl bg-white p-12 text-center">
        جارٍ تحميل المخزون...
      </div>
    );
  if (!clinicId || !branchId)
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        اختر العيادة والفرع أولًا.
      </div>
    );
  if (error || !data)
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <strong>تعذر تحميل المخزون.</strong>
        <p className="mt-2 text-sm">
          {error instanceof Error
            ? error.message
            : "تأكد من تطبيق آخر تحديث لقاعدة البيانات."}
        </p>
      </div>
    );

  const lowStock = data.products.filter(
    (item) => item.is_active && item.current_stock <= item.minimum_stock,
  );
  const expiring = data.products.filter(
    (item) =>
      item.expiry_date &&
      new Date(item.expiry_date).getTime() <= today + 90 * 86_400_000,
  );
  const stockValue = data.products.reduce(
    (sum, item) => sum + item.current_stock * Number(item.unit_cost ?? 0),
    0,
  );
  const doctors =
    master?.staff.filter(
      (item) => item.is_active && item.role?.toLowerCase().includes("doctor"),
    ) ?? [];
  const services = master?.services.filter((item) => item.is_active) ?? [];
  const variants =
    master?.serviceVariants.filter((item) => item.is_active) ?? [];

  return (
    <div className="space-y-7" dir="rtl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-700">إدارة المخزون</p>
          <h1 className="mt-1 text-3xl font-black">مركز تشغيل المخزون</h1>
          <p className="mt-2 text-slate-500">
            المنتجات والموردون والمشتريات والاستلام والصلاحية والاستهلاك
            العلاجي.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={isFetching ? "animate-spin" : ""} /> تحديث
        </Button>
      </header>
      {message && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-medium text-cyan-900">
          {message}
        </div>
      )}
      <nav className="sticky top-3 z-20 flex gap-2 overflow-x-auto rounded-2xl border bg-white/95 p-2 shadow-sm backdrop-blur">
        {[
          ["نظرة عامة", "overview"],
          ["المنتجات", "products"],
          ["الاستهلاك والحركات", "consumption"],
          ["الموردون", "suppliers"],
          ["طلبات الشراء", "orders"],
        ].map(([label, id]) => (
          <a
            key={id}
            href={`#${id}`}
            className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-950 hover:text-white"
          >
            {label}
          </a>
        ))}
      </nav>
      <section
        id="overview"
        className="scroll-mt-24 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          [
            "المنتجات النشطة",
            String(data.products.filter((i) => i.is_active).length),
            Boxes,
          ],
          ...(canViewCosts
            ? [["قيمة المخزون", money(stockValue), PackageCheck] as const]
            : []),
          ["منخفض المخزون", String(lowStock.length), AlertTriangle],
          ["تنتهي خلال 90 يومًا", String(expiring.length), Barcode],
        ].map(([label, value, Icon]) => {
          const I = Icon as typeof Boxes;
          return (
            <article
              key={String(label)}
              className="rounded-2xl bg-slate-950 p-5 text-white"
            >
              <I className="text-cyan-400" />
              <p className="mt-4 text-sm text-slate-400">{String(label)}</p>
              <p className="mt-1 text-2xl font-bold">{String(value)}</p>
            </article>
          );
        })}
      </section>
      <section
        id="products"
        className="scroll-mt-24 grid gap-6 xl:grid-cols-[1fr_1.5fr]"
      >
        {canManage && <form
          onSubmit={createProduct}
          className="space-y-3 rounded-2xl border bg-white p-6 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Plus /> إضافة منتج
          </h2>
          <Input name="name" required placeholder="اسم المنتج" />
          <div className="grid grid-cols-2 gap-3">
            <Input name="sku" placeholder="SKU" />
            <Input name="barcode" placeholder="الباركود" />
            <Input name="category" placeholder="التصنيف" />
            <Input name="unit" placeholder="الوحدة" defaultValue="وحدة" />
            <Input
              name="opening"
              type="number"
              min="0"
              step="0.01"
              placeholder="الرصيد الافتتاحي"
            />
            <Input
              name="minimum"
              type="number"
              min="0"
              step="0.01"
              placeholder="الحد الأدنى للمخزون"
            />
            <Input
              name="cost"
              type="number"
              min="0"
              step="0.01"
              placeholder="تكلفة الوحدة"
            />
            <Input name="batch" placeholder="رقم التشغيلة" />
            <Input name="expiry" type="date" />
            <select name="supplier" className="h-9 rounded-md border px-3">
              <option value="">المورد</option>
              {data.suppliers
                .filter((i) => i.is_active)
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
            </select>
          </div>
          <select name="variant" className="h-10 w-full rounded-md border px-3">
            <option value="">ربط بمادة علاجية (اختياري)</option>
            {variants.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            عند ربط المادة يتم خصمها تلقائيًا من المخزون عند استخدامها في جلسة علاجية.
          </p>
          <Button disabled={busy}>إضافة المنتج</Button>
        </form>}
        <div className="overflow-x-auto rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">مخزون المنتجات</h2>
          <table className="mt-5 w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="pb-3">المنتج</th>
                <th>الرمز / الباركود</th>
                <th>المخزون</th>
                {canViewCosts && <th>التكلفة</th>}
                <th>تاريخ الانتهاء</th>
                <th>المورد</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-4 font-semibold">{item.name}</td>
                  <td>{item.sku || item.barcode || "—"}</td>
                  <td>
                    <span
                      className={
                        item.current_stock <= item.minimum_stock
                          ? "font-bold text-red-600"
                          : "font-bold text-emerald-700"
                      }
                    >
                      {item.current_stock} {item.unit}
                    </span>
                  </td>
                  {canViewCosts && <td>{money(Number(item.unit_cost ?? 0))}</td>}
                  <td>{date(item.expiry_date)}</td>
                  <td>{item.supplier?.name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section
        id="consumption"
        className="scroll-mt-24 grid gap-6 xl:grid-cols-[1fr_1.5fr]"
      >
        {canManage && <form
          onSubmit={createMovement}
          className="space-y-3 rounded-2xl border bg-white p-6 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ShoppingCart /> تسجيل حركة مخزون
          </h2>
          <select
            name="product"
            required
            className="h-10 w-full rounded-md border px-3"
          >
            <option value="">المنتج</option>
            {data.products
              .filter((i) => i.is_active)
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.current_stock})
                </option>
              ))}
          </select>
          <select
            name="type"
            required
            className="h-10 w-full rounded-md border px-3"
          >
            <option value="consumption">استهلاك علاجي</option>
            <option value="adjustment_in">تسوية بالزيادة</option>
            <option value="adjustment_out">تسوية بالنقص</option>
            <option value="expired">منتهي الصلاحية</option>
            <option value="return">مرتجع</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="quantity"
              required
              type="number"
              min="0.01"
              step="0.01"
              placeholder="الكمية"
            />
            <Input
              name="cost"
              type="number"
              min="0"
              step="0.01"
              placeholder="تكلفة الوحدة"
            />
          </div>
          <select name="doctor" className="h-10 w-full rounded-md border px-3">
            <option value="">الطبيب (اختياري)</option>
            {doctors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.staff_name}
              </option>
            ))}
          </select>
          <select name="service" className="h-10 w-full rounded-md border px-3">
            <option value="">الخدمة (اختياري)</option>
            {services.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <Input name="notes" placeholder="ملاحظات" />
          <Button disabled={busy}>حفظ الحركة</Button>
        </form>}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">سجل الاستهلاك والحركات</h2>
          <div className="mt-5 space-y-3">
            {data.movements.slice(0, 20).map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"
              >
                <div>
                  <p className="font-semibold">{item.product?.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.movement_type.replaceAll("_", " ")} ·{" "}
                    {item.doctor?.staff_name || "No doctor"} ·{" "}
                    {item.service?.name || "No service"}
                  </p>
                </div>
                <strong>
                  {item.quantity} {item.product?.unit}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section
        id="suppliers"
        className="scroll-mt-24 grid gap-6 lg:grid-cols-2"
      >
        {canManage && <form
          onSubmit={createSupplier}
          className="space-y-3 rounded-2xl border bg-white p-6 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Users /> إضافة مورد
          </h2>
          <Input name="name" required placeholder="اسم المورد" />
          <Input name="phone" placeholder="رقم الهاتف" />
          <Input name="email" type="email" placeholder="البريد الإلكتروني" />
          <Button disabled={busy}>إضافة المورد</Button>
        </form>}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">الموردون</h2>
          <div className="mt-4 space-y-3">
            {data.suppliers.map((item) => (
              <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-slate-500">
                  {item.phone || item.email || "لا توجد بيانات تواصل"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section
        id="orders"
        className="scroll-mt-24 grid gap-6 xl:grid-cols-[1fr_1.5fr]"
      >
        {canManage && <form
          onSubmit={createOrder}
          className="space-y-3 rounded-2xl border bg-white p-6 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Truck /> طلب شراء جديد
          </h2>
          <Input name="number" required placeholder="رقم الطلب" />
          <select
            name="supplier"
            required
            className="h-10 w-full rounded-md border px-3"
          >
            <option value="">المورد</option>
            {data.suppliers
              .filter((i) => i.is_active)
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
          </select>
          <select
            name="product"
            required
            className="h-10 w-full rounded-md border px-3"
          >
            <option value="">المنتج</option>
            {data.products
              .filter((i) => i.is_active)
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="quantity"
              required
              type="number"
              min="0.01"
              step="0.01"
              placeholder="الكمية"
            />
            <Input
              name="cost"
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="تكلفة الوحدة"
            />
          </div>
          <Input name="expected" type="date" />
          <Button disabled={busy}>إنشاء الطلب</Button>
        </form>}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">الطلبات والتوريدات</h2>
          <div className="mt-5 space-y-3">
            {data.orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4"
              >
                <div>
                  <p className="font-semibold">
                    {order.order_number} · {order.supplier?.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {order.status.replaceAll("_", " ")} · Expected{" "}
                    {date(order.expected_at)}
                  </p>
                </div>
                {canManage && order.status !== "received" &&
                  order.status !== "cancelled" && (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () =>
                            receivePurchaseOrder({
                              id: order.id,
                              clinic_id: clinicId,
                              branch_id: branchId,
                              items: order.items ?? [],
                            }),
                          "Delivery received and stock updated.",
                        )
                      }
                    >
                      استلام التوريد
                    </Button>
                  )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
