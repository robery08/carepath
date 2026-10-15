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
- **Scan & Understand** — capture a photo or choose an image/PDF, extract selectable PDF text or run English/Kannada OCR in the browser, review/edit the extraction, and save the original plus notes in this browser's IndexedDB. Scanned PDF OCR is limited to eight pages per run.
- **Safety Check & Safety Alerts** — review completeness, repeated names, missing details, and questions for a pharmacist.
- **Health Tracker, Trends, Timeline & Calendar** — organize long-term BP, glucose, and other readings, with symptom notes included in the date-based history.
- **Everyday Health Guide** — practical starting points for hypertension, diabetes, cancer-treatment support, regular medicines, and short-lived cold symptoms, with links to WHO, NCI, and NHS resources.
- **CAREPATH Quick Tour** — a short visual walkthrough with captions, an English/Kannada transcript, and optional browser text-to-speech narration. It is an in-app guided tour, not an AI-generated video.
- **Learn with your own audio/video** — play a short local clip, add/paste a transcript or WebVTT captions, search for matching caption lines in English/Kannada, jump to a timestamp, and read matching lines aloud. The clip and captions stay in browser memory; CAREPATH does not listen to the clip, upload it, or generate medical AI answers.
- **Use CAREPATH on another device** — Settings can request a local app installation or copy the public app link. Personal records remain local and do not sync across devices.
- **Care Guide** — structured English/Kannada cards for diabetes and blood sugar, high blood pressure, cancer-treatment support, and everyday medicine safety. The general guides are available in the app without Gemini or a network request.
- **Symptom Guide** — a four-step English/Kannada note builder with optional browser voice input and read-aloud. It saves what a person reports locally and makes the note available in the timeline, visit brief, and explicitly selected caregiver export. It does not diagnose, triage urgency, interpret readings, or recommend treatment.
- **Visit Prep** — prepare a checklist, saved snapshot, symptom-note summary, and questions for an appointment.
- **Care Circle & Emergency ID** — keep optional health details, doctor and pharmacy numbers, and trusted-contact information close by. Call and message buttons open your device's apps after you choose them.
- **Health Map** — search pharmacies, medical stores, and hospitals in a typed area or with a one-time location request. CAREPATH sends a location to Google Maps only after you open a search; map results do not verify stock or quality.
- **CAREPATH Easy Mode** — larger controls and clearer text, saved as a local preference.
- **Start Guide** — first-use tour buttons open the actual medicine, scan, reminder, and emergency workflows.
- **Tell CAREPATH** — optional browser speech input for navigation shortcuts, plus typed fallback. Commands are reviewed before use; confirming a dose note is a separate step.
- **Voice on/off and Read aloud** — turn voice features off globally, listen to a page or chosen section, pick English/Kannada, and adjust reading speed. Browser support and available voices vary.
- **Voice-assisted health readings** — dictate a measurement in English or Kannada, review the transcript, manually confirm the filled numbers, then explicitly save. It never saves directly from speech.
- **Medicine reminders** — daily local time notes with optional browser notifications, vibration, and sound where supported.
- **Expiry watch and missed-dose guide** — optional package expiry notes, rough stock watch, and a source-first missed-dose flow that never suggests an extra dose.
- **Lab/test explainer and report trends** — save values copied from reports, review them by date, include them in the timeline and visit brief, and use a clearly fictitious example trend. CAREPATH never interprets results or reference ranges.
- **ASK CAREPATH** — English/Kannada reviewed guides for common symptoms and conditions, safe next steps, source links, and read-aloud; common English misspellings can still match. Unknown medicine names can be looked up inside the app through the U.S. NIH MedlinePlus Connect service after the user consents to send only the medicine name. This is general information, not a complete worldwide medicine catalogue, local approval check, diagnosis, or dose recommendation.
- **Admin Preview / Content Studio** — create drafts for sourced medicine, condition, and self-care learning cards; review and publish them to the local guide; inspect a local audit history and restore a previous published snapshot. These edits are browser-local and do not update other visitors or the GitHub deployment.
- **Official Sources** — an optional, separate source search filtered toward official medicine regulators by selected country. It opens Google only after the user explicitly confirms; saved medicines, readings, and profile details are never attached.
- **Installable offline app** — a web app manifest and service worker cache the compact app shell; large optional document-reader assets cache when used. Install where the browser supports it; health notes use this browser’s local storage.
- **Privacy controls** — local last-saved status, JSON export for the localStorage record and visit brief, separate original-document downloads, and an explicit control to delete localStorage and IndexedDB records.

