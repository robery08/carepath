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
- **Discover CAREPATH** — a rotating feature carousel for CAREPATH Easy, ASK CAREPATH, safety review, the health journey, Care Circle, and visit preparation.
- **Browser navigation** — internal sections use URL hashes and the browser history, including Back/Forward restoration of the section, overlays, and scroll position.
- **My Medicines & Medicine Passport** — keep personal medicine notes, print a reference, and optionally estimate days of supply from the remaining count and the usage rate you enter from current instructions.
- **Medication Changes** — save a local medicine-list snapshot and review additions, removals, or changed personal entries with a professional.
- **Scan & Upload** — capture a photo with a phone camera or choose a photo/PDF, then save a review reference.
- **Safety Check & Safety Alerts** — review completeness, repeated names, missing details, and questions for a pharmacist.
- **Health Tracker, Trends, Timeline & Calendar** — organize long-term BP, glucose, and other readings.
- **Everyday Health Guide** — practical starting points for hypertension, diabetes, cancer-treatment support, regular medicines, and short-lived cold symptoms, with links to WHO, NCI, and NHS resources.
- **Care Guide** — structured English/Kannada cards for diabetes and blood sugar, high blood pressure, cancer-treatment support, and everyday medicine safety. The general guides are available in the app without Gemini or a network request.
- **Visit Prep** — prepare a checklist, saved snapshot, and questions for an appointment.
- **Care Circle & Emergency ID** — keep optional health details, doctor and pharmacy numbers, and trusted-contact information close by. Call and message buttons open your device's apps after you choose them.
- **Health Map** — search pharmacies, medical stores, and hospitals in a typed area or with a one-time location request. CAREPATH sends a location to Google Maps only after you open a search; map results do not verify stock or quality.
- **CAREPATH Easy Mode** — larger controls and clearer text, saved as a local preference.
- **Start Guide** — first-use tour buttons open the actual medicine, scan, reminder, and emergency workflows.
- **Tell CAREPATH** — optional browser speech input for navigation shortcuts, plus typed fallback. Commands are reviewed before use; confirming a dose note is a separate step.
- **Read this to me** — uses speech synthesis where the browser supports it.
- **Medicine reminders** — daily local time notes with optional browser notifications, vibration, and sound where supported.
- **Expiry watch and missed-dose guide** — optional package expiry notes, rough stock watch, and a source-first missed-dose flow that never suggests an extra dose.
- **Lab/test explainer and report trends** — save values copied from reports, review them by date, include them in the timeline and visit brief, and use a clearly fictitious example trend. CAREPATH never interprets results or reference ranges.
- **ASK CAREPATH** — a bilingual (English/Kannada) on-device guide for common medicine and health topics, with linked official sources and a clear fallback for questions it cannot answer. The typed question stays in the browser. Product-specific information links to country regulator resources; the list is not a complete worldwide tablet catalogue.
- **Official Sources** — an optional, separate source search filtered toward official medicine regulators by selected country. It opens Google only after the user explicitly confirms; saved medicines, readings, and profile details are never attached.
- **Installable offline app** — a web app manifest and service worker precache all built app resources after the first online load. Install where the browser supports it; health notes use this browser’s local storage.
- **Privacy controls** — local last-saved status, JSON export for the full record and visit brief, and an explicit delete-local-record control.

## Demo, privacy, and safety limits

CAREPATH is a personal organizer and project demo, not a clinical decision-support tool. Starter medicines and readings are illustrative. The scanner does not run OCR: its sample extraction fields are not read from the selected image or PDF, and document bytes are not uploaded or saved as the document reference. The Safety Check reviews saved fields only; it does not check interactions, suitability, or diagnose a problem. CAREPATH never prescribes or chooses a medicine. Care Guide provides curated offline topic cards. ASK CAREPATH matches a short question to a small curated offline guide; it is not Gemini or a live AI service and cannot answer every question. It does not send the typed question or saved records anywhere. External source pages and regulator registers open only when a user chooses a link; Google Search is limited to the separate Official Sources workspace and requires confirmation. The linked sources are general education, not personal medical advice.

The optional medicine supply estimate uses only the remaining count and units-per-day rate entered by the user. It is a rough arithmetic estimate, not a dose or schedule recommendation; verify both values against current instructions. There is no single complete, current, official database of every medicine sold worldwide, so CAREPATH links to country-specific sources and does not claim global completeness.

This static GitHub Pages app does not make Gemini API calls and stores no AI key in its frontend. A live AI answering service would require a separately deployed secure server endpoint and a carefully limited health-information policy; do not add an API key to public client-side code.

Voice recognition support varies by browser. Some browser speech-recognition services send audio to their service for processing; CAREPATH does not save audio or transcripts. Read-aloud uses the browser’s speech synthesis.

Reminder times are daily personal notes. The in-page timer works only while CAREPATH remains open and running. Browser notifications require your explicit permission and depend on the browser and device. A closed or suspended browser may not deliver a reminder; CAREPATH is not a guaranteed alarm service. Verify every time and instruction against the current medicine package or prescription. For a missed dose, check that source or ask a pharmacist; do not take an extra dose unless a qualified professional tells you to.

This demo stores profile, medicine, and health notes in local browser storage, without an account, encryption layer, server sync, or caregiver sharing. Voice input may use browser services as described above. Clearing browser data can remove the local record; use **Settings & Privacy → Export my record** to save a copy. Do not rely on this demo as your only copy of clinical records. In an emergency, contact local emergency services directly.

## Publish a web version

CAREPATH is a static Vite app and can be hosted on GitHub Pages. This repository is configured for the project site at `https://robery08.github.io/carepath/`. The GitHub Actions workflow builds the app and publishes the `dist` folder whenever code is pushed to `main`.

For a static GitHub Pages deployment, open **Settings → Pages** in the GitHub repository and set **Build and deployment → Source** to **GitHub Actions**. A static Cloudflare Pages project can use `npm run build` as the build command and `dist` as the output directory. Neither host needs a medical AI API key for the current version. The local organizer and saved guides work offline after the first load; web searches, map lookups, calls, and messages need a network or device service.

Publishing makes the website available to anyone with the link, and the source repository is public. Visitors' medicine and health notes stay in their own browser storage; this version has no account, shared family records, server backup, or multi-device sync. Browser storage is not an encrypted medical-record vault. Do not enter real patient information into public source files or commit personal records, API keys, or passwords.

