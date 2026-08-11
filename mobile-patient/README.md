# Zernio Patient

Patient-facing mobile application for Panthera Clinics, built with Expo and React Native.

## Run locally

1. Copy `.env.example` to `.env.local` and add the public Supabase values.
2. Install dependencies with `npm install`.
3. Run `npm start` for Expo Go, or `npm run web` for the browser preview.

## Included experience

- Secure mobile-number sign in
- Patient home and next appointment
- Provider-first booking with doctor/department-specific services and live slots
- Upcoming and previous visits
- Invoices and payment status
- Medical profile
- Realtime in-app and native push notifications
- Online payment handoff and verified payment status
- Loyalty, care plans, progress media, health updates and concierge requests
- Account and sign out

## Supabase setup

1. Apply patient SQL files in filename order through `20260807_patient_automation_schedule_v16.sql`, then run every matching audit.
2. Enable the Phone provider in Supabase Authentication and configure an SMS provider.
3. Ensure each patient mobile number matches the corresponding `customers.phone` or `customers.phone_normalized` value.

The application uses real patient-scoped Supabase data through protected RPC functions. A verified patient can only link to the customer record carrying the same mobile number.

For device testing, use a development build rather than Expo Go because push notifications, biometrics and other native features require native modules.
