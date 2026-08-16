import ExcelJS from "exceljs";
import type { DailyReportData } from "./daily-management-report";

type Appointment = DailyReportData["appointments"][number];

const COLORS = {
  identity: "FF516E84",
  navy: "FF173B52",
  soft: "FFE8F3F7",
  white: "FFFFFFFF",
  line: "FFD4E3E9",
  noShow: "FFFDE8EB",
  cancelled: "FFFFF3E0",
};

const RTL: Partial<ExcelJS.Alignment> = {
  readingOrder: "rtl",
  vertical: "middle",
};

function relation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizedStatus(value: string) {
  return value.toLowerCase().replace("canceled", "cancelled");
}

function patientName(appointment: Appointment) {
  const patient = relation(appointment.customer);
  return [patient?.first_name, patient?.last_name].filter(Boolean).join(" ") || "-";
}

function localDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function textIdentifier(value: string | number | null | undefined) {
  return `\u200E${value ?? "-"}`;
}

function nationality(value: string | null | undefined) {
  if (value === "saudi") return "سعودي";
  if (value === "non_saudi") return "غير سعودي";
  return value || "-";
}

function sourceLabel(value: string | null) {
  const labels: Record<string, string> = {
    patient_app: "تطبيق المرضى",
    "Walk In": "زيارة مباشرة",
    Dentolize: "النظام السابق",
  };
  return value ? (labels[value] ?? value) : "-";
}

