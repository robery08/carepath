import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  Accessibility,
  AlertTriangle,
  ArrowRight,
  Bell,
  BellRing,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileCheck2,
  HeartPulse,
  Home,
  Info,
  Menu,
  Mic,
  Pill,
  Plus,
  ScanLine,
  Search,
  Settings,
  ShieldCheck,
  Siren,
  Stethoscope,
  Users,
  Volume2,
  X,
} from "lucide-react";

const CarePathModules = lazy(() => import("./components/CarePathModules"));
const HealthMonitor = lazy(() => import("./components/HealthMonitor"));
const MedicineCenter = lazy(() => import("./components/MedicineCenter"));

type Medicine = {
  id: string;
  name: string;
  strength: string;
  form: string;
  schedule: string;
  instructions: string;
  remainingUnits?: number;
  unitsPerDay?: number;
};

type HealthReading = {
  id: string;
  metric: string;
  value: number;
  secondValue?: number;
  unit: string;
  date: string;
  time: string;
  note: string;
};

type MedicationEvent = { id: string; medicine: string; time: string; date: string; status: "Taken" | "Skipped" };
type Reminder = { id: string; medicineId: string; name: string; time: string; enabled: boolean; lastFiredDate?: string };

type SpeechResultEvent = Event & { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechWindow = Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const navItems = [
  { name: "Home", icon: Home },
  { name: "Medicine Finder", icon: Search },
  { name: "My Medicines", icon: Pill },
  { name: "Medicine Passport", icon: FileCheck2 },
  { name: "Scan & Upload", icon: ScanLine },
  { name: "Safety Check", icon: ShieldCheck },
  { name: "Health Tracker", icon: HeartPulse },
  { name: "Health Timeline", icon: Clock3 },
  { name: "Health Calendar", icon: CalendarDays },
  { name: "Health Map", icon: Activity },
  { name: "Tests & Reports", icon: ClipboardList },
  { name: "Visit Prep", icon: Stethoscope },
  { name: "Care Circle", icon: Users },
  { name: "Safety Alerts", icon: AlertTriangle },
  { name: "Learn", icon: BookOpen },
];

const SAMPLE_MEDICINES: Medicine[] = [
  { id: "2", name: "Amlodipine", strength: "5 mg", form: "Tablet", schedule: "8:00 AM", instructions: "Morning" },
  { id: "3", name: "Atorvastatin", strength: "10 mg", form: "Tablet", schedule: "10:00 PM", instructions: "Night" },
  { id: "4", name: "Metformin", strength: "500 mg", form: "Tablet", schedule: "1:00 PM", instructions: "After food" },
];

function getToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getDateOffset(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const SAMPLE_READINGS: HealthReading[] = [
  { id: "demo-1", metric: "Blood Pressure", value: 128, secondValue: 82, unit: "mmHg", date: getDateOffset(0), time: "08:30", note: "Morning reading" },
  { id: "demo-2", metric: "Blood Pressure", value: 124, secondValue: 80, unit: "mmHg", date: getDateOffset(-1), time: "08:20", note: "Morning reading" },
  { id: "demo-3", metric: "Blood Pressure", value: 130, secondValue: 84, unit: "mmHg", date: getDateOffset(-2), time: "08:45", note: "Morning reading" },
  { id: "demo-4", metric: "Blood Pressure", value: 126, secondValue: 81, unit: "mmHg", date: getDateOffset(-3), time: "09:00", note: "Morning reading" },
  { id: "demo-5", metric: "Blood Glucose", value: 96, unit: "mg/dL", date: getDateOffset(0), time: "07:45", note: "Fasting" },
  { id: "demo-6", metric: "Pulse", value: 74, unit: "bpm", date: getDateOffset(0), time: "08:35", note: "Resting" },
  { id: "demo-7", metric: "SpO₂", value: 98, unit: "%", date: getDateOffset(0), time: "08:40", note: "Resting" },
  { id: "demo-8", metric: "Temperature", value: 36.7, unit: "°C", date: getDateOffset(0), time: "08:42", note: "Morning" },
  { id: "demo-9", metric: "Weight", value: 68.4, unit: "kg", date: getDateOffset(0), time: "07:30", note: "Morning" },
];

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [active, setActive] = useState("Home");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showMedicines, setShowMedicines] = useState(false);
  const [showHealthMonitor, setShowHealthMonitor] = useState(false);
  const [medicineCount, setMedicineCount] = useState(() => readStored<Medicine[]>("carepath_medicines", SAMPLE_MEDICINES).length);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [easyMode, setEasyMode] = useState(() => readStored<boolean>("carepath_easy_mode", false));
  const [showGuide, setShowGuide] = useState(() => !readStored<boolean>("carepath_start_guide_complete", false));
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const [listening, setListening] = useState(false);
  const [confirmDose, setConfirmDose] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>(() => readStored<Reminder[]>("carepath_reminders", []));
  const [dueReminder, setDueReminder] = useState<Reminder | null>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const medicines = useMemo(() => readStored<Medicine[]>("carepath_medicines", SAMPLE_MEDICINES), [medicineCount, refresh]);
  const healthReadings = useMemo(() => readStored<HealthReading[]>("carepath_health_readings", SAMPLE_READINGS), [refresh]);
  const profile = useMemo(() => readStored<{ name?: string; allergies?: string }>("carepath_profile", {}), [refresh]);
  const name = profile.name?.trim() || "Demo User";

  const refreshApp = useCallback(() => setRefresh((current) => current + 1), []);
  useEffect(() => {
    const updateLocalSnapshot = () => {
      setRefresh((current) => current + 1);
      setMedicineCount(readStored<Medicine[]>("carepath_medicines", SAMPLE_MEDICINES).length);
    };
    window.addEventListener("carepath:refresh", updateLocalSnapshot);
    return () => window.removeEventListener("carepath:refresh", updateLocalSnapshot);
  }, []);
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const today = getToday();
      const due = reminders.filter((reminder) => reminder.enabled && reminder.time === time && reminder.lastFiredDate !== today);
      if (!due.length) return;
      const firedIds = new Set(due.map((reminder) => reminder.id));
      const updated = reminders.map((reminder) => firedIds.has(reminder.id) ? { ...reminder, lastFiredDate: today } : reminder);
      try { localStorage.setItem("carepath_reminders", JSON.stringify(updated)); } catch { /* The in-app reminder still appears for this session. */ }
      setReminders(updated);
      setDueReminder(due[0]);
      if (document.visibilityState === "hidden" && "Notification" in window && Notification.permission === "granted" && "serviceWorker" in navigator) {
        void navigator.serviceWorker.ready.then((registration) => Promise.all(due.map((reminder) => registration.showNotification("CAREPATH reminder", { body: `${reminder.name} · ${reminder.time}. Check your current instructions.`, icon: `${import.meta.env.BASE_URL}favicon.svg`, tag: reminder.id })))).catch(() => { /* Browser notifications are optional; the in-app reminder remains available. */ });
      }
      try { if (navigator.vibrate) navigator.vibrate([180, 90, 180]); } catch { /* Vibration is optional and device-specific. */ }
      if (readStored<boolean>("carepath_reminder_sound", false)) {
        try {
          const AudioContextConstructor = window.AudioContext;
          if (AudioContextConstructor) {
            const context = new AudioContextConstructor();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.frequency.value = 740;
            gain.gain.value = 0.045;
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.22);
            oscillator.onended = () => { void context.close(); };
          }
        } catch { /* Device audio policies may block background sound. */ }
      }
    };
    checkReminders();
    const timer = window.setInterval(checkReminders, 15_000);
    return () => window.clearInterval(timer);
  }, [reminders]);
  useEffect(() => {
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
  }, []);
  const onCountChange = useCallback((count: number) => setMedicineCount(count), []);
  const openSection = (section: string) => {
    setActive(section);
    setMobileMenu(false);
    setQuery("");
    if (section === "My Medicines") setShowMedicines(true);
  };
  const openMonitor = () => {
    setActive("Health Tracker");
    setShowHealthMonitor(true);
  };
  const saveReminders = (next: Reminder[]) => {
    setReminders(next);
    try { localStorage.setItem("carepath_reminders", JSON.stringify(next)); } catch { setNotice("This browser could not save your reminder settings."); }
  };
  const finishGuide = () => {
    setShowGuide(false);
    try { localStorage.setItem("carepath_start_guide_complete", "true"); } catch { /* Keep the guide usable when storage is unavailable. */ }
  };
  const readAloud = (text?: string) => {
    if (!("speechSynthesis" in window)) { setNotice("Read aloud is not available in this browser."); return; }
    window.speechSynthesis.cancel();
    const content = text || document.querySelector(".content")?.textContent || "Welcome to CAREPATH. Your personal health organizer.";
    const utterance = new SpeechSynthesisUtterance(content.replace(/\s+/g, " ").slice(0, 1800));
    utterance.rate = easyMode ? 0.86 : 0.98;
    window.speechSynthesis.speak(utterance);
  };
  const installApp = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (result.outcome === "accepted") setNotice("CAREPATH is being added to your device.");
    } catch { setNotice("Use your browser menu to install CAREPATH on this device."); }
  };
  const startVoice = () => {
    setVoiceOpen(true);
    setVoiceText("");
    setVoiceStatus("");
    const Speech = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
    if (!Speech) { setVoiceStatus("Voice input is not supported here. Type a command below, or use the large quick-action buttons."); return; }
    try {
      const recognition = new Speech();
      recognition.lang = navigator.language || "en-US";
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript || "";
        setVoiceText(transcript);
        setVoiceStatus("I heard this. Review it, then choose Use command.");
        setListening(false);
      };
      recognition.onerror = () => { setListening(false); setVoiceStatus("I couldn’t hear that clearly. Try again or type a short command."); };
      recognition.onend = () => setListening(false);
      setListening(true);
      setVoiceStatus("Listening… Speak a short command.");
      recognition.start();
    } catch {
      setListening(false);
      setVoiceStatus("Microphone input could not start. Type a command or choose a quick action.");
    }
  };
  const handleVoiceCommand = (raw: string) => {
    const command = raw.toLowerCase().trim();
    setVoiceOpen(false);
    setVoiceStatus("");
    if (/\b(read this|read aloud|read to me|speak this|explain this)\b/.test(command)) { readAloud(); return; }
    if (/\b(emergency|help me|emergency help)\b/.test(command)) { openSection("Emergency Help"); return; }
    if (/\b(scan|camera|photo|what medicine is this|identify medicine)\b/.test(command)) { openSection("Scan & Upload"); return; }
    if (/\b(add|new) medicine\b/.test(command)) { openSection("My Medicines"); setShowMedicines(true); return; }
    if (/\b(visit|doctor|appointment|prepare)\b/.test(command)) { openSection("Visit Prep"); return; }
    if (/\b(blood pressure|glucose|reading|health tracker|show my health)\b/.test(command)) { openSection("Health Tracker"); return; }
    if (/\b(forgot|missed|forget)\b/.test(command) && /medicine|dose|pill/.test(command)) {
      openSection("Safety Alerts");
      setNotice("If a dose was missed, check the current package or prescription instructions, or ask a pharmacist. Don’t take an extra dose unless a qualified professional tells you to.");
      readAloud("If you missed a dose, check the current package or prescription instructions, or ask a pharmacist. Do not take an extra dose unless a qualified professional tells you to.");
      return;
    }
    if (/\b(took|taken|taked)\b/.test(command) && /medicine|dose|pill/.test(command)) { setConfirmDose(true); return; }
    if (/\b(next|when)\b/.test(command) && /medicine|dose|pill/.test(command)) {
      const now = new Date();
      const next = reminders.filter((reminder) => reminder.enabled).map((reminder) => {
        const [hours, minutes] = reminder.time.split(":").map(Number);
        const at = new Date(now);
        at.setHours(hours || 0, minutes || 0, 0, 0);
        if (at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1);
        return { ...reminder, at };
      }).sort((a, b) => a.at.getTime() - b.at.getTime())[0];
      const when = next?.at.toDateString() === now.toDateString() ? "today" : "tomorrow";
      const answer = next ? `Your next saved reminder for ${next.name} is ${when} at ${next.time}. Please confirm timing with the current prescription.` : "You have no CAREPATH reminders set up. Open reminders to create a personal time note from your current instructions.";
      setNotice(answer); readAloud(answer); return;
    }
    if (/\b(show|list|my)\b/.test(command) && /medicine|medication|pills/.test(command)) { openSection("Medicine Passport"); return; }
    if (/remind|reminder/.test(command)) { setShowReminders(true); return; }
    openSection("Medicine Finder");
    setNotice("Try: show my medicines, scan a document, log a reading, prepare a visit, or read this to me.");
  };
  const markDose = (medicine: Medicine) => {
    const current = readStored<MedicationEvent[]>("carepath_medication_log", []);
    const now = new Date();
    const event: MedicationEvent = {
      id: `dose-${Date.now()}`,
      medicine: `${medicine.name} ${medicine.strength}`,
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: getToday(),
      status: "Taken",
    };
    try {
      localStorage.setItem("carepath_medication_log", JSON.stringify([event, ...current]));
      setNotice("Dose note saved on this device. Follow your current prescription instructions.");
      window.setTimeout(() => setNotice(""), 3600);
      refreshApp();
    } catch {
      setNotice("This browser could not save the note. Check available device storage.");
    }
  };

  const results = query.trim()
    ? [
        ...navItems.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).map((item) => ({ label: item.name, detail: "Open CAREPATH workspace", action: () => openSection(item.name), icon: item.icon })),
        ...medicines.filter((item) => `${item.name} ${item.strength}`.toLowerCase().includes(query.toLowerCase())).slice(0, 4).map((item) => ({ label: item.name, detail: `${item.strength} · ${item.form}`, action: () => openSection("Medicine Passport"), icon: Pill })),
      ].slice(0, 7)
    : [];

  return (
    <div className={`carepath-app${easyMode ? " cp-easy-mode" : ""}`}>
      <a className="cp-skip-link" href="#carepath-main">Skip to main content</a>
      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-logo"><HeartPulse size={25} /></div>
          <div className="brand-copy"><h1>CarePath</h1><span>Your Everyday Health Companion</span></div>
          <button className="close-menu" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={20} /></button>
        </div>
        <div className="cp-sidebar-caption">YOUR CARE WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = active === item.name || (active === "Medicine Passport" && item.name === "My Medicines");
            return <button key={item.name} className={`nav-item ${selected ? "active" : ""}`} onClick={() => openSection(item.name)} aria-current={selected ? "page" : undefined}><Icon size={18} /><span>{item.name}</span>{item.name === "Safety Alerts" && !profile.allergies?.trim() && <span className="cp-nav-dot" />}</button>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <button className={`emergency-nav ${active === "Emergency Help" ? "selected" : ""}`} onClick={() => openSection("Emergency Help")}><Siren size={18} /><span>Emergency Help</span><ArrowRight size={14} /></button>
          <button className={`nav-item ${active === "Settings" ? "active" : ""}`} onClick={() => openSection("Settings")}><Settings size={18} /><span>Settings & Privacy</span></button>
          <div className="cp-offline-note"><span /> Saved locally on this device</div>
        </div>
      </aside>

      {mobileMenu && <button aria-label="Close menu overlay" className="mobile-overlay" onClick={() => setMobileMenu(false)} />}

        <main className="main" id="carepath-main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu size={22} /></button>
          <div className="search cp-search-wrap">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setQuery(""); if (event.key === "Enter" && results[0]) results[0].action(); }} placeholder="Search your CAREPATH workspace…" aria-label="Search medicines and sections" />
            <span className="search-shortcut">/</span>
            {results.length > 0 && <div className="cp-search-results">{results.map((result, index) => { const Icon = result.icon; return <button key={`${result.label}-${index}`} onClick={result.action}><span><Icon size={17} /></span><span><strong>{result.label}</strong><small>{result.detail}</small></span><ChevronRight size={15} /></button>; })}</div>}
          </div>
          <div className="top-actions">
            <span className="cp-device-status"><i /> Local workspace</span>
            <button className="icon-button notification-button" aria-label="Review safety notes" onClick={() => openSection("Safety Alerts")}><Bell size={19} /><span className="notification-dot">!</span></button>
            <button className="cp-user-button" onClick={() => openSection("Care Circle")} aria-label="Open my care profile"><span className="avatar">{name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "CP"}</span><span className="user-mini"><strong>{name}</strong><small>CAREPATH ID</small></span></button>
          </div>
        </header>

        <section className="content">
          <div className="cp-accessibility-bar" aria-label="Accessibility and quick help">
            <button className={easyMode ? "selected" : ""} aria-pressed={easyMode} onClick={() => { const next = !easyMode; setEasyMode(next); try { localStorage.setItem("carepath_easy_mode", JSON.stringify(next)); } catch { /* Optional preference. */ } }}><Accessibility size={17} /><span>{easyMode ? "Easy mode on" : "Easy mode"}</span></button>
            <button onClick={startVoice}><Mic size={17} /><span>Tell CAREPATH</span></button>
            <button onClick={() => readAloud()}><Volume2 size={17} /><span>Read this to me</span></button>
            <button onClick={() => setShowReminders(true)}><BellRing size={17} /><span>Reminders{reminders.filter((item) => item.enabled).length ? ` · ${reminders.filter((item) => item.enabled).length}` : ""}</span></button>
            {installPrompt && <button onClick={() => void installApp()}><Plus size={17} /><span>Install app</span></button>}
            <button onClick={() => setShowGuide(true)}><BookOpen size={17} /><span>Show me how</span></button>
          </div>
          {active === "Home" ? <HomeDashboard name={name} medicines={medicines} readings={healthReadings} allergies={profile.allergies || ""} onNavigate={openSection} onOpenMonitor={openMonitor} onMarkDose={markDose} /> : <>
            <div className="cp-route-topline"><button onClick={() => openSection("Home")}><Home size={14} /> Home</button><ChevronRight size={13} /><span>{active}</span></div>
            <Suspense fallback={<ModuleLoading />}><CarePathModules active={active} medicineCount={medicineCount} onOpenMedicines={() => setShowMedicines(true)} onOpenMonitor={openMonitor} onNavigate={openSection} /></Suspense>
          </>}
          <footer className="cp-app-footer"><div><strong>CAREPATH</strong><span>Your health information. Your control.</span></div><span>Personal organization tool · Verify health details with a qualified professional.</span></footer>
        </section>
      </main>

      {notice && <div className="cp-toast" role="status"><Check size={16} />{notice}</div>}
      {showGuide && <StartGuide onClose={finishGuide} onNavigate={(section) => { finishGuide(); if (section === "__reminders") { setShowReminders(true); return; } openSection(section); if (section === "My Medicines") setShowMedicines(true); }} />}
      {voiceOpen && <VoiceDialog text={voiceText} status={voiceStatus} listening={listening} onText={setVoiceText} onListen={startVoice} onUse={() => handleVoiceCommand(voiceText)} onClose={() => setVoiceOpen(false)} />}
      {confirmDose && <DoseConfirm medicines={medicines} onCancel={() => setConfirmDose(false)} onConfirm={(medicine) => { setConfirmDose(false); markDose(medicine); }} />}
      {showReminders && <ReminderCenter medicines={medicines} reminders={reminders} onSave={saveReminders} onClose={() => setShowReminders(false)} />}
      {dueReminder && <div className="cp-reminder-toast" role="alert"><div className="cp-reminder-toast-icon"><BellRing size={22} /></div><div><strong>Time for your reminder</strong><p>{dueReminder.name} · {dueReminder.time}</p><small>Check your current package or prescription before acting.</small></div><button onClick={() => { markDose(medicines.find((medicine) => medicine.id === dueReminder.medicineId) || { id: dueReminder.medicineId, name: dueReminder.name, strength: "", form: "", schedule: dueReminder.time, instructions: "" }); setDueReminder(null); }}>Log note</button><button aria-label="Dismiss reminder" onClick={() => setDueReminder(null)}><X size={16} /></button></div>}
      <Suspense fallback={<ModuleLoading overlay />}>
        {showMedicines && <MedicineCenter onClose={() => { setShowMedicines(false); refreshApp(); }} onCountChange={onCountChange} />}
        {showHealthMonitor && <HealthMonitor onClose={() => { setShowHealthMonitor(false); refreshApp(); }} />}
      </Suspense>
    </div>
  );
}

