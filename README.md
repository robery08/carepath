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
- **My Medicines & Medicine Passport** — keep personal medicine notes, print a reference, and optionally estimate days of supply from the remaining count and the usage rate you enter from current instructions.
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
- **Medicine & Health Finder** — explicitly open Google Search filtered toward official medicine regulators by selected country (including CDSCO India, FDA US, MHRA UK, EMA EU, Health Canada, TGA Australia, and PMDA Japan), or trusted general health sources. Country databases differ; global search is only a starting point and is not a complete worldwide tablet catalogue.
- **Installable offline app** — a web app manifest and service worker precache all built app resources after the first online load. Install where the browser supports it; health notes use this browser’s local storage.

## Demo, privacy, and safety limits

CAREPATH is a personal organizer and project demo, not a clinical decision-support tool. Starter medicines and readings are illustrative. The scanner does not run OCR: its sample extraction fields are not read from the selected image or PDF, and document bytes are not uploaded or saved as the document reference. The Safety Check reviews saved fields only; it does not check interactions, suitability, or diagnose a problem. CAREPATH never prescribes or chooses a medicine. The Medicine & Health Finder works as a local interface when offline; its web search opens a separate Google Search tab only after the user confirms. Only the typed query and selected source filter are sent to Google; saved medicines, readings, and profile details are not attached. Do not put names or identifying details in a search. The linked sources and search results are educational, not personal medical advice.

The optional medicine supply estimate uses only the remaining count and units-per-day rate entered by the user. It is a rough arithmetic estimate, not a dose or schedule recommendation; verify both values against current instructions. There is no single complete, current, official database of every medicine sold worldwide, so CAREPATH links to country-specific sources and does not claim global completeness.

Gemini API calls are not built into this public consumer health app: [Google's current API terms](https://ai.google.dev/gemini-api/terms) restrict the API to professional or business applications and prohibit clinical-practice or medical-advice uses. CAREPATH uses on-device organization and direct source search instead.

Voice recognition support varies by browser. Some browser speech-recognition services send audio to their service for processing; CAREPATH does not save audio or transcripts. Read-aloud uses the browser’s speech synthesis.

Reminder times are daily personal notes. The in-page timer works only while CAREPATH remains open and running. Browser notifications require your explicit permission and depend on the browser and device. A closed or suspended browser may not deliver a reminder; CAREPATH is not a guaranteed alarm service. Verify every time and instruction against the current medicine package or prescription. For a missed dose, check that source or ask a pharmacist; do not take an extra dose unless a qualified professional tells you to.

This demo stores profile, medicine, and health notes in local browser storage, without an account, encryption layer, server sync, or caregiver sharing. Voice input may use browser services as described above. Clearing browser data can remove the local record; use **Settings & Privacy → Export my record** to save a copy. Do not rely on this demo as your only copy of clinical records. In an emergency, contact local emergency services directly.

## Publish a web version

CAREPATH is a static Vite app and can be hosted on GitHub Pages. This repository is configured for the project site at `https://robery08.github.io/carepath/`. The GitHub Actions workflow builds the app and publishes the `dist` folder whenever code is pushed to `main`.

For a static GitHub Pages deployment, open **Settings → Pages** in the GitHub repository and set **Build and deployment → Source** to **GitHub Actions**. A static Cloudflare Pages project can use `npm run build` as the build command and `dist` as the output directory. Neither host needs a medical AI API key for the current version. The local organizer and saved guides work offline after the first load; web searches, map lookups, calls, and messages need a network or device service.

Publishing makes the website available to anyone with the link, and the source repository is public. Visitors' medicine and health notes stay in their own browser storage; this version has no account, shared family records, server backup, or multi-device sync. Browser storage is not an encrypted medical-record vault. Do not enter real patient information into public source files or commit personal records, API keys, or passwords.
