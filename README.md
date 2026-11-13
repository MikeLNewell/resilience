# Household Resilience

Household preparedness planner for a UK household, deployed at https://resilience.newell.phd/.

## Architecture

- Static HTML and JavaScript, published through Netlify.
- The root URL redirects to `firebase-app.html`.
- Firebase Authentication provides email/password login.
- Cloud Firestore holds planning settings, inventory and purchase history under `households/{uid}`.
- The Firestore rules in `firebase/firestore.rules` restrict each household to the authenticated UID.
- `index.html` is a legacy localStorage prototype and is **not** the deployed home page.

## Current features

Authenticated sign-in and registration; 3-, 7-, 14- or 28-day targets; inventory search and filters; purchase records; shopping list; estimated buying forecast; budget and planning-period settings.

The monthly buying forecast uses the configured budget and number of planning months. Prices are estimates, not retail quotations or safety assurances.

## Firebase deployment and security

The web configuration in `firebase-config.js` contains public Firebase app identifiers, not administrator credentials. Security depends on deployed Firebase Auth settings and Firestore rules. Rules in the repository are not necessarily the rules currently published in Firebase.

Deploy Firestore rules separately using authorised Firebase project access, and verify owner isolation using Firebase emulators and live authorised tests before treating the service as private. Netlify publishing does not deploy Firestore rules.

Do not publish service-account keys, private tokens or household data in the repository.

## Development status

A fuller household profile, persisted purchasing calendar, completed-month receipts, six-month reviews and password reset were drafted in a previous local development session but were not committed to the current default branch. They must be recovered or rebuilt, tested together with updated security rules, and then deployed. Do not assume those features are live.

## Limitations

The plan is indicative and does not guarantee that supplies are sufficient for a particular emergency. The original legacy page uses localStorage and does not synchronise.
