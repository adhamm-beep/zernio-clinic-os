import { supabase } from "./supabase";

export type PatientProfile = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  customerCode: string | null;
  clinicId: number;
  branchId: number;
};
export type PatientAppointment = {
  id: number;
  createdAt?: string | null;
  service: string;
  serviceEn?: string | null;
  serviceAr?: string | null;
  provider: string | null;
  providerEn?: string | null;
  providerAr?: string | null;
  appointmentAt: string;
  status: string;
  room: string | null;
};
export type PatientInvoice = {
  id: number;
  invoiceNumber: string | null;
  amount: number;
  status: string | null;
  date: string;
};
export type PatientNotification = {
  id: number;
  title: string;
  message: string;
  title_en?: string | null;
  title_ar?: string | null;
  message_en?: string | null;
  message_ar?: string | null;
  notification_type: string;
  entity_type?: string | null;
  entity_id?: number | null;
  action_tab?: string | null;
  is_read: boolean;
  created_at: string;
};
export type MedicalRecord = {
  id: number;
  blood_type?: string;
  allergies?: string;
  chronic_diseases?: string;
  medications?: string;
  contraindications?: string;
  pregnancy_status?: string;
  smoking_status?: string;
  medical_notes?: string;
};
export type PatientDashboard = {
  profile: PatientProfile;
  appointments: PatientAppointment[];
  invoices: PatientInvoice[];
  notifications: PatientNotification[];
  medicalRecord: MedicalRecord | null;
};
export type CareSession = {
  id: number;
  status: string;
  sessionDate: string;
  service: string | null;
  doctor: string | null;
  assessment: string | null;
  aftercare: string | null;
  treatmentPlan?: string | null;
  followupRequired?: boolean;
  followupDate: string | null;
};
export type CareTracking = {
  id: number;
  createdAt?: string | null;
  status: string;
  appointmentAt: string;
  service: string | null;
  provider: string | null;
};
export type PatientCareHub = {
  activePlan: CareSession | null;
  history: CareSession[];
  appointmentTracking: CareTracking[];
};
export type PatientMembership = {
  customerId: number;
  customerCode: string | null;
  name: string;
  points: number;
  lifetimePoints: number;
  tier: "silver" | "gold" | "platinum";
  qrValue: string;
  joinedAt: string;
  nextTierPoints: number;
  benefits: string[];
};
export type ProgressMedia = {
  id: number;
  type: "before" | "after" | "progress";
  path: string;
  caption: string | null;
  capturedAt: string;
  sessionId: number | null;
  signedUrl?: string;
};
export type PatientRecommendation = {
  id: string;
  icon: string;
  title: string;
  message: string;
  action: "book" | "care" | "appointments";
  priority: number;
};
export type PatientResults = {
  media: ProgressMedia[];
  recommendations: PatientRecommendation[];
};
export type BeautyEvent = {
  id: string;
  type: "appointment" | "followup" | "personal" | "routine" | "product";
  title: string;
  date: string;
  status: string;
  subtitle: string | null;
};
export type ClinicContact = {
  clinicName: string;
  branchName: string | null;
  phone: string | null;
  whatsapp?: string | null;
  email: string | null;
  address: string | null;
  mapsUrl?: string | null;
  workingHours?: string | null;
};
export type BeautyCalendarData = {
  events: BeautyEvent[];
  contact: ClinicContact | null;
};
export type WalletTransaction = {
  id: number;
  invoiceNumber: string | null;
  amount: number;
  subtotal: number;
  taxAmount: number | null;
  discountAmount: number;
  paidAmount: number;
  outstanding: number;
  status: string | null;
  method: string | null;
  date: string;
  reference: string | null;
  notes: string | null;
  items: Array<{
    description: string;
    descriptionEn?: string | null;
    descriptionAr?: string | null;
    quantity: number;
    unit: string;
    unitPrice: number;
    lineTotal: number;
  }>;
};
export type MedicalUpdateRequest = {
  id: number;
  fields: string[];
  note: string | null;
  status: string;
  createdAt: string;
};
export type FinanceHealthHub = {
  wallet: {
    totalPaid: number;
    outstanding: number;
    creditBalance: number;
    currency: string;
    transactions: WalletTransaction[];
  };
  health: {
    record: MedicalRecord | null;
    completeness: number;
    updateRequests: MedicalUpdateRequest[];
  };
};
export type CareMoment = {
  id: string;
  type: string;
  title: string;
  message: string;
  date: string;
  icon: string;
};
export type EligibleVisit = {
  id: number;
  service: string;
  provider: string | null;
  date: string;
};
export type ExperienceFeedback = {
  id: number;
  appointmentId: number;
  rating: number;
  tags: string[];
  comment: string | null;
  createdAt: string;
};
export type PatientExperience = {
  moments: CareMoment[];
  eligibleVisits: EligibleVisit[];
  feedback: ExperienceFeedback[];
};
export type BookingService = {
  id: number;
  name: string;
  category: string | null;
  duration_minutes: number;
  provider_type: string;
};
export type BookingProvider = { id: number; name: string; role: string };
export type ProviderService = BookingService & {
  price_from: number | null;
  is_starting_from: boolean;
};
export type PatientAvailableSlot = { appointment_at: string; label: string };
export type ConciergeRequest = {
  id: number;
  appointmentId: number;
  type: "reschedule" | "cancel" | "check_in" | "add_to_calendar";
  preferredAt: string | null;
  reason: string | null;
  status: string;
  createdAt: string;
};
export type PatientConsent = {
  id: number;
  appointmentId: number | null;
  type: string;
  title: string;
  body: string;
  version: string;
  status: string;
  acceptedAt: string | null;
};
export type PatientMessage = {
  id: number;
  appointmentId: number | null;
  sender: "patient" | "staff" | "system" | "ai_draft";
  message: string;
  category: string;
  requiresReply: boolean;
  isRead: boolean;
  createdAt: string;
};
export type PatientPackage = {
  id: number;
  name: string;
  totalSessions: number;
  usedSessions: number;
  amountPaid: number;
  status: string;
  startsAt: string;
  expiresAt: string | null;
  service: string | null;
};
export type ConciergeAppointment = {
  id: number;
  date: string;
  status: string;
  service: string | null;
  serviceEn?: string | null;
  serviceAr?: string | null;
  provider: string | null;
  providerEn?: string | null;
  providerAr?: string | null;
};
export type PatientConcierge = {
  requests: ConciergeRequest[];
  consents: PatientConsent[];
  messages: PatientMessage[];
  packages: PatientPackage[];
  upcomingAppointments: ConciergeAppointment[];
};

