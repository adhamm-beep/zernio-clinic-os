import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "./supabase";

const DEVICE_KEY = "panthera_presence_device_id";
let deviceId: string | null = null;
let sessionKey: string | null = null;

function randomKey(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

async function identity() {
  if (!deviceId) {
    deviceId = await AsyncStorage.getItem(DEVICE_KEY);
    if (!deviceId) {
      deviceId = randomKey("device");
      await AsyncStorage.setItem(DEVICE_KEY, deviceId);
    }
  }
  if (!sessionKey) sessionKey = randomKey("session");
  return { deviceId, sessionKey };
}

export async function sendPatientPresence(state: "active" | "background" | "inactive") {
  const keys = await identity();
  const { error } = await supabase.rpc("patient_app_heartbeat", {
    p_device_id: keys.deviceId,
    p_session_key: keys.sessionKey,
    p_state: state,
    p_platform: Platform.OS,
    p_app_version: Constants.expoConfig?.version ?? null,
  });
  if (error) throw error;
}

export function beginNewPatientPresenceSession() {
  sessionKey = randomKey("session");
}
