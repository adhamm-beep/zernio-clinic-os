"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="ar" dir="rtl"><body className="grid min-h-screen place-items-center bg-slate-50 p-6">
    <main className="w-full max-w-md rounded-3xl border bg-white p-8 text-center shadow-sm">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-50 text-2xl">!</div>
      <h1 className="mt-5 text-xl font-black text-slate-900">تعذر إكمال العملية</h1>
      <p className="mt-2 text-sm text-slate-500">بياناتك محفوظة. حاول مرة أخرى، وإذا استمرت المشكلة تواصل مع مسؤول النظام.</p>
      <button onClick={reset} className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 font-bold text-white">إعادة المحاولة</button>
    </main>
  </body></html>;
}
