export type Language = "en" | "ar";

const messages = {
  en: {
    book: "Book", visits: "Visits", profile: "Profile", home: "Home",
    chooseProvider: "Choose your doctor or service", doctors: "Our doctors",
    clinicServices: "Clinic services", doctorConsultation: "Medical consultation",
    serviceBooking: "Book this service", chooseService: "Choose a service",
    consultationNoticeTitle: "Consultation fee is deducted",
    consultationNotice: "You only pay the consultation fee when booking. The doctor determines the material and amount after assessment, and the full consultation fee is deducted when you proceed with treatment.",
    duration: "minutes", consultationFee: "Consultation fee", fullPrice: "Full service price",
    continue: "Continue", back: "Back", language: "العربية", payment: "Payment",
    notifications: "Notifications", bookAppointment: "Book an appointment", step: "Step",
    chooseDateTime: "Choose date & time", availableTime: "Available time",
    appointmentDuration: "Appointment duration", reviewAppointment: "Review appointment",
    reservePayment: "Reserve and continue to payment", payAtClinic: "Pay at the clinic",
    payAtClinicHint: "Complete payment when you arrive", onlinePayment: "Online payment",
    onlineSoon: "Available after connecting the payment gateway", soon: "SOON",
    confirmPayment: "Confirm pay at clinic", saving: "Saving…", wait: "Please wait…",
  },
  ar: {
    book: "احجز", visits: "الزيارات", profile: "حسابي", home: "الرئيسية",
    chooseProvider: "اختر الطبيبة أو الخدمة", doctors: "طبيباتنا",
    clinicServices: "خدمات العيادة", doctorConsultation: "استشارة طبية",
    serviceBooking: "احجز هذه الخدمة", chooseService: "اختر الخدمة",
    consultationNoticeTitle: "الكشفية تُخصم من الإجراء",
    consultationNotice: "عند الحجز تدفع الكشفية فقط. تحدد الطبيبة نوع المادة والكمية بعد التقييم، وتُخصم قيمة الكشفية بالكامل عند تنفيذ الإجراء.",
    duration: "دقيقة", consultationFee: "قيمة الكشفية", fullPrice: "سعر الخدمة كاملًا",
    continue: "متابعة", back: "رجوع", language: "English", payment: "الدفع",
    notifications: "الإشعارات", bookAppointment: "حجز موعد", step: "الخطوة",
    chooseDateTime: "اختر التاريخ والوقت", availableTime: "الأوقات المتاحة",
    appointmentDuration: "مدة الموعد", reviewAppointment: "مراجعة الموعد",
    reservePayment: "تأكيد الحجز والانتقال للدفع", payAtClinic: "الدفع في العيادة",
    payAtClinicHint: "أكمل الدفع عند وصولك", onlinePayment: "الدفع الإلكتروني",
    onlineSoon: "سيتاح بعد ربط بوابة الدفع", soon: "قريبًا",
    confirmPayment: "تأكيد الدفع في العيادة", saving: "جارٍ الحفظ…", wait: "انتظر…",
  },
} as const;

export function translate(language: Language) {
  return messages[language];
}
