import type { AppLocale } from "@/components/LocaleProvider";

type LocalizedLabel = { ar: string; en: string };

const PAYMENT_METHOD_LABELS: Record<string, LocalizedLabel> = {
  cash: { ar: "نقدي", en: "Cash" },
  bank: { ar: "بنك", en: "Bank" },
  bank_transfer: { ar: "تحويل بنكي", en: "Bank transfer" },
  card: { ar: "بطاقة بنكية", en: "Card" },
  mada: { ar: "مدى", en: "Mada" },
  visa: { ar: "فيزا", en: "Visa" },
  master_card: { ar: "ماستركارد", en: "Mastercard" },
  insurance: { ar: "تأمين", en: "Insurance" },
  wallet: { ar: "رصيد المريض", en: "Patient balance" },
  split: { ar: "دفع مختلط", en: "Split payment" },
  tabby: { ar: "تابي", en: "Tabby" },
  tamara: { ar: "تمارا", en: "Tamara" },
  other: { ar: "أخرى", en: "Other" },
};

const TREASURY_LABELS: Record<string, LocalizedLabel> = {
  cash: { ar: "النقدية", en: "Cash treasury" },
  bank: { ar: "البنك", en: "Bank treasury" },
  gateway_clearing: { ar: "تسويات بوابة الدفع", en: "Payment gateway clearing" },
};

export function paymentMethodLabel(method: string | null | undefined, locale: AppLocale) {
  if (!method) return "—";
  return PAYMENT_METHOD_LABELS[method]?.[locale] ?? method;
}

export function treasuryLabel(treasury: string | null | undefined, locale: AppLocale) {
  if (!treasury) return "—";
  return TREASURY_LABELS[treasury]?.[locale] ?? treasury;
}

export function treasuryForPaymentMethod(method: string | null | undefined) {
  if (method === "cash") return "cash";
  if (method === "bank" || method === "bank_transfer") return "bank";
  return "gateway_clearing";
}
