type InvoicePrintItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
};

type InvoicePrintTender = { label: string; amount: string };

export type InvoicePrintData = {
  invoice: string;
  date: string;
  customer: string;
  phone: string;
  patientCode?: string | null;
  doctor?: string | null;
  room?: string | null;
  currency: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  paid: string;
  balance: string;
  discountPercent: number;
  taxPercent: number;
  taxNumber?: string | null;
  commercialNumber?: string | null;
  header?: string | null;
  footer?: string | null;
  notes?: string | null;
  barcodeHtml: string;
  qrHtml: string;
  brandLogoUrl?: string | null;
  items: InvoicePrintItem[];
  tenders: InvoicePrintTender[];
  pageSize: string;
  orientation: string;
  margins: number[];
  fontFamily: string;
  grayscale: boolean;
  watermark?: string | null;
};

const esc = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );

export function invoicePrintHtml(data: InvoicePrintData) {
  const itemRows = data.items
    .map(
      (item, index) => `<tr>
        <td>${index + 1}</td><td class="desc">${esc(item.description)}</td>
        <td>${esc(item.quantity)}</td><td>${esc(item.unit)}</td>
        <td>${esc(item.unitPrice)}</td><td>${esc(data.discount)}</td>
        <td>${esc(data.tax)}</td><td><b>${esc(item.lineTotal)}</b></td>
      </tr>`,
    )
    .join("");

  const tenders = data.tenders.length
    ? `<section class="tenders"><h3>تفاصيل الدفع</h3>${data.tenders
        .map(
          (tender) =>
            `<div><span>${esc(tender.label)}</span><b>${tender.amount}</b></div>`,
        )
        .join("")}</section>`
    : "";

  const logo = data.brandLogoUrl
    ? `<img class="brand-logo" src="${esc(data.brandLogoUrl)}" alt="Panthera Clinics">`
    : `<div class="brand-fallback"><strong>PANTHERA</strong><span>CLINICS</span></div>`;

  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(data.invoice)}</title><style>
