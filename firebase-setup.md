# Firebase setup for Household Resilience

1. Create a Firebase project on the free Spark plan at https://console.firebase.google.com/.
2. Add a Web app and copy its web configuration into a local `firebase-config.js` file, using `firebase-config.example.js` as a template.
3. In Firebase Authentication, enable Email/Password sign-in. Add your Netlify site under Authentication > Settings > Authorised domains if needed.
4. Create a Cloud Firestore database. Choose a European location where available. Do not use permissive test rules.
5. Deploy the contents of `firebase/firestore.rules` in Firestore > Rules and publish them before storing household data.
6. For GitHub-connected Netlify deployments, make the web configuration available by generating `firebase-config.js` during the build from Netlify environment variables. This is public web configuration, not a secret. Never place Firebase Admin service account keys in the frontend.
7. Open `firebase-app.html` to use the authenticated application. The older `index.html` remains an explicitly labelled local-only prototype until cutover.
8. Verify a second account cannot read the first account's household documents. Confirm sign-up, sign-in, sign-out, purchase logging and reload persistence before production use.

This initial integration supports a single owner account. Shared access for a second adult requires a further access-control design and rules tests.
