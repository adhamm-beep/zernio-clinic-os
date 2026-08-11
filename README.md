# Panthera Clinics OS

The employee operating system and patient mobile application for Panthera Clinics.

## Applications

- Web OS: appointments, Customer 360, treatments, invoices, inventory, HR, marketing, analytics and clinic automation.
- Patient app (`mobile-patient`): phone OTP, booking, appointment journey, payments, medical profile, loyalty, results and push notifications.
- Supabase: PostgreSQL, RLS, patient-safe RPCs, realtime events, scheduled reminders and push delivery.

## Local verification

```powershell
npm.cmd ci
npm.cmd run check:release
```

Copy `.env.example` to `.env.local` for the web app and `mobile-patient/.env.example` to `mobile-patient/.env.local` for the patient app. Never commit either local file.

## Database rollout

SQL changes are versioned in `supabase/sql`. Apply unapplied files in filename order, then run the matching `_audit.sql` file. Every audit row must return `OK` before release. Never run cleanup or legacy import files against production without a backup and explicit review.

## Release gates

- Web lint, typecheck and production build pass.
- Mobile typecheck and Expo Doctor pass.
- Database audit returns only `OK`.
- Phone OTP is tested using a real Saudi number.
- Booking acceptance produces an in-app notification and a push notification.
- Moyasar test payment is verified through the callback and appears in both patient and employee views.
- Supabase point-in-time recovery/backups and production alerts are enabled.

See `docs/PRODUCTION_RELEASE.md` for the complete launch checklist.
