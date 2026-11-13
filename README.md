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

The household profile, saved purchasing calendar, monthly completion receipts, six-month stock review and password-reset functionality are now committed on the default branch. Corresponding access rules are in `firebase/firestore.rules`. These rules MUST be published to the Firebase project separately: pushing to GitHub or deploying Netlify does not publish Firestore rules. The existing inventory remains usable if calendar-rule access is denied. JavaScript syntax has been checked, but end-to-end browser/Auth/Firestore emulator testing and confirmation of the live Netlify deployment remain outstanding.

To publish, open Firebase Console → project `newell-household-resilience` → Firestore Database → Rules, paste the repository's full `firebase/firestore.rules`, inspect and publish. Confirm Email/Password is enabled in Firebase Authentication and add `resilience.newell.phd` to authorised domains if needed. Test by signing in, saving profile, creating the fixed schedule and completing one month using a dedicated test account.

## Limitations

The plan is indicative and does not guarantee that supplies are sufficient for a particular emergency. The original legacy page uses localStorage and does not synchronise.

## Price Finder

The Price Finder tab offers per-item search links to UK supermarkets, shops and second-hand marketplaces. It separates items appropriate for second-hand sourcing from food, water, medical supplies, safety alarms and batteries, which should be purchased new from reliable retailers. Used listings must always be checked for condition and safety.

Users can save verified retailer quotations, quantity/pack equivalents and delivery costs. Comparisons use the total delivered price per equivalent catalogue unit. The basket table reports how many outstanding items each supermarket covers; partial subtotals are **not** a like-for-like ranking of whole baskets. The app never invents or displays purported live prices and does not automatically scrape websites. Check availability, loyalty schemes, minimum order amounts and delivery costs on the seller's website.

Recorded quotations use browser localStorage scoped to the signed-in Firebase UID. They are **not** yet synchronised across devices or saved to Firestore. Users clearing this browser's data will lose them. Automated live pricing, history, alerts and cross-device quote storage are future integrations requiring a reliable authorised data source and updated backend rules.