function message(error: { message?: string } | null) {
  return error?.message ?? "Something went wrong";
}

export function normalizeSaudiPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const national = digits.startsWith("00966")
    ? digits.slice(5)
    : digits.startsWith("966")
      ? digits.slice(3)
      : digits.startsWith("0")
        ? digits.slice(1)
        : digits;
  if (!/^5\d{8}$/.test(national))
    throw new Error(
      "Enter a valid Saudi mobile number, for example +966 5X XXX XXXX.",
    );
  return `+966${national}`;
}

export async function sendOtp(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizeSaudiPhone(phone),
    options: { shouldCreateUser: true },
  });
  if (error) throw new Error(message(error));
}

export async function verifyOtp(
  phone: string,
  token: string,
  signup?: {
    firstName: string;
    lastName: string;
    email: string;
    language: "ar" | "en";
    documentVersion: string;
  },
) {
  if (!/^\d{6}$/.test(token))
    throw new Error("Enter the 6-digit verification code.");
  const { error } = await supabase.auth.verifyOtp({
    phone: normalizeSaudiPhone(phone),
    token,
    type: "sms",
  });
  if (error) throw new Error(message(error));
  const linked = signup
    ? await supabase.rpc("patient_register_new_account", {
        p_first_name: signup.firstName,
        p_last_name: signup.lastName,
        p_email: signup.email || null,
        p_language: signup.language,
        p_document_version: signup.documentVersion,
      })
    : await supabase.rpc("link_my_patient_account");
  if (linked.error) {
    await supabase.auth.signOut();
    throw new Error(message(linked.error));
  }
}

export async function submitPrivacyRequest(
  type: "access" | "export" | "correction" | "deletion" | "withdraw_consent",
  details?: string,
) {
  const { data, error } = await supabase.rpc("patient_submit_privacy_request", {
    p_request_type: type,
    p_details: details || null,
  });
  if (error) throw new Error(message(error));
  return data as number;
}

