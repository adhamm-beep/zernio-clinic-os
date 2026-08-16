import type { HTMLAttributes } from "react";
import { saudiMoneyParts } from "@/lib/money";

export default function SaudiMoney({ value, className = "", ...props }: HTMLAttributes<HTMLSpanElement> & { value: number | string | null | undefined }) {
  const { negative, whole, fraction } = saudiMoneyParts(value);
  return <span dir="ltr" className={`inline-flex items-baseline whitespace-nowrap tabular-nums ${className}`} {...props}>
    <span
      role="img"
      aria-label="Saudi riyal"
      className="me-1 inline-block h-[.95em] w-[.86em] shrink-0 bg-current align-[-.08em]"
      style={{ WebkitMask: "url(/saudi-riyal-symbol.svg) center / contain no-repeat", mask: "url(/saudi-riyal-symbol.svg) center / contain no-repeat" }}
    />
    <span>{negative ? "−" : ""}{whole}</span>
    {fraction && <sup className="ms-0.5 relative -top-[.35em] text-[.58em] font-bold leading-none">{fraction}</sup>}
  </span>;
}