export async function buildExecutiveDailyExceptionsWorkbook(data: DailyReportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Panthera Clinics OS";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("الإلغاءات وعدم الحضور", {
    views: [{ rightToLeft: true, state: "frozen", ySplit: 5 }],
    pageSetup: {
      orientation: "landscape",
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.15, footer: 0.15 },
    },
    properties: { showGridLines: false },
  });
  worksheet.headerFooter.oddFooter =
    "&LPanthera Clinics OS&Cتقرير إداري داخلي&Rصفحة &P من &N";

  const headers = [
    "الحالة",
    "اسم المريض",
    "رقم الملف",
    "الهاتف",
    "الجنسية",
    "الخدمة",
    "الموعد",
    "سبب الحالة",
    "المصدر",
    "العلامات",
    "الطبيب / القسم",
    "رقم الموعد",
    "ملاحظات",
  ];
  worksheet.columns = [14, 22, 13, 20, 14, 27, 22, 22, 18, 20, 22, 13, 24].map(
    (width) => ({ width }),
  );

  worksheet.mergeCells("A1:M1");
  worksheet.getCell("A1").value =
    "تقرير الإلغاءات وعدم الحضور - Panthera Clinics";
  worksheet.getCell("A1").style = {
    font: { name: "Arial", bold: true, color: { argb: COLORS.white }, size: 18 },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.identity } },
    alignment: { ...RTL, horizontal: "center" },
  };
  worksheet.getRow(1).height = 32;

  worksheet.mergeCells("A2:M2");
  worksheet.getCell("A2").value =
    `التاريخ ${data.date} - بيانات فعلية من النظام بتوقيت الرياض`;
  worksheet.getCell("A2").alignment = { ...RTL, horizontal: "center" };
  worksheet.getCell("A2").font = { name: "Arial", color: { argb: COLORS.identity }, size: 11 };
  worksheet.getRow(2).height = 22;

  const exceptions = data.appointments.filter((appointment) =>
    ["cancelled", "no_show"].includes(normalizedStatus(appointment.status)),
  );
  worksheet.getRow(4).values = [
    `إجمالي الحالات: ${exceptions.length}`,
    `لم يحضر: ${data.totals.noShow}`,
    `تم الإلغاء: ${data.totals.cancelled}`,
  ];
  for (const address of ["A4", "B4", "C4"]) {
    worksheet.getCell(address).style = {
      font: { name: "Arial", bold: true, color: { argb: COLORS.navy }, size: 12 },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.soft } },
      alignment: { ...RTL, horizontal: "center" },
    };
  }
  worksheet.getRow(4).height = 24;

  const tagMap = new Map<number, string[]>();
  for (const item of data.tags) {
    const name = relation(item.tag)?.name;
    if (name) tagMap.set(item.customer_id, [...(tagMap.get(item.customer_id) ?? []), name]);
  }

  const doctorGroups = [
    ...new Set(
      data.appointments
        .map((appointment) => relation(appointment.doctor)?.staff_name)
        .filter((name): name is string => Boolean(name)),
    ),
  ];
  const groups = [...doctorGroups, "Laser", "ProFacial", "Bleaching"];
  let rowNumber = 6;

  for (const group of groups) {
    const groupLower = group.toLowerCase();
    const items = exceptions.filter((appointment) => {
      const doctorName = relation(appointment.doctor)?.staff_name;
      const service = relation(appointment.service);
      const serviceText = `${service?.name ?? ""} ${service?.category ?? ""}`.toLowerCase();
      return doctorName === group || serviceText.includes(groupLower);
    });

    worksheet.mergeCells(rowNumber, 1, rowNumber, 13);
    const sectionCell = worksheet.getCell(rowNumber, 1);
    sectionCell.value = group;
    sectionCell.style = {
      font: { name: "Arial", bold: true, color: { argb: COLORS.white }, size: 14 },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.identity } },
      alignment: { ...RTL, horizontal: "right" },
    };
    worksheet.getRow(rowNumber).height = 25;
    rowNumber += 1;

    worksheet.getRow(rowNumber).values = headers;
    worksheet.getRow(rowNumber).eachCell((cell) => {
      cell.style = {
        font: { name: "Arial", bold: true, color: { argb: COLORS.white }, size: 11 },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.navy } },
        alignment: { ...RTL, horizontal: "center", wrapText: true },
        border: { bottom: { style: "thin", color: { argb: COLORS.line } } },
      };
    });
    worksheet.getRow(rowNumber).height = 27;
    rowNumber += 1;

    if (!items.length) {
      worksheet.mergeCells(rowNumber, 1, rowNumber, 13);
      const emptyCell = worksheet.getCell(rowNumber, 1);
      emptyCell.value = "لا توجد حالات إلغاء أو عدم حضور لهذا القسم";
      emptyCell.style = {
        font: { name: "Arial", italic: true, color: { argb: COLORS.identity }, size: 11 },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7FAFB" } },
        alignment: { ...RTL, horizontal: "center" },
      };
      worksheet.getRow(rowNumber).height = 25;
      rowNumber += 2;
      continue;
    }

    for (const appointment of items) {
      const patient = relation(appointment.customer);
      const service = relation(appointment.service);
      const status = normalizedStatus(appointment.status);
      const row = worksheet.getRow(rowNumber);
      row.values = [
        status === "no_show" ? "لم يحضر" : "تم الإلغاء",
        patientName(appointment),
        textIdentifier(`#${String(patient?.customer_code || patient?.id || "").padStart(4, "0")}`),
        textIdentifier(patient?.phone),
        nationality(patient?.nationality),
        service?.name || "-",
        localDateTime(appointment.appointment_at),
        appointment.notes || "غير مسجل",
        sourceLabel(appointment.source),
        (tagMap.get(appointment.customer_id) ?? []).join(", ") || "-",
        relation(appointment.doctor)?.staff_name || group,
        textIdentifier(appointment.id),
        appointment.notes || "-",
      ];
      row.eachCell((cell) => {
        cell.font = { name: "Arial", size: 11 };
        cell.alignment = { ...RTL, horizontal: "right", wrapText: true };
        cell.border = { bottom: { style: "thin", color: { argb: COLORS.line } } };
      });
      row.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: status === "no_show" ? COLORS.noShow : COLORS.cancelled },
      };
      row.getCell(3).numFmt = "@";
      row.getCell(4).numFmt = "@";
      row.getCell(12).numFmt = "@";
      row.height = 28;
      rowNumber += 1;
    }
    rowNumber += 1;
  }

  worksheet.pageSetup.printArea = `A1:M${rowNumber - 1}`;
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
