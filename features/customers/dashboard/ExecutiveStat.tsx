type ExecutiveStatProps = {
  label: string;
  value: string;
  hint?: string;
};

export default function ExecutiveStat({ label, value, hint }: ExecutiveStatProps) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
