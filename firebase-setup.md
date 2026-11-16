# Firebase setup for Household Resilience

The existing Firebase project is `newell-household-resilience`. The live application is hosted at https://resilience.newell.phd/.

## Folder structure

- `public/`: authenticated application (`firebase-app.html`), public Firebase web configuration (`firebase-config.js`), and feature modules (`price-finder.js`, `wood-heating.js`, `home-energy.js`).
- `archive/`: historical local-only page and unused Supabase files; neither is published.
- `firebase/` and `firebase.json`: Firestore rules and deployment configuration.
- `.github/workflows/firestore-rules.yml`: automated rules deployment.
- `firebase-config.example.js`: configuration example retained at repository root.

## Configuration and deployment

1. In Firebase Authentication, enable Email/Password sign-in and verify the live domain is authorised.
2. Use the existing Cloud Firestore database. Do not enable permissive test rules.
3. The committed `public/firebase-config.js` contains public Firebase identifiers, not administrative credentials. Never commit service-account keys or private tokens.
4. Firestore rules changes pushed to `main` trigger the GitHub Actions deployment to production. Test changes before merging and confirm the workflow succeeds.
5. Netlify publishes only `public/`, with the root URL rewritten to `/firebase-app.html`. Netlify does not deploy Firestore rules.
6. After deployment, verify sign-in, existing household data and owner isolation. Confirm repository documentation, archive files and Firestore rules are not served by the live site.

Household data is scoped to the authenticated UID under `households/{uid}`. Shared access requires a separate access-control design and rules tests.
