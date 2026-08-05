import {
  checkConflicts,
  type ConflictCheckInput,
} from "./conflict.engine";

export type BookingInput = ConflictCheckInput & {
  customerId: number;
};

export type BookingResult = {
  success: boolean;
  message: string;
};

export function validateBooking(
  input: BookingInput
): BookingResult {
  if (!input.customerId) {
    return {
      success: false,
      message: "Customer is required.",
    };
  }

  const result = checkConflicts(input);

  if (result.doctorConflict) {
    return {
      success: false,
      message: "Doctor already booked.",
    };
  }

  if (result.roomConflict) {
    return {
      success: false,
      message: "Room already booked.",
    };
  }

  return {
    success: true,
    message: "Booking allowed.",
  };
}