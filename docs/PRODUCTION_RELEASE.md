# Panthera first production release

## Required external configuration

1. Supabase production project URL, publishable key and server-only service-role key.
2. Twilio Verify production service connected to Supabase Phone Auth.
3. Moyasar production secret key and the final HTTPS web address.
4. OpenAI production project key with a spending limit and usage alerts.
5. Expo/EAS production project, Android Play Console account and Apple Developer account for iOS.
6. A web host and domain for the employee OS (recommended: `os.panthera.sa`).
7. Confirm every legal fact listed in `docs/PATIENT_APP_LEGAL_AND_STORE.md` and publish the three public legal URLs.

## Security gates

- Rotate every key that has ever appeared in screenshots, chat, source control or terminal output.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `MOYASAR_SECRET_KEY` and `OPENAI_API_KEY` on the web host only.
- Never place server secrets in mobile variables or variables starting with `NEXT_PUBLIC_` / `EXPO_PUBLIC_`.
- Enable MFA for clinic administrators, Supabase, Expo, Twilio, Moyasar and hosting accounts.
- Enable Supabase backups/PITR and test one restore before launch.
- Review Auth rate limits, OTP expiry, allowed redirect URLs and the production domain.

## Patient journey acceptance test

1. Sign in with a real patient mobile number and OTP.
2. Choose provider, service, slot and submit the booking request.
3. Accept the request in the employee OS.
4. Confirm status changes immediately in both apps and a push notification arrives.
5. Complete a test visit, record material/quantity and verify inventory deduction.
6. Create and pay a test invoice; verify the payment on both sides.
7. Confirm treatment history, aftercare, medical record and audit history remain available after signing out and back in.

## Build commands

```powershell
npm.cmd run check:release
cd mobile-patient
npx.cmd eas build --platform android --profile production
npx.cmd eas build --platform ios --profile production
```

Production submission must happen only after the acceptance test passes against production-like data without real clinical or payment data.
