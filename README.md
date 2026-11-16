# Household Resilience

Household preparedness planner for a UK household, deployed at https://resilience.newell.phd/.

## Architecture

- Static HTML and JavaScript, published through Netlify.
- The root URL redirects to `firebase-app.html`.
- Firebase Authentication provides email/password login.
- Cloud Firestore holds planning settings, inventory and purchase history under `households/{uid}`.
- The Firestore rules in `firebase/firestore.rules` restrict each household to the authenticated UID.
- Netlify publishes only `public/`, containing the live HTML, Firebase configuration and three feature modules.
- `archive/index.html` and `archive/supabase/` are retained historical files, not used or published.
- Firebase rules, deployment configuration, workflows and documentation remain outside `public/`.

## Current features

Authenticated sign-in and registration; 3-, 7-, 14- or 28-day targets; inventory search and filters; purchase records; shopping list; estimated buying forecast; budget and planning-period settings.

The monthly buying forecast uses the configured budget and number of planning months. Prices are estimates, not retail quotations or safety assurances.

## Firebase deployment and security

The web configuration in `public/firebase-config.js` contains public Firebase app identifiers, not administrator credentials. Security depends on deployed Firebase Auth settings and Firestore rules. Rules in the repository are not necessarily the rules currently published in Firebase.

The GitHub Actions workflow `.github/workflows/firestore-rules.yml` deploys `firebase/firestore.rules` to production when relevant changes are pushed to `main`. Netlify publishing itself does not deploy Firestore rules. Verify owner isolation using Firebase emulators and authorised live tests.

Do not publish service-account keys, private tokens or household data in the repository.

## Development status

The household profile, saved purchasing calendar, monthly completion receipts, stock review, password reset, wood heating and meter readings are implemented in the authenticated application. Firestore rules are deployed through the separate GitHub Actions workflow. Verify the workflow result after any rules change.

## Netlify deployment

No build step is required. `netlify.toml` publishes `public/` and rewrites `/` to `/firebase-app.html`. After deployment, verify sign-in and existing data, and confirm `/README.md`, `/firebase-setup.md`, `/supabase/schema.sql`, `/archive/index.html`, `/firebase/firestore.rules` and `/index.html` return HTTP 404.

## Limitations

The plan is indicative and does not guarantee that supplies are sufficient for a particular emergency. The archived legacy page is not part of the deployed application.

## Price Finder

The Price Finder tab offers per-item search links to UK supermarkets, shops and second-hand marketplaces. It separates items appropriate for second-hand sourcing from food, water, medical supplies, safety alarms and batteries, which should be purchased new from reliable retailers. Used listings must always be checked for condition and safety.

Users can save verified retailer quotations, quantity/pack equivalents and delivery costs. Comparisons use the total delivered price per equivalent catalogue unit. The basket table reports how many outstanding items each supermarket covers; partial subtotals are **not** a like-for-like ranking of whole baskets. The app never invents or displays purported live prices and does not automatically scrape websites. Check availability, loyalty schemes, minimum order amounts and delivery costs on the seller's website.

Recorded quotations use browser localStorage scoped to the signed-in Firebase UID. They are **not** yet synchronised across devices or saved to Firestore. Users clearing this browser's data will lose them. Automated live pricing, history, alerts and cross-device quote storage are future integrations requiring a reliable authorised data source and updated backend rules.