function StartGuide({ onClose, onNavigate }: { onClose: () => void; onNavigate: (section: string) => void }) {
  const steps = [
    { title: "Save a medicine", text: "Record what is written on your current package or prescription. CAREPATH won’t choose a dose for you.", action: "Open My Medicines", route: "My Medicines", icon: <Pill size={22} /> },
    { title: "Capture a document", text: "Use your phone camera or choose a photo/PDF. The demo keeps a review note; it does not read the document automatically.", action: "Open Scan & Upload", route: "Scan & Upload", icon: <ScanLine size={22} /> },
    { title: "Set a personal reminder", text: "Add a time from your existing instructions. Reminders only run while CAREPATH is open.", action: "Open reminders", route: "__reminders", icon: <BellRing size={22} /> },
    { title: "Keep urgent details nearby", text: "Add a trusted contact and review your emergency card. In an emergency, contact local services directly.", action: "Open Emergency Help", route: "Emergency Help", icon: <Siren size={22} /> },
  ];
  return <div className="cp-modal-backdrop" role="presentation"><section className="cp-guide-modal" role="dialog" aria-modal="true" aria-labelledby="cp-guide-title"><button className="cp-modal-close" onClick={onClose} aria-label="Close start guide"><X size={19} /></button><span className="cp-eyebrow">A SHORT, HANDS-ON TOUR</span><h2 id="cp-guide-title">Welcome to your CAREPATH</h2><p className="cp-guide-intro">Choose a first step. Each button opens the real workspace so you can try it when you’re ready.</p><div className="cp-guide-modal-grid">{steps.map((step, index) => <button key={step.title} onClick={() => onNavigate(step.route)}><span className="cp-guide-modal-icon">{step.icon}</span><small>STEP 0{index + 1}</small><strong>{step.title}</strong><p>{step.text}</p><em>{step.action}<ArrowRight size={14} /></em></button>)}</div><div className="cp-guide-modal-footer"><span>Demo information is illustrative. Verify medicine details with their source.</span><button className="cp-button primary" onClick={onClose}>Start exploring <ArrowRight size={15} /></button></div></section></div>;
}