@font-face{font-family:"Ara Hamah Sahet AlAssi";src:url("/fonts/ara-hamah-sahet-alassi.ttf") format("truetype");font-style:normal;font-weight:100 900;font-display:swap}
@page{size:${esc(data.pageSize)} ${esc(data.orientation)};margin:${data.margins.map((margin) => `${Number(margin)}mm`).join(" ")}}
*{box-sizing:border-box}body{margin:0;color:#182433;background:#fff;font-family:"Ara Hamah Sahet AlAssi","Arabic Typesetting",Tahoma,Arial,sans-serif;${data.grayscale ? "filter:grayscale(1);" : ""}}
.sheet{min-height:277mm;border:1px solid #9ca3af;padding:10mm;position:relative}.brand{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.brandmark{direction:ltr;text-align:center;min-width:230px}.brand-logo{display:block;width:230px;height:auto;object-fit:contain}.brand-fallback{font-family:"Century Gothic",CenturyGothic,Avenir,Arial,sans-serif;color:#607789}.brand-fallback strong{display:block;font-size:36px;font-weight:300;letter-spacing:4px;border-bottom:1px solid #cbd5e1}.brand-fallback span{letter-spacing:9px;font-size:11px}.seller{text-align:center}.seller h1{font-size:17px;margin:0 0 5px}.seller h2{font-family:"Century Gothic",CenturyGothic,Avenir,Arial,sans-serif;font-size:15px;margin:0}.seller p{font-size:10px;line-height:1.7;margin:3px}.meta{margin:24px 0 12px;display:grid;grid-template-columns:1fr 1fr;gap:4px 40px;font-size:10px}.meta div{display:flex;justify-content:space-between;border-bottom:1px dotted #d1d5db;padding:3px 0}.codes{display:flex;align-items:center;justify-content:space-between;gap:15px}.barcode{width:230px;height:60px}.qr{width:66px;height:66px}.barcode svg,.barcode canvas,.qr img{width:100%!important;height:100%!important}table{width:100%;border-collapse:collapse;margin-top:10px;font-size:9px}th{background:#f4f5f6;padding:7px 4px;border-bottom:1px solid #d1d5db}td{padding:7px 4px;text-align:center;border-bottom:1px solid #e5e7eb}.desc{text-align:right;direction:auto}.summary{margin-top:18px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:10px}.summary div{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #e5e7eb}.summary div:last-child{border:0}.summary span,.summary b{padding:7px 12px}.summary span{background:#fafafa}.summary .grand b{color:#0879b8;font-size:13px}.summary .paid b{color:#16a34a}.summary .balance b{color:#dc2626}.tenders{margin-top:12px;width:48%;border:1px solid #dbeafe;border-radius:8px;padding:8px;font-size:10px}.tenders h3{margin:0 0 5px}.tenders div{display:flex;justify-content:space-between;padding:4px}.notes{margin-top:18px;border-top:1px solid #e5e7eb;padding-top:10px;font-size:10px}.footer{position:absolute;bottom:8mm;left:10mm;right:10mm;text-align:center;background:#fafafa;border:1px solid #eee;border-radius:5px;padding:8px;font-size:9px}.watermark{position:fixed;inset:42% 0;text-align:center;font-family:"Century Gothic",CenturyGothic,Avenir,Arial,sans-serif;font-size:62px;opacity:.06;transform:rotate(-25deg);pointer-events:none}
.sar-money{display:inline-flex;direction:ltr;align-items:baseline;white-space:nowrap}.sar-symbol{display:inline-block;width:.86em;height:.95em;margin-right:3px;vertical-align:-.08em;background:currentColor;-webkit-mask:url('/saudi-riyal-symbol.svg') center/contain no-repeat;mask:url('/saudi-riyal-symbol.svg') center/contain no-repeat}.sar-money sup{font-size:.58em;position:relative;top:-.45em;margin-left:1px}
</style></head><body><main class="sheet">
${data.watermark ? `<div class="watermark">${esc(data.watermark)}</div>` : ""}
<header class="brand"><div class="brandmark">${logo}</div><div class="seller"><h1>${esc(data.header || "فاتورة ضريبية مبسطة")}</h1><h2>Panthera Clinics</h2><p>نظام تشغيل عيادات بانثيرا</p>${data.taxNumber ? `<p>الرقم الضريبي: <b dir="ltr">${esc(data.taxNumber)}</b></p>` : ""}${data.commercialNumber ? `<p>السجل التجاري: <b dir="ltr">${esc(data.commercialNumber)}</b></p>` : ""}</div></header>
<section class="meta"><div><span>التاريخ</span><b>${esc(data.date)}</b></div><div><span>رقم الفاتورة</span><b dir="ltr">${esc(data.invoice)}</b></div><div><span>المريض</span><b>${esc(data.customer)}</b></div><div><span>رقم ملف المريض</span><b>${esc(data.patientCode || "—")}</b></div><div><span>الهاتف</span><b dir="ltr">${esc(data.phone)}</b></div><div><span>الطبيب / الغرفة</span><b>${esc([data.doctor, data.room].filter(Boolean).join(" · ") || "—")}</b></div></section>
<section class="codes"><div class="barcode">${data.barcodeHtml}</div><div class="qr">${data.qrHtml}</div></section>
<table><thead><tr><th>#</th><th>الخدمات</th><th>الكمية</th><th>الوحدة</th><th>سعر الوحدة</th><th>الخصم</th><th>الضريبة</th><th>السعر شامل الضريبة</th></tr></thead><tbody>${itemRows}</tbody></table>
<section class="summary"><div><span>إجمالي المبلغ الخاضع للضريبة</span><b>${data.subtotal}</b></div><div><span>الخصم (${data.discountPercent.toFixed(2)}%)</span><b>${data.discount}</b></div><div><span>ضريبة القيمة المضافة (${data.taxPercent.toFixed(2)}%)</span><b>${data.tax}</b></div><div class="grand"><span>المجموع مع الضريبة</span><b>${data.total}</b></div><div class="paid"><span>المدفوع</span><b>${data.paid}</b></div><div class="balance"><span>المتبقي</span><b>${data.balance}</b></div></section>
${tenders}${data.notes ? `<section class="notes"><b>ملاحظات:</b> ${esc(data.notes)}</section>` : ""}
<footer class="footer">${esc(data.footer || "شكرًا لاختياركم عيادات بانثيرا — نتمنى لكم دوام الصحة والعافية")}</footer>
</main></body></html>`;
}
