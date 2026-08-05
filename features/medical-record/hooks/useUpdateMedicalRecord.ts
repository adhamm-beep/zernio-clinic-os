"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  saveMedicalRecord,
} from "../api/medical-record.api";

import type {
  SaveMedicalRecordInput,
} from "../types/medical-record";

export function useUpdateMedicalRecord() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      input: SaveMedicalRecordInput
    ) =>
      saveMedicalRecord(input),

    onSuccess: async (
      savedRecord
    ) => {
      await queryClient.invalidateQueries({
        queryKey: [
          "medical-record",
          savedRecord.customer_id,
        ],
      });
    },
  });
}