function VoiceDialog({ text, status, listening, onText, onListen, onUse, onClose }: { text: string; status: string; listening: boolean; onText: (text: string) => void; onListen: () => void; onUse: () => void; onClose: () => void }) {
  const examples = ["Show my medicines", "I took my medicine", "I forgot a dose", "Prepare my doctor visit", "Read this to me"];
  return <div className="cp-modal-backdrop" role="presentation"><section className="cp-voice-modal" role="dialog" aria-modal="true" aria-labelledby="cp-voice-title"><button className="cp-modal-close" onClick={onClose} aria-label="Close voice help"><X size={19} /></button><div className={`cp-voice-orb${listening ? " listening" : ""}`}><Mic size={29} /></div><span className="cp-eyebrow">VOICE-FIRST SHORTCUTS</span><h2 id="cp-voice-title">Tell CAREPATH</h2><p>Try a short command. You can review the words before CAREPATH opens anything or saves a dose note.</p><button className="cp-button primary cp-voice-listen" onClick={onListen} disabled={listening}><Mic size={17} />{listening ? "Listening…" : "Start listening"}</button><label className="cp-voice-field">Your words<textarea value={text} onChange={(event) => onText(event.target.value)} rows={2} placeholder="Or type: show my medicines" /></label><p className="cp-voice-status" aria-live="polite">{status || "Commands: medicines, scan, readings, reminders, visit prep, emergency help, or read this aloud."}</p><div className="cp-voice-examples">{examples.map((example) => <button key={example} onClick={() => onText(example)}>{example}</button>)}</div><div className="cp-voice-privacy"><Info size={15} /> Voice recognition depends on your browser; some browsers send audio to their recognition service. CAREPATH does not save audio or transcripts.</div><div className="cp-guide-modal-footer"><button className="cp-button quiet" onClick={onClose}>Cancel</button><button className="cp-button primary" onClick={onUse} disabled={!text.trim()}>Use command <ArrowRight size={15} /></button></div></section></div>;
}

