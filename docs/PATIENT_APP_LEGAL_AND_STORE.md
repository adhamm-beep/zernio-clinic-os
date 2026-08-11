# Panthera Patient — legal and store release pack

## Public URLs after web deployment

- Privacy policy: `https://YOUR_PRODUCTION_DOMAIN/privacy`
- Terms and intellectual property: `https://YOUR_PRODUCTION_DOMAIN/terms`
- Account deletion: `https://YOUR_PRODUCTION_DOMAIN/account-deletion`

Replace `YOUR_PRODUCTION_DOMAIN` after deploying the employee OS. These routes are public and do not require staff sign-in.

## Details Panthera must confirm before publication

The application and policies are technically prepared, but the following legal facts must be confirmed by Panthera management or legal counsel before store submission:

- Registered legal entity name in Arabic and English.
- Commercial registration and healthcare licence details if they must appear publicly.
- Official privacy email and support phone.
- Registered address and country of establishment.
- Supabase production hosting region and any approved cross-border transfer mechanism.
- Retention period for clinical records, invoices, support messages, consent records and account logs.
- Legal basis used for each processing purpose and which optional uses require consent.
- Procedure, identity verification and response times for privacy requests.
- Whether minors can create accounts and the required guardian flow.

Do not publish invented values. Update the in-app and web policies if legal review changes any statement, and increment `legalVersion` in `mobile-patient/src/legal.ts`.

## Google Play Data safety draft

Declare that the app collects data and that data is encrypted in transit. Declare the in-app and web account-deletion paths.

Expected collected categories, subject to final review:

- Personal info: name, phone number, optional email, patient code.
- Health info: medical record, allergies, medicines, treatments, aftercare and progress media.
- Financial info: invoices, payment status and gateway references; the app should not store full card numbers.
- Messages: patient support and appointment-related messages.
- Photos: private progress photos when the patient has consented.
- App activity: bookings, consent actions, privacy requests and account events.
- Device or other IDs: Expo push token and essential security/session identifiers.

Primary purposes:

- App functionality and account management.
- Healthcare and care coordination.
- Security, fraud prevention and legal compliance.
- Customer support and essential communications.
- Payments where the user chooses online payment.

The declaration must include behavior of Supabase, Twilio, Expo, Firebase and Moyasar. Do not declare advertising or sale of data unless the product later adds it.

Also complete Google Play's Health apps declaration and identify the app as supporting healthcare management / clinical services as applicable. Keep the medical disclaimer visible: the app is not for emergencies, and automated suggestions do not diagnose or prescribe.

## Apple App Store privacy draft

Prepare App Privacy answers for contact info, identifiers, user content, health information, financial information and usage/account activity. Mark uses accurately and include third-party SDK processing. Provide the public privacy-policy URL and keep account deletion discoverable inside the application.

## Intellectual property notice

Suggested store and website footer:

`© 2026 Panthera Clinics. All rights reserved. The Panthera name, logos, application design, content and software may not be copied, modified, redistributed or commercially used without written permission.`

`© 2026 عيادات بانثيرا. جميع الحقوق محفوظة. لا يجوز نسخ اسم بانثيرا أو شعاراتها أو تصميم التطبيق أو محتواه أو برمجياته أو تعديلها أو إعادة توزيعها أو استخدامها تجاريًا دون إذن كتابي.`

## Release acceptance tests

1. Existing patient signs in using the verified mobile number and reaches only the matching patient record.
2. A new mobile number chooses New patient, accepts the current policy versions, verifies OTP and receives a new unique patient code.
3. Attempting New patient with an existing patient number is rejected and directs the user to Existing patient.
4. Arabic and English policies open before registration and from the Privacy tab after sign-in.
5. Access, export and correction requests create a staff-visible privacy request.
6. Deletion request signs the patient out and prevents further patient-data access while the request is reviewed.
7. `/privacy`, `/terms` and `/account-deletion` open without employee authentication on the production domain.
8. Private photos cannot be opened by another patient account.
9. The app displays no medical diagnosis or treatment decision generated automatically.
10. Push, booking, payment and audit tests in `docs/PRODUCTION_RELEASE.md` also pass.
