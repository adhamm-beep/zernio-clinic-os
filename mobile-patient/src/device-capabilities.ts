import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Calendar from "expo-calendar";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as LocalAuthentication from "expo-local-authentication";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";
import type { Language } from "./i18n";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound:true, shouldSetBadge:true, shouldShowBanner:true, shouldShowList:true }),
});

export async function unlockWithBiometrics(language:Language="en") {
  if (Platform.OS==="web") return true;
  const [hardware,enrolled]=await Promise.all([LocalAuthentication.hasHardwareAsync(),LocalAuthentication.isEnrolledAsync()]);
  if(!hardware||!enrolled)return true;
  const ar=language==="ar";
  const result=await LocalAuthentication.authenticateAsync({promptMessage:ar?"فتح تطبيق عيادات بانثيرا":"Open Panthera Clinics",cancelLabel:ar?"إلغاء":"Cancel",disableDeviceFallback:false});
  return result.success;
}

export async function registerPatientPushNotifications(language:Language="en") {
  const ar=language==="ar";
  if(Platform.OS==="web")throw new Error(ar?"الإشعارات الفورية تحتاج إلى تطبيق الهاتف المثبّت.":"Push notifications require the installed mobile app.");
  if(!Device.isDevice)throw new Error(ar?"الإشعارات الفورية تحتاج إلى هاتف حقيقي.":"Push notifications require a physical device.");
  const existing=await Notifications.getPermissionsAsync();
  const permission=existing.status==="granted"?existing:await Notifications.requestPermissionsAsync();
  if(permission.status!=="granted")throw new Error(ar?"صلاحية الإشعارات متوقفة. فعّلها من إعدادات الهاتف ثم افتح بانثيرا مجددًا.":"Notification permission is disabled. Enable it in Android Settings, then reopen Panthera.");
  if(Platform.OS==="android")await Notifications.setNotificationChannelAsync("patient-care",{name:ar?"رعاية المريض":"Patient care",importance:Notifications.AndroidImportance.HIGH,vibrationPattern:[0,250,250,250]});
  const projectId=Constants.easConfig?.projectId??Constants.expoConfig?.extra?.eas?.projectId??process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if(!projectId)throw new Error(ar?"معرّف مشروع Expo غير موجود في هذه النسخة.":"The Expo project ID is missing from this build.");
  const token=(await Notifications.getExpoPushTokenAsync({projectId})).data;
  const {error}=await supabase.rpc("patient_register_push_token",{p_token:token,p_platform:Platform.OS});
  if(error)throw new Error(error.message);
  await AsyncStorage.setItem("zernio_push_token",token);
  return token;
}

export type PatientPushOpenData={notificationId?:number;actionTab?:string;entityType?:string;entityId?:number};

let lastHandledNotificationResponseId: string | null = null;

export function subscribeToPatientNotifications(onOpen:(data:PatientPushOpenData)=>void) {
  const handleResponse=(response:Notifications.NotificationResponse|null)=>{
    if(!response||response.notification.request.identifier===lastHandledNotificationResponseId)return;
    lastHandledNotificationResponseId=response.notification.request.identifier;
    onOpen((response.notification.request.content.data??{}) as PatientPushOpenData);
  };
  const received=Notifications.addNotificationReceivedListener(()=>undefined);
  const opened=Notifications.addNotificationResponseReceivedListener(handleResponse);
  void Notifications.getLastNotificationResponseAsync().then(handleResponse).catch(()=>undefined);
  return ()=>{received.remove();opened.remove();};
}

export async function addPatientAppointmentToCalendar(input:{title:string;start:string;durationMinutes?:number;notes?:string},language:Language="en") {
  const ar=language==="ar";
  if(Platform.OS==="web")throw new Error(ar?"إضافة الموعد للتقويم متاحة في تطبيق الهاتف.":"Calendar integration is available in the mobile app.");
  const permission=await Calendar.requestCalendarPermissionsAsync();
  if(permission.status!=="granted")throw new Error(ar?"يلزم السماح بالوصول إلى التقويم.":"Calendar permission is required.");
  const calendars=await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  let calendarId=calendars.find(x=>x.allowsModifications)?.id;
  if(!calendarId&&Platform.OS==="ios"){
    const source=await Calendar.getDefaultCalendarAsync();
    const calendarName=ar?"عيادات بانثيرا":"Panthera Clinics";
    calendarId=await Calendar.createCalendarAsync({title:calendarName,color:"#52697A",entityType:Calendar.EntityTypes.EVENT,sourceId:source.source.id,source:source.source,name:calendarName,ownerAccount:"personal",accessLevel:Calendar.CalendarAccessLevel.OWNER});
  }
  if(!calendarId)throw new Error(ar?"لم يتم العثور على تقويم قابل للإضافة.":"No writable calendar was found.");
  const startDate=new Date(input.start),endDate=new Date(startDate.getTime()+(input.durationMinutes??30)*60000);
  await Calendar.createEventAsync(calendarId,{title:input.title,startDate,endDate,timeZone:"Asia/Riyadh",notes:input.notes,alarms:[{relativeOffset:-1440},{relativeOffset:-120}]});
}
