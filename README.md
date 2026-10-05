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
- **Health Tracker, Trends, Timeline & Calendar** — organize long-term BP, glucose, and other readings.
- **Everyday Health Guide** — practical starting points for hypertension, diabetes, cancer-treatment support, regular medicines, and short-lived cold symptoms, with links to WHO, NCI, and NHS resources.
- **Visit Prep** — prepare a checklist, saved snapshot, and questions for an appointment.
- **Care Circle & Emergency ID** — keep optional health details, doctor and pharmacy numbers, and trusted-contact information close by. Call and message buttons open your device's apps after you choose them.
- **Health Map** — search pharmacies, medical stores, and hospitals in a typed area or with a one-time location request. CAREPATH sends a location to Google Maps only after you open a search; map results do not verify stock or quality.
- **CAREPATH Easy Mode** — larger controls and clearer text, saved as a local preference.
- **Start Guide** — first-use tour buttons open the actual medicine, scan, reminder, and emergency workflows.
- **Tell CAREPATH** — optional browser speech input for navigation shortcuts, plus typed fallback. Commands are reviewed before use; confirming a dose note is a separate step.
- **Read this to me** — uses speech synthesis where the browser supports it.
- **Medicine reminders** — daily local time notes with optional browser notifications, vibration, and sound where supported.
- **AI Hub** — organize your saved information on-device while offline, or explicitly send one general question to Gemini with Google Search grounding and linked sources when online.
- **Installable offline app** — a web app manifest and service worker precache all built app resources after the first online load. Install where the browser supports it; health notes use this browser’s local storage.

## Demo, privacy, and safety limits

CAREPATH is a personal organizer and project demo, not a clinical decision-support tool. Starter medicines and readings are illustrative. The scanner does not run OCR: its sample extraction fields are not read from the selected image or PDF, and document bytes are not uploaded or saved as the document reference. The Safety Check reviews saved fields only; it does not check interactions, suitability, or diagnose a problem. CAREPATH never prescribes or chooses a medicine. The AI Hub's local mode works offline; Gemini mode is general education, not personal medical advice, even when it shows source links. It cannot decide that a person should skip needed care.

Gemini mode sends only the question typed into that mode to the CAREPATH server endpoint and Google Gemini/Search after the user ticks the sharing checkbox and submits. Saved profile, medicine, and reading records are not attached automatically. Do not enter names, contact information, or identifying health details. The server-side function is in `functions/api/guidance.ts`; its API key is never placed in the browser bundle. Public use of an AI endpoint can consume API quota: configure provider quota/billing alerts and a Cloudflare rate limit for `/api/guidance` before sharing a public link. Google's API policies apply to submitted questions.

Voice recognition support varies by browser. Some browser speech-recognition services send audio to their service for processing; CAREPATH does not save audio or transcripts. Read-aloud uses the browser’s speech synthesis.

Reminder times are daily personal notes. The in-page timer works only while CAREPATH remains open and running. Browser notifications require your explicit permission and depend on the browser and device. A closed or suspended browser may not deliver a reminder; CAREPATH is not a guaranteed alarm service. Verify every time and instruction against the current medicine package or prescription. For a missed dose, check that source or ask a pharmacist; do not take an extra dose unless a qualified professional tells you to.

This demo stores profile, medicine, and health notes in local browser storage, without an account, encryption layer, server sync, or caregiver sharing. Voice input may use browser services as described above. Clearing browser data can remove the local record; use **Settings & Privacy → Export my record** to save a copy. Do not rely on this demo as your only copy of clinical records. In an emergency, contact local emergency services directly.

## Publish a web version

CAREPATH is a static Vite app and can be hosted on GitHub Pages. This repository is configured for the project site at `https://robery08.github.io/carepath/`. The GitHub Actions workflow builds the app and publishes the `dist` folder whenever code is pushed to `main`.

For a static GitHub Pages deployment, open **Settings → Pages** in the GitHub repository and set **Build and deployment → Source** to **GitHub Actions**. This version supports the local CAREPATH features but does not run the Gemini server function, so Gemini Search will show an unavailable message.

To deploy the Gemini function, create a Cloudflare Pages project connected to the repository, use `npm run build` as the build command and `dist` as the output directory. In the Cloudflare dashboard, open the project **Settings → Variables and Secrets**, add `GEMINI_API_KEY` as an encrypted secret, and redeploy. The `/functions/api/guidance.ts` function runs on Cloudflare Pages; never put the key in a `VITE_*` variable or client-side file. Set a Cloudflare rate-limit rule for `/api/guidance` and configure Gemini quota/billing alerts before sharing the endpoint publicly. On Cloudflare, the app builds with a root URL; the GitHub Actions build keeps the `/carepath/` subpath.

Publishing makes the website available to anyone with the link, and the source repository is public. Visitors' medicine and health notes stay in their own browser storage; this version has no account, shared family records, server backup, or multi-device sync. Browser storage is not an encrypted medical-record vault. Do not enter real patient information into public source files or commit personal records, API keys, or passwords.