function DoseConfirm({ medicines, onCancel, onConfirm }: { medicines: Medicine[]; onCancel: () => void; onConfirm: (medicine: Medicine) => void }) {
  const [selected, setSelected] = useState(medicines[0]?.id || "");
  return <div className="cp-modal-backdrop" role="presentation"><section className="cp-dose-modal" role="dialog" aria-modal="true" aria-labelledby="cp-dose-title"><button className="cp-modal-close" onClick={onCancel} aria-label="Close dose confirmation"><X size={19} /></button><span className="cp-guide-modal-icon"><Check size={22} /></span><span className="cp-eyebrow">PERSONAL NOTE ONLY</span><h2 id="cp-dose-title">Which medicine did you take?</h2><p>Choose one to save a time-stamped note. CAREPATH cannot confirm a dose or change your prescription.</p>{medicines.length ? <div className="cp-dose-options">{medicines.map((medicine) => <label key={medicine.id}><input type="radio" name="voice-dose" value={medicine.id} checked={selected === medicine.id} onChange={() => setSelected(medicine.id)} /><span><strong>{medicine.name}</strong><small>{medicine.strength} · {medicine.schedule || "No time note"}</small></span></label>)}</div> : <p>No medicines are saved yet. Add details from your current source first.</p>}<div className="cp-guide-modal-footer"><button className="cp-button quiet" onClick={onCancel}>Cancel</button><button className="cp-button primary" disabled={!medicines.length} onClick={() => { const medicine = medicines.find((item) => item.id === selected); if (medicine) onConfirm(medicine); }}>Save dose note</button></div></section></div>;
}

