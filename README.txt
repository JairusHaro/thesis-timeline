FAST LEADER DASHBOARD UPDATE

Replace only:
- leader.html
- leader.js

Your existing Firebase tasks are NOT changed or deleted.

What this update does:
- Shows the last saved dashboard data immediately on repeat visits.
- Connects to Firestore in the background.
- Updates the screen as soon as the newest Firestore data arrives.
- Adds preconnect hints for Firebase/Google CDN.
- Keeps Add/Edit task functionality.
- Keeps the no-delete safety behavior.

First visit on a completely new device may still need a short Firebase connection,
but repeat visits on that device should feel much faster.
