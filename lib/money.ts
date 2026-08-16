export const SAUDI_RIYAL_SYMBOL = "\u20C1";

export function saudiMoneyParts(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const absolute = Math.abs(safeAmount);
  const fixed = absolute.toFixed(2);
  const [wholeRaw, fractionRaw] = fixed.split(".");
  return {
    negative: safeAmount < 0,
    whole: new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(wholeRaw)),
    fraction: fractionRaw === "00" ? "" : fractionRaw,
  };
}

export function formatSaudiMoney(value: number | string | null | undefined) {
  const { negative, whole, fraction } = saudiMoneyParts(value);
  return `${negative ? "−" : ""}${SAUDI_RIYAL_SYMBOL} ${whole}${fraction ? `.${fraction}` : ""}`;
}

export function formatSaudiMoneyHtml(value: number | string | null | undefined) {
  const { negative, whole, fraction } = saudiMoneyParts(value);
  return `<span class="sar-money" dir="ltr"><span class="sar-symbol" role="img" aria-label="Saudi riyal"></span><span>${negative ? "−" : ""}${whole}</span>${fraction ? `<sup>${fraction}</sup>` : ""}</span>`;
}