function ReminderCenter({ medicines, reminders, onSave, onClose }: { medicines: Medicine[]; reminders: Reminder[]; onSave: (next: Reminder[]) => void; onClose: () => void }) {
  const [medicineId, setMedicineId] = useState(medicines[0]?.id || "");
  const [time, setTime] = useState("08:00");
  const [message, setMessage] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(() => readStored<boolean>("carepath_reminder_sound", false));
  const add = () => {
    const medicine = medicines.find((item) => item.id === medicineId);
    if (!medicine) { setMessage("Add a medicine first, using your current prescription or package."); return; }
    const next = [...reminders, { id: `rem-${Date.now()}`, medicineId, name: medicine.name, time, enabled: true }];
    onSave(next);
    setMessage("Reminder saved on this device.");
  };
  const allowNotifications = async () => {
    if (!("Notification" in window)) { setMessage("This browser does not support notifications. CAREPATH can still show reminders while open."); return; }
    try { const permission = await Notification.requestPermission(); setMessage(permission === "granted" ? "Browser notifications are enabled for this device." : "Notifications were not enabled. In-app reminders still work while CAREPATH is open."); }
    catch { setMessage("Notifications could not be enabled here. In-app reminders still work while CAREPATH is open."); }
  };
  const update = (id: string, patch: Partial<Reminder>) => onSave(reminders.map((item) => item.id === id ? { ...item, ...patch } : item));
  return <div className="cp-modal-backdrop" role="presentation"><section className="cp-reminder-modal" role="dialog" aria-modal="true" aria-labelledby="cp-reminder-title"><button className="cp-modal-close" onClick={onClose} aria-label="Close reminders"><X size={19} /></button><span className="cp-guide-modal-icon"><BellRing size={22} /></span><span className="cp-eyebrow">PERSONAL TIME NOTES</span><h2 id="cp-reminder-title">Medicine reminders</h2><p>Set a daily reminder time copied from your current instructions. It only runs while this page is open; it is not a background alarm or clinical instruction.</p><div className="cp-reminder-form"><label>Medicine<select value={medicineId} onChange={(event) => setMedicineId(event.target.value)}>{medicines.length ? medicines.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.strength}</option>) : <option value="">Add a medicine first</option>}</select></label><label>Reminder time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label><button className="cp-button primary" onClick={add}><Plus size={16} /> Add reminder</button></div>{message && <p className="cp-voice-status" role="status">{message}</p>}<div className="cp-reminder-list">{reminders.map((item) => <div key={item.id}><span><strong>{item.name}</strong><small>{item.time} · daily personal note</small></span><label className="cp-switch"><input type="checkbox" checked={item.enabled} onChange={(event) => update(item.id, { enabled: event.target.checked, lastFiredDate: undefined })} /><span>{item.enabled ? "On" : "Off"}</span></label><button aria-label={`Remove reminder for ${item.name}`} onClick={() => onSave(reminders.filter((reminder) => reminder.id !== item.id))}><X size={16} /></button></div>)}</div><div className="cp-reminder-actions"><button className="cp-button quiet" onClick={allowNotifications}><Bell size={16} /> Enable browser notifications</button><button className="cp-button quiet" aria-pressed={soundEnabled} onClick={() => { const next = !soundEnabled; setSoundEnabled(next); try { localStorage.setItem("carepath_reminder_sound", JSON.stringify(next)); } catch { /* Optional preference. */ } setMessage(next ? "Reminder sound enabled where the device permits it." : "Reminder sound disabled."); }}>Sound: {soundEnabled ? "On" : "Off"}</button></div><div className="cp-voice-privacy"><Info size={15} /> Notifications need your explicit browser permission. Timing varies by device; no reminder is guaranteed if the browser is closed.</div><div className="cp-guide-modal-footer"><button className="cp-button quiet" onClick={onClose}>Close</button></div></section></div>;
}

