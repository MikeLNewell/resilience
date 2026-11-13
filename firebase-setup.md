# Firebase setup for Household Resilience

1. Create a Firebase project on the free Spark plan at https://console.firebase.google.com/.
2. The Firebase web application is registered and its public configuration is committed to `firebase-config.js` for project `newell-household-resilience`.
3. In Firebase Authentication, enable Email/Password sign-in. Add your Netlify site under Authentication > Settings > Authorised domains if needed.
4. Create a Cloud Firestore database. Choose a European location where available. Do not use permissive test rules.
5. Deploy the contents of `firebase/firestore.rules` in Firestore > Rules and publish them before storing household data.
6. The public web configuration is committed to the repository. Never commit a Firebase Admin service account key. Firebase Auth and the published Firestore rules protect data, not secrecy of the web API key.
7. Open `firebase-app.html` to use the authenticated application. The older `index.html` remains an explicitly labelled local-only prototype until cutover.
8. Verify a second account cannot read the first account's household documents. Confirm sign-up, sign-in, sign-out, purchase logging and reload persistence before production use.

This initial integration supports a single owner account. Shared access for a second adult requires a further access-control design and rules tests.

## Current deployment state (13 November 2026)

The web configuration has been connected in source code. Email/password sign-in must still be enabled in the Firebase console, Firestore must be created and the security rules published. Firebase authentication and persistence have not been verified live. The main `index.html` remains the original browser-storage prototype pending a safe cutover.