export async function loadDashboard() {
  const { data, error } = await supabase.rpc("patient_mobile_dashboard");
  if (error) throw new Error(message(error));
  return data as PatientDashboard;
}

export async function markPatientNotificationsRead() {
  const { error } = await supabase.rpc("patient_mark_notifications_read");
  if (error) throw new Error(message(error));
}

export async function setPatientLanguage(language: "ar" | "en") {
  const { error } = await supabase.rpc("patient_set_language", {
    p_language: language,
  });
  if (error) throw new Error(message(error));
}

export async function loadCareHub(): Promise<PatientCareHub> {
  const { data, error } = await supabase.rpc("patient_care_hub");
  if (error) return { activePlan: null, history: [], appointmentTracking: [] };
  return data as PatientCareHub;
}

export async function loadMembership(): Promise<PatientMembership | null> {
  const { data, error } = await supabase.rpc("patient_membership_card");
  if (error) return null;
  return data as PatientMembership;
}

export async function loadPatientResults(): Promise<PatientResults> {
  const { data, error } = await supabase.rpc("patient_results_hub");
  if (error) return { media: [], recommendations: [] };
  const result = data as PatientResults;
  if (!result.media.length) return result;
  const signed = await supabase.storage
    .from("patient-progress")
    .createSignedUrls(
      result.media.map((item) => item.path),
      3600,
    );
  const urls = new Map(
    (signed.data ?? []).map((item) => [item.path, item.signedUrl ?? undefined]),
  );
  return {
    ...result,
    media: result.media.map((item) => ({
      ...item,
      signedUrl: urls.get(item.path),
    })),
  };
}

export async function loadBeautyCalendar(): Promise<BeautyCalendarData> {
  const [{ data, error }, { data: contact }] = await Promise.all([
    supabase.rpc("patient_beauty_calendar"),
    supabase.rpc("patient_clinic_contact"),
  ]);
  if (error) return { events: [], contact: null };
  const result = data as BeautyCalendarData;
  return {
    ...result,
    contact: (contact as ClinicContact | null) ?? result.contact,
  };
}

export async function loadFinanceHealth(): Promise<FinanceHealthHub> {
  const [{data,error},{data:walletSummary}] = await Promise.all([supabase.rpc("patient_finance_health_hub"),supabase.rpc("patient_wallet_summary")]);
  if (error)
    return {
      wallet: {
        totalPaid: 0,
        outstanding: 0,
        creditBalance:0,
        currency: "SAR",
        transactions: [],
      },
      health: { record: null, completeness: 0, updateRequests: [] },
    };
  const result=data as FinanceHealthHub;return{...result,wallet:{...result.wallet,creditBalance:Number((walletSummary as{balance?:number}|null)?.balance??0)}};
}

export async function requestMedicalUpdate(note: string, fields: string[]) {
  const { error } = await supabase.rpc("patient_request_medical_update", {
    p_note: note || null,
    p_fields: fields,
  });
  if (error) throw new Error(message(error));
}

export async function loadPatientExperience(): Promise<PatientExperience> {
  const { data, error } = await supabase.rpc("patient_experience_hub");
  if (error) return { moments: [], eligibleVisits: [], feedback: [] };
  return data as PatientExperience;
}

export async function submitPatientFeedback(
  appointmentId: number,
  rating: number,
  tags: string[],
  comment: string,
) {
  const { error } = await supabase.rpc("patient_submit_feedback", {
    p_appointment_id: appointmentId,
    p_rating: rating,
    p_tags: tags,
    p_comment: comment || null,
  });
  if (error) throw new Error(message(error));
}

export async function openGoogleReview(appointmentId?: number | null) {
  const { data, error } = await supabase.rpc(
    "patient_google_review_destination",
    { p_appointment_id: appointmentId ?? null },
  );
  if (error) throw new Error(message(error));
  const url = (data as { url?: string } | null)?.url;
  if (!url) throw new Error("Google review link is unavailable.");
  return url;
}

export async function loadBookingCatalog() {
  const { data, error } = await supabase.rpc("patient_booking_catalog");
  if (error) throw new Error(message(error));
  return (data ?? []) as BookingService[];
}

