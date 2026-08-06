# Zernio Patient

Patient-facing mobile application for Panthera Clinics, built with Expo and React Native.

## Run locally

1. Copy `.env.example` to `.env.local` and add the public Supabase values.
2. Install dependencies with `npm install`.
3. Run `npm start` for Expo Go, or `npm run web` for the browser preview.

## Included UI

- Secure mobile-number sign in
- Patient home and next appointment
- Three-step appointment booking
- Upcoming and previous visits
- Invoices and payment status
- Medical profile
- Notifications
- Account and sign out

The screens currently use typed preview data. `src/supabase.ts` is the connection entry point for replacing it with patient-scoped Supabase queries and OTP authentication.
