export type Language="en"|"ar";

const messages={
 en:{book:"Book",visits:"Visits",profile:"Profile",home:"Home",chooseProvider:"Choose your doctor or service",doctors:"Our doctors",clinicServices:"Clinic services",doctorConsultation:"Medical consultation",serviceBooking:"Book this service",consultationNoticeTitle:"Consultation fee is deducted",consultationNotice:"You only pay the consultation fee when booking. The doctor will determine the material and amount after assessment, and the full consultation fee will be deducted when you proceed with the treatment.",chooseService:"Choose a service",duration:"minutes",consultationFee:"Consultation fee",fullPrice:"Full service price",continue:"Continue",back:"Back",language:"العربية",payment:"Payment",notifications:"Notifications"},
 ar:{book:"احجز",visits:"الزيارات",profile:"حسابي",home:"الرئيسية",chooseProvider:"اختر الطبيبة أو الخدمة",doctors:"طبيباتنا",clinicServices:"خدمات العيادة",doctorConsultation:"استشارة طبية",serviceBooking:"احجز هذه الخدمة",consultationNoticeTitle:"الكشفية تُخصم من الإجراء",consultationNotice:"عند الحجز تدفع الكشفية فقط. تحدد الطبيبة نوع المادة والكمية بعد التقييم، وتُخصم قيمة الكشفية بالكامل عند تنفيذ الإجراء.",chooseService:"اختر الخدمة",duration:"دقيقة",consultationFee:"قيمة الكشفية",fullPrice:"سعر الخدمة كاملًا",continue:"متابعة",back:"رجوع",language:"English",payment:"الدفع",notifications:"الإشعارات"}
} as const;

export function translate(language:Language){return messages[language];}