export async function loadBookingProviders(locale: "ar" | "en" = "en") {
  const { data, error } = await supabase.rpc(
    "patient_booking_providers_localized",
    { p_locale: locale },
  );
  if (error) throw new Error(message(error));
  return (data ?? []) as BookingProvider[];
}

export async function loadProviderServices(
  providerId: number,
  locale: "ar" | "en" = "en",
) {
  const { data, error } = await supabase.rpc(
    "patient_provider_services_localized",
    { p_provider_id: providerId, p_locale: locale },
  );
  if (error) throw new Error(message(error));
  return (data ?? []) as ProviderService[];
}

export async function loadPatientAvailableSlots(
  providerId: number,
  serviceId: number,
  date: string,
) {
  const { data, error } = await supabase.rpc("patient_available_slots", {
    p_provider_id: providerId,
    p_service_id: serviceId,
    p_date: date,
  });
  if (error) throw new Error(message(error));
  return (data ?? []) as PatientAvailableSlot[];
}

export async function createAppointment(
  serviceId: number,
  doctorId: number,
  appointmentAt: string,
  notes?: string,
) {
  const { data, error } = await supabase.rpc("patient_book_appointment", {
    p_service_id: serviceId,
    p_doctor_id: doctorId,
    p_appointment_at: appointmentAt,
    p_notes: notes ?? null,
  });
  if (error) throw new Error(message(error));
  return data as number;
}

export async function selectPaymentMethod(
  appointmentId: number,
  method: "pay_at_clinic" | "online",
  quotedAmount?: number | null,
) {
  const { data, error } = await supabase.rpc("patient_select_payment_method", {
    p_appointment_id: appointmentId,
    p_payment_method: method,
    p_quoted_amount: quotedAmount ?? null,
  });
  if (error) throw new Error(message(error));
  return data as number;
}

export async function createOnlinePaymentCheckout(appointmentId: number) {
  const base = process.env.EXPO_PUBLIC_PORTAL_API_URL?.replace(/\/$/, "");
  if (!base)
    throw new Error(
      "Online payment will be available after the secure payment domain is configured.",
    );
  const session = await supabase.auth.getSession(),
    token = session.data.session?.access_token;
  if (!token) throw new Error("Please sign in again.");
  const response = await fetch(`${base}/api/payments/moyasar/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ appointmentId }),
  });
  const body = (await response.json().catch(() => null)) as {
    checkoutUrl?: string;
    error?: string;
  } | null;
  if (!response.ok || !body?.checkoutUrl)
    throw new Error(body?.error ?? "Unable to start online payment");
  return body.checkoutUrl;
}

export async function cancelAppointment(appointmentId: number) {
  const { error } = await supabase.rpc("patient_cancel_appointment", {
    p_appointment_id: appointmentId,
  });
  if (error) throw new Error(message(error));
}

export async function loadPatientConcierge(): Promise<PatientConcierge> {
  const { data, error } = await supabase.rpc("patient_concierge_hub");
  if (error)
    return {
      requests: [],
      consents: [],
      messages: [],
      packages: [],
      upcomingAppointments: [],
    };
  return data as PatientConcierge;
}

export async function requestAppointmentAction(
  appointmentId: number,
  action: ConciergeRequest["type"],
  preferredAt?: string | null,
  reason?: string,
) {
  const { data, error } = await supabase.rpc(
    "patient_request_appointment_action",
    {
      p_appointment_id: appointmentId,
      p_action: action,
      p_preferred_at: preferredAt ?? null,
      p_reason: reason || null,
    },
  );
  if (error) throw new Error(message(error));
  return data as number;
}

export async function acceptPatientConsent(consentId: number, name: string) {
  const { error } = await supabase.rpc("patient_accept_consent", {
    p_consent_id: consentId,
    p_name: name,
  });
  if (error) throw new Error(message(error));
}

export async function sendPatientMessage(
  text: string,
  category: string = "general",
  appointmentId?: number | null,
  language: "ar" | "en" = "en",
) {
  const { data, error } = await supabase.rpc("patient_send_message", {
    p_message: text,
    p_category: category,
    p_appointment_id: appointmentId ?? null,
  });
  if (error) throw new Error(message(error));
  const messageId = data as number;
  await supabase.functions
    .invoke("patient-auto-reply", { body: { messageId, language } })
    .catch(() => null);
  return messageId;
}