function HomeDashboard({ name, medicines, readings, allergies, onNavigate, onOpenMonitor, onMarkDose }: {
  name: string;
  medicines: Medicine[];
  readings: HealthReading[];
  allergies: string;
  onNavigate: (section: string) => void;
  onOpenMonitor: () => void;
  onMarkDose: (medicine: Medicine) => void;
}) {
  const today = getToday();
  const recent = readings.filter((reading) => reading.date <= today).slice().sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  const latest = new Map<string, HealthReading>();
  recent.forEach((reading) => { if (!latest.has(reading.metric)) latest.set(reading.metric, reading); });
  const selectedMedicine = medicines[0];
  const missingInfo = medicines.filter((medicine) => !medicine.schedule || !medicine.instructions).length;
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  const chart = recent.filter((reading) => reading.metric === "Blood Pressure").slice(0, 7).reverse().map((reading, index) => ({ day: reading.date === today ? "Today" : new Date(`${reading.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" }), systolic: reading.value, diastolic: reading.secondValue ?? 0, fallback: 128 + [0, 4, -2, 2, -4, 1, 0][index % 7] }));
  const sampleChart = chart.length ? chart : ["M", "T", "W", "T", "F", "S", "S"].map((day, index) => ({ day, systolic: 0, diastolic: 0, fallback: [128, 132, 126, 130, 124, 129, 128][index] }));
  const bp = latest.get("Blood Pressure");
  const glucose = latest.get("Blood Glucose");
  const pulse = latest.get("Pulse");
  const weight = latest.get("Weight");
  const temp = latest.get("Temperature");
  const metrics = [
    { name: "Blood pressure", value: bp ? `${bp.value} / ${bp.secondValue ?? "—"}` : "No reading", unit: bp?.unit || "mmHg", note: bp ? `${bp.id.startsWith("demo-") ? "Example" : bp.date === today ? "Today" : bp.date} · ${bp.time}` : "Add your first entry", tone: "teal", icon: <HeartPulse size={17} /> },
    { name: "Blood glucose", value: glucose ? String(glucose.value) : "No reading", unit: glucose?.unit || "mg/dL", note: glucose ? `${glucose.id.startsWith("demo-") ? "Example" : glucose.date === today ? "Today" : glucose.date} · ${glucose.note || glucose.time}` : "Add your first entry", tone: "amber", icon: <Activity size={17} /> },
    { name: "Pulse", value: pulse ? String(pulse.value) : "No reading", unit: pulse?.unit || "bpm", note: pulse ? `${pulse.id.startsWith("demo-") ? "Example" : pulse.date === today ? "Today" : pulse.date} · ${pulse.time}` : "Add your first entry", tone: "blue", icon: <HeartPulse size={17} /> },
    { name: "Temperature", value: temp ? String(temp.value) : "No reading", unit: temp?.unit || "°C", note: temp ? `${temp.id.startsWith("demo-") ? "Example" : temp.date === today ? "Today" : temp.date} · ${temp.time}` : "Add your first entry", tone: "violet", icon: <Activity size={17} /> },
    { name: "Weight", value: weight ? String(weight.value) : "No reading", unit: weight?.unit || "kg", note: weight ? `${weight.id.startsWith("demo-") ? "Example" : weight.date === today ? "Today" : weight.date} · ${weight.time}` : "Add your first entry", tone: "green", icon: <Activity size={17} /> },
  ];
  return <>
    <section className="cp-home-hero">
      <div className="cp-home-hero-copy"><span className="cp-hero-kicker"><span /> YOUR PERSONAL HEALTH SPACE</span><h1>{greeting}, <span>{name}</span></h1><p>Bring your medicines, health notes, and care questions together in one calm place.</p><div className="cp-hero-buttons"><button className="cp-button light" onClick={() => onNavigate("My Medicines")}><Plus size={16} /> Add medicine</button><button className="cp-button glass" onClick={() => onNavigate("Medicine Finder")}><Search size={16} /> Find trusted info</button></div><div className="cp-hero-assurance"><ShieldCheck size={14} /> Your CAREPATH notes stay in this browser.</div></div>
      <div className="cp-hero-art" aria-hidden="true"><div className="cp-orbit orbit-a" /><div className="cp-orbit orbit-b" /><div className="cp-orbit orbit-c" /><div className="cp-art-heart"><HeartPulse size={50} /></div><span className="cp-art-dot dot-a" /><span className="cp-art-dot dot-b" /><span className="cp-art-dot dot-c" /></div>
      <div className="cp-hero-date"><CalendarDays size={15} /> {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</div>
    </section>

    <section className="cp-stat-grid" aria-label="Your CAREPATH overview">
      <Stat icon={<Pill />} label="My medicines" value={String(medicines.length)} note="Saved in my list" tone="mint" onClick={() => onNavigate("Medicine Passport")} />
      <Stat icon={<Activity />} label="Health readings" value={String(readings.length)} note={readings.length > 0 && readings.every((reading) => reading.id.startsWith("demo-")) ? "Example set · explore tracker" : "Across my tracker"} tone="blue" onClick={() => onNavigate("Health Tracker")} />
      <Stat icon={<ShieldCheck />} label="Profile notes" value={allergies.trim() ? "Updated" : "Add details"} note={allergies.trim() ? "Allergy notes on file" : "Allergies not recorded"} tone="amber" onClick={() => onNavigate("Care Circle")} />
      <Stat icon={<CalendarDays />} label="Visit prep" value="Ready" note="Build a personal brief" tone="violet" onClick={() => onNavigate("Visit Prep")} />
    </section>

    <section className="cp-quick-section"><div className="cp-section-heading"><div><span className="cp-eyebrow">START WITH ONE STEP</span><h2>Quick actions</h2></div><span>Shortcuts to your most-used workspaces</span></div><div className="cp-quick-grid"><QuickAction icon={<Search />} label="Find medicine info" detail="Search official sources by country" tone="violet" onClick={() => onNavigate("Medicine Finder")} /><QuickAction icon={<ScanLine />} label="Scan a document" detail="Save review notes" tone="blue" onClick={() => onNavigate("Scan & Upload")} /><QuickAction icon={<HeartPulse />} label="Log a reading" detail="Add date and context" tone="rose" onClick={onOpenMonitor} /><QuickAction icon={<ShieldCheck />} label="Review my list" detail="Check saved details" tone="mint" onClick={() => onNavigate("Safety Check")} /><QuickAction icon={<Stethoscope />} label="Prepare for a visit" detail="Gather questions and notes" tone="amber" onClick={() => onNavigate("Visit Prep")} /><QuickAction icon={<Siren />} label="Emergency card" detail="View local reference" tone="red" onClick={() => onNavigate("Emergency Help")} /></div></section>

    <div className="cp-home-main-grid">
      <section className="cp-home-card cp-health-card"><div className="cp-card-head"><div><span className="cp-eyebrow">MY HEALTH NOTES</span><h2>Health overview</h2></div><button className="cp-text-link" onClick={() => onNavigate("Health Tracker")}>Open tracker <ArrowRight size={14} /></button></div><div className="cp-home-metrics">{metrics.map((metric) => <button key={metric.name} className={`cp-home-metric ${metric.tone}`} onClick={() => onNavigate("Health Tracker")}><span className="cp-home-metric-icon">{metric.icon}</span><span className="cp-home-metric-name">{metric.name}</span><strong>{metric.value}<small>{metric.unit}</small></strong><em>{metric.note}</em></button>)}</div><div className="cp-health-footnote"><Info size={14} /> Values appear as entered. CAREPATH does not interpret or diagnose.</div></section>

      <section className="cp-home-card cp-safety-home"><div className="cp-card-head"><div><span className="cp-eyebrow">LIST COMPLETENESS</span><h2>Medication safety</h2></div><div className="cp-shield-illustration"><ShieldCheck size={21} /></div></div><div className="cp-safety-summary"><span className={missingInfo ? "warn" : "ok"}>{missingInfo ? <AlertTriangle size={17} /> : <Check size={17} />}</span><div><strong>{missingInfo ? `${missingInfo} item${missingInfo === 1 ? "" : "s"} need notes` : medicines.length ? "Personal list is ready to review" : "Add your current medicine list"}</strong><p>{allergies.trim() ? "Allergy notes are in your profile; confirm they are current." : "Allergy information is not recorded in your profile."}</p></div></div><div className="cp-safety-divider" /><div className="cp-safety-fineprint">Offline review checks saved information only. It does not check interactions or suitability.</div><button className="cp-button dark cp-wide" onClick={() => onNavigate("Safety Check")}>Open Safety Check <ArrowRight size={15} /></button></section>
    </div>

    <div className="cp-home-lower-grid">
      <section className="cp-home-card cp-chart-home"><div className="cp-card-head"><div><span className="cp-eyebrow">MY SAVED HISTORY</span><h2>Blood pressure</h2></div><button className="cp-icon-link" onClick={() => onNavigate("Health Timeline")} aria-label="View health timeline"><ArrowRight size={17} /></button></div><div className="cp-chart-summary"><div><strong>{bp ? `${bp.value} / ${bp.secondValue ?? "—"}` : "Sample trend"}</strong><span>{bp ? bp.id.startsWith("demo-") ? "Illustrative latest value" : "Most recent reading" : "Illustrative starter values"}</span></div><span className="cp-chart-tag">Personal tracking</span></div><div className="cp-home-chart"><HealthMiniChart data={sampleChart} showDiastolic={Boolean(bp)} /></div><div className="cp-chart-disclaimer">Sample values are for interface demonstration until you add personal readings.</div><button className="cp-text-link" onClick={onOpenMonitor}><Plus size={15} /> Add a reading</button></section>

      <section className="cp-home-card cp-next-home"><div className="cp-card-head"><div><span className="cp-eyebrow">PERSONAL SCHEDULE NOTE</span><h2>My medicine list</h2></div><span className="cp-next-icon"><Pill size={19} /></span></div>{selectedMedicine ? <><div className="cp-next-medicine"><span className="cp-medicine-symbol"><Pill size={22} /></span><div><strong>{selectedMedicine.name}</strong><span>{selectedMedicine.strength} · {selectedMedicine.form}</span><small>{selectedMedicine.instructions || "Instruction not recorded"}</small></div></div><div className="cp-next-meta"><span><Clock3 size={14} /> {selectedMedicine.schedule || "Schedule not recorded"}</span><span>{medicines.length} saved</span></div><div className="cp-next-actions"><button className="cp-button primary" onClick={() => onMarkDose(selectedMedicine)}><Check size={15} /> Log dose note</button><button className="cp-button quiet" onClick={() => onNavigate("Medicine Passport")}>Details</button></div><div className="cp-reminder-note">Logging a note does not schedule reminders or change your instructions.</div></> : <div className="cp-no-meds"><p>Your saved medicine list will appear here.</p><button className="cp-button primary" onClick={() => onNavigate("My Medicines")}><Plus size={15} /> Add medicine</button></div>}</section>

      <section className="cp-home-card cp-visit-home"><div className="cp-visit-art"><div><CalendarDays size={25} /></div><span>YOUR NEXT CONVERSATION</span></div><div className="cp-visit-content"><h2>Bring your questions with you.</h2><p>Collect medicine notes, readings and documents in a print-ready visit brief.</p><button className="cp-button quiet" onClick={() => onNavigate("Visit Prep")}>Build visit brief <ArrowRight size={15} /></button></div></section>
    </div>

    <section className="cp-feature-strip"><Feature title="One connected record" text="Medicines, documents and readings live in one local workspace." icon={<Activity />} onClick={() => onNavigate("Health Map")} /><Feature title="Private by design" text="Your demo record stays in this browser, with an export when you want one." icon={<ShieldCheck />} onClick={() => onNavigate("Settings")} /><Feature title="Help at hand" text="See your personal emergency reference and trusted contact notes." icon={<Siren />} onClick={() => onNavigate("Emergency Help")} /></section>
  </>;
}

function Stat({ icon, label, value, note, tone, onClick }: { icon: ReactNode; label: string; value: string; note: string; tone: string; onClick: () => void }) { return <button className={`cp-stat ${tone}`} onClick={onClick}><span className="cp-stat-icon">{icon}</span><span className="cp-stat-label">{label}</span><strong>{value}</strong><small>{note}</small><ChevronRight className="cp-stat-arrow" size={15} /></button>; }

function QuickAction({ icon, label, detail, tone, onClick }: { icon: ReactNode; label: string; detail: string; tone: string; onClick: () => void }) { return <button className="cp-quick-action" onClick={onClick}><span className={`cp-quick-icon ${tone}`}>{icon}</span><strong>{label}</strong><small>{detail}</small><ArrowRight size={14} /></button>; }

function Feature({ title, text, icon, onClick }: { title: string; text: string; icon: ReactNode; onClick: () => void }) { return <button className="cp-feature" onClick={onClick}><span>{icon}</span><div><strong>{title}</strong><p>{text}</p></div><ChevronRight size={16} /></button>; }

function HealthMiniChart({ data, showDiastolic }: { data: Array<{ day: string; systolic: number; diastolic: number; fallback: number }>; showDiastolic: boolean }) {
  const xFor = (index: number) => data.length <= 1 ? 210 : 38 + index * (350 / (data.length - 1));
  const yFor = (value: number) => 137 - ((value - 70) / 85) * 115;
  const series = (key: "systolic" | "diastolic" | "fallback") => data.map((item, index) => `${xFor(index)},${yFor(item[key])}`).join(" ");
  return <svg className="cp-mini-chart" viewBox="0 0 410 160" role="img" aria-label="Example blood pressure trend chart">
    {[70, 95, 120, 155].map((tick) => <g key={tick}><line x1="34" x2="400" y1={yFor(tick)} y2={yFor(tick)} stroke="#e7eef0" strokeDasharray="3 5" /><text x="2" y={yFor(tick) + 3} fill="#8a9a9f" fontSize="9">{tick}</text></g>)}
    <polyline points={series(showDiastolic ? "systolic" : "fallback")} fill="none" stroke="#159a7c" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
    {showDiastolic && <polyline points={series("diastolic")} fill="none" stroke="#79a5e9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
    {data.map((item, index) => <g key={`${item.day}-${index}`}><circle cx={xFor(index)} cy={yFor(showDiastolic ? item.systolic : item.fallback)} r="3" fill="#159a7c" />{showDiastolic && <circle cx={xFor(index)} cy={yFor(item.diastolic)} r="2.5" fill="#79a5e9" />}<text x={xFor(index)} y="155" fill="#8a9a9f" fontSize="9" textAnchor="middle">{item.day}</text></g>)}
  </svg>;
}

function ModuleLoading({ overlay = false }: { overlay?: boolean }) { return <div className={`cp-loading ${overlay ? "overlay" : ""}`}><span /><strong>Opening your workspace…</strong></div>; }

export default App;
