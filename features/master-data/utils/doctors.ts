import type { MasterStaff } from "../types/master-data";

const APPROVED_DOCTOR_NAMES = new Set([
  "dr fatima alsatouf",
  "dr maram",
  "dr fatima khaled",
]);

export function isApprovedDoctor(member: MasterStaff): boolean {
  return isApprovedDoctorName(member.staff_name);
}

export function isApprovedDoctorName(name: string): boolean {
  return APPROVED_DOCTOR_NAMES.has(name.trim().toLowerCase());
}
