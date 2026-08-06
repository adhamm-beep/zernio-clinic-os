const ACTIVE_ROOM_NAMES = new Set([
  "clinic 1",
  "clinic 2",
  "clinic 3",
  "clinic 4",
  "clinic 5",
  "clinic 6",
  "laser 1",
  "laser 2",
  "fraxis room",
  "picoway room",
  "profacial room",
]);

export function isOperationalRoomName(name: string): boolean {
  return ACTIVE_ROOM_NAMES.has(name.trim().toLowerCase());
}
