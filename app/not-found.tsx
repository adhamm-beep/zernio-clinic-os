import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6" dir="rtl">
    <section className="w-full max-w-md rounded-3xl border bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-black tracking-widest text-[#557080]">404</p>
      <h1 className="mt-3 text-2xl font-black">الصفحة غير موجودة</h1>
      <p className="mt-2 text-sm text-slate-500">قد يكون الرابط قديمًا أو تم نقل الصفحة.</p>
      <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-bold text-white">العودة للرئيسية</Link>
    </section>
  </main>;
}
