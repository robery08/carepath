# CAREPATH

CAREPATH is a responsive, offline-friendly health and medication organizer. It connects personal medicine notes, document references, health readings, appointment preparation, emergency details, and accessibility shortcuts in one workspace.

## Run locally

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite. Create a production build with:

```powershell
npm.cmd run build
```

## Workspaces and features

- **Home** — a connected overview and quick actions.
- **My Medicines & Medicine Passport** — keep personal medicine notes and print a reference.
- **Scan & Upload** — capture a photo with a phone camera or choose a photo/PDF, then save a review reference.
- **Safety Check & Safety Alerts** — review completeness, repeated names, missing details, and questions for a pharmacist.
- **Health Tracker, Trends, Timeline, Calendar & Map** — organize readings and related records.
- **Visit Prep** — prepare a checklist, saved snapshot, and questions for an appointment.
- **Care Circle & Emergency ID** — keep optional health details and trusted-contact information close by.
- **CAREPATH Easy Mode** — larger controls and clearer text, saved as a local preference.
- **Start Guide** — first-use tour buttons open the actual medicine, scan, reminder, and emergency workflows.
- **Tell CAREPATH** — optional browser speech input for navigation shortcuts, plus typed fallback. Commands are reviewed before use; confirming a dose note is a separate step.
- **Read this to me** — uses speech synthesis where the browser supports it.
- **Medicine reminders** — daily local time notes with optional browser notifications, vibration, and sound where supported.
- **AI Hub** — local rule-based educational replies that summarize saved notes; no AI service is contacted.
- **Installable offline app** — a web app manifest and service worker precache all built app resources after the first online load. Install where the browser supports it; health notes use this browser’s local storage.

## Demo, privacy, and safety limits

CAREPATH is a personal organizer and project demo, not a clinical decision-support tool. Starter medicines and readings are illustrative. The scanner does not run OCR: its sample extraction fields are not read from the selected image or PDF, and document bytes are not uploaded or saved as the document reference. The Safety Check reviews saved fields only; it does not check interactions, suitability, or diagnose a problem. AI Hub replies are local rules and are not medical advice.

Voice recognition support varies by browser. Some browser speech-recognition services send audio to their service for processing; CAREPATH does not save audio or transcripts. Read-aloud uses the browser’s speech synthesis.

Reminder times are daily personal notes. The in-page timer works only while CAREPATH remains open and running. Browser notifications require your explicit permission and depend on the browser and device. A closed or suspended browser may not deliver a reminder; CAREPATH is not a guaranteed alarm service. Verify every time and instruction against the current medicine package or prescription. For a missed dose, check that source or ask a pharmacist; do not take an extra dose unless a qualified professional tells you to.

This demo stores profile, medicine, and health notes in local browser storage, without an account, encryption layer, server sync, or caregiver sharing. Voice input may use browser services as described above. Clearing browser data can remove the local record; use **Settings & Privacy → Export my record** to save a copy. Do not rely on this demo as your only copy of clinical records. In an emergency, contact local emergency services directly.

## Publish a free web version

CAREPATH is a static Vite app and can be hosted on GitHub Pages. This repository is configured for the project site at `https://robery08.github.io/carepath/`. The GitHub Actions workflow builds the app and publishes the `dist` folder whenever code is pushed to `main`.

To enable publishing, open **Settings → Pages** in the GitHub repository and set **Build and deployment → Source** to **GitHub Actions**. Then check the **Actions** tab for the deployment result and open the Pages link shown there.

Publishing makes the website available to anyone with the link, and the source repository is public. Visitors' medicine and health notes stay in their own browser storage; this version has no account, shared family records, server backup, or multi-device sync. Browser storage is not an encrypted medical-record vault. Do not enter real patient information into public source files or commit personal records, API keys, or passwords.
