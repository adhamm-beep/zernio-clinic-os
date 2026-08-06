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

## Supabase setup

1. Run `supabase/sql/20260807_patient_mobile_portal.sql` in the Supabase SQL editor.
2. Enable the Phone provider in Supabase Authentication and configure an SMS provider.
3. Ensure each patient mobile number matches the corresponding `customers.phone` or `customers.phone_normalized` value.

The application uses real patient-scoped Supabase data through protected RPC functions. A verified patient can only link to the customer record carrying the same mobile number.