## Demo, privacy, and safety limits

CAREPATH is a personal organizer and project demo, not a clinical decision-support tool. Starter medicines and readings are illustrative. Document OCR runs in the browser using OCR code and an English/Kannada language model that may need to download the first time; uploaded files and extracted text are not sent to Gemini or a CAREPATH server. OCR can misread medicine names, strengths, decimal points, and handwriting. Verify extracted text against the original. Originals and extraction notes are saved locally in IndexedDB only when the user chooses Save. The Safety Check reviews saved fields only; it does not check interactions, suitability, or diagnose a problem. CAREPATH never prescribes or chooses a medicine. ASK CAREPATH uses curated offline symptom guides and an optional MedlinePlus medicine-name lookup; it is not Gemini or a live AI service and cannot answer every question. The symptom question and saved records stay in the browser. If the user chooses the live medicine lookup, only the medicine name is sent to U.S. NIH MedlinePlus; results are general English information and do not confirm a local product or approval. Unknown health topics can be searched on MedlinePlus only after the user chooses that external link. Official Sources may open Google only after explicit confirmation and sends only the typed search text, not the local health record. The linked sources are general education, not personal medical advice.

The medicine-purpose cards are a small, curated starting set, not an all-world catalogue. The purpose of an ingredient does not confirm why it was prescribed to a person, whether their exact product matches, or whether it is appropriate for them. The cold comfort guide offers general measures such as rest and fluids; it does not promise faster recovery or a cure. Follow the source and local product label, and ask a pharmacist or clinician about personal medicine decisions.

The Admin Preview is intentionally not represented as a secure admin login: this static frontend has no authentication, roles, shared database, or server-side audit trail. Anyone who opens the public page can open the preview and edit only local browser storage. Do not use it to publish clinical content for other users. The requested owner-controlled sign-in, approval before sharing access, three-device session cap, remote logout/revocation, shared updates, and audit history are not implemented. They require a protected backend with verified sign-in, server-enforced roles and session records, content review, shared versioned data, and audit logging.

The optional medicine supply estimate uses only the remaining count and units-per-day rate entered by the user. It is a rough arithmetic estimate, not a dose or schedule recommendation; verify both values against current instructions. There is no single complete, current, official database of every medicine sold worldwide, so CAREPATH links to country-specific sources and does not claim global completeness.

This static GitHub Pages app does not make Gemini API calls and stores no AI key in its frontend. A live AI answering service would require a separately deployed secure server endpoint and a carefully limited health-information policy; do not add an API key to public client-side code.

Voice recognition support varies by browser. Some browser speech-recognition services send audio to their service for processing; CAREPATH does not save audio or transcripts. Read-aloud uses the browser’s speech synthesis.

Reminder times are daily personal notes. The in-page timer works only while CAREPATH remains open and running. Browser notifications require your explicit permission and depend on the browser and device. A closed or suspended browser may not deliver a reminder; CAREPATH is not a guaranteed alarm service. Verify every time and instruction against the current medicine package or prescription. For a missed dose, check that source or ask a pharmacist; do not take an extra dose unless a qualified professional tells you to.

This demo stores profile, medicine, symptom, health notes, and admin-preview content in local browser storage, and document binaries in local IndexedDB, without an account, encryption layer, server sync, or live caregiver sharing. The JSON record export does not contain document binaries; download originals from Scan & Understand separately. Voice input may use browser services as described above. Clearing browser data can remove the local record. Do not rely on this demo as your only copy of clinical records. In an emergency, contact local emergency services directly.

## Publish a web version

CAREPATH is a static Vite app and can be hosted on GitHub Pages. This repository is configured for the project site at `https://robery08.github.io/carepath/`. The GitHub Actions workflow builds the app and publishes the `dist` folder whenever code is pushed to `main`.

For a static GitHub Pages deployment, open **Settings → Pages** in the GitHub repository and set **Build and deployment → Source** to **GitHub Actions**. A static Cloudflare Pages project can use `npm run build` as the build command and `dist` as the output directory. Neither host needs a medical AI API key for the current version. The local organizer and saved guides work offline after the first load; web searches, map lookups, calls, and messages need a network or device service.

Publishing makes the website available to anyone with the link, and the source repository is public. Visitors' medicine and health notes stay in their own browser storage; this version has no account, shared family records, server backup, or multi-device sync. Browser storage is not an encrypted medical-record vault. Do not enter real patient information into public source files or commit personal records, API keys, or passwords.

