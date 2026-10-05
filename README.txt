THESIS TIMELINE - FIREBASE VERSION

1. Make sure Firestore Database has been created in Firebase.
2. For initial testing only, use the included firestore.rules:
   - Firebase Console
   - Firestore Database
   - Rules
   - Replace the rules with the contents of firestore.rules
   - Click Publish
3. Upload index.html, style.css, and script.js to the root of your GitHub repository.
4. Commit the changes and wait for GitHub Pages to redeploy.
5. Open the website on two devices/browsers.
6. Add a task on one device. It should appear on the other device automatically.

IMPORTANT:
The included Firestore rules allow anyone who can reach your project to read/write tasks.
Use them only while testing. Add Firebase Authentication and stricter rules before using
the site for private or important thesis data.
