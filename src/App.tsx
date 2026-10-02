import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
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
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileUp,
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
import { getVoiceLanguage, saveVoiceLanguage, speakText, stopReading } from "./voice";
import type { VoiceLanguage } from "./voice";
import { readPersonalMedicines } from "./medicineStorage";

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
  reason?: string;
  remainingUnits?: number;
  unitsPerDay?: number;
  expiryDate?: string;
  source?: "sample" | "demo-extraction" | "user";
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

type MedicationEvent = { id: string; medicine: string; time: string; date: string; status: "Taken" | "Skipped" | "Remind Later" | "Not Sure" };
type Reminder = { id: string; medicineId: string; name: string; time: string; enabled: boolean; lastFiredDate?: string };
type ReviewReminder = { id: string; medicine: string; at: string; notified: boolean };

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
  { name: "Care Guide", icon: BookOpen },
  { name: "Symptom Guide", icon: Activity },
  { name: "Official Sources", icon: Search },
  { name: "ASK CARE CONNECTED", icon: Search },
  { name: "My Medicines", icon: Pill },
  { name: "Medicine Passport", icon: FileCheck2 },
  { name: "Scan & Upload", icon: ScanLine },
  { name: "Safety Check", icon: ShieldCheck },
  { name: "Medication Changes", icon: ClipboardList },
  { name: "Health Tracker", icon: HeartPulse },
  { name: "Health Timeline", icon: Clock3 },
  { name: "Health Calendar", icon: CalendarDays },
  { name: "Health Map", icon: Activity },
  { name: "Tests & Reports", icon: ClipboardList },
  { name: "Visit Prep", icon: Stethoscope },
  { name: "Care Circle", icon: Users },
  { name: "Safety Alerts", icon: AlertTriangle },
  { name: "Learn", icon: BookOpen },
  { name: "Admin Preview", icon: ShieldCheck },
];

const primaryNavItems = navItems.filter((item) => ["Home", "ASK CARE CONNECTED"].includes(item.name));
const everydayNavItems = navItems.filter((item) => ["My Medicines", "Scan & Upload", "Health Tracker"].includes(item.name));
const moreNavItems = navItems.filter((item) => !primaryNavItems.includes(item) && !everydayNavItems.includes(item));

type RouteOverlay = "medicines" | "monitor" | null;
type RouteState = { section: string; overlay: RouteOverlay; scrollY: number };

function sectionHash(section: string) {
  return `#${encodeURIComponent(section.toLowerCase().replace(/\s+/g, "-"))}`;
}

function sectionFromLocation() {
  let raw = "";
  try { raw = decodeURIComponent(window.location.hash.replace(/^#/, "")); } catch { raw = ""; }
  raw = raw.replace(/-/g, " ").trim();
  if (raw.toLowerCase() === "ask carepath") raw = "ASK CARE CONNECTED";
  const match = ["Home", ...navItems.map((item) => item.name), "Emergency Help", "Settings"].find((item) => item.toLowerCase() === raw.toLowerCase());
  return match || "Home";
}

function routeStateFromHistory(): RouteState {
  const state = window.history.state as { carepath?: RouteState } | null;
  if (!state?.carepath) return { section: sectionFromLocation(), overlay: null, scrollY: 0 };
  const route = state.carepath;
  return { ...route, section: route.section === "ASK CAREPATH" ? "ASK CARE CONNECTED" : route.section };
}

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
  { id: "demo-10", metric: "Steps", value: 4200, unit: "steps", date: getDateOffset(0), time: "08:45", note: "Illustrative daily count" },
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
  const [active, setActive] = useState(() => sectionFromLocation());
  const [mobileMenu, setMobileMenu] = useState(false);
  const [moreToolsOpen, setMoreToolsOpen] = useState(false);
  const [showMedicines, setShowMedicines] = useState(false);
  const [showHealthMonitor, setShowHealthMonitor] = useState(false);
  const [medicineCount, setMedicineCount] = useState(() => readPersonalMedicines<Medicine>().length);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [easyMode, setEasyMode] = useState(() => readStored<boolean>("carepath_easy_mode", false));
  const [showGuide, setShowGuide] = useState(() => !readStored<boolean>("carepath_start_guide_complete", false));
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => readStored<boolean>("carepath_voice_support", true));
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [confirmDose, setConfirmDose] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>(() => readStored<Reminder[]>("carepath_reminders", []));
  const [dueReminder, setDueReminder] = useState<Reminder | null>(null);
  const [reviewReminders, setReviewReminders] = useState<ReviewReminder[]>(() => readStored<ReviewReminder[]>("carepath_review_reminders", []));
  const [dueReviewReminder, setDueReviewReminder] = useState<ReviewReminder | null>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [lastSaved, setLastSaved] = useState(() => readStored<string>("carepath_last_local_save", ""));
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [pendingAskQuestion, setPendingAskQuestion] = useState("");
  const medicines = useMemo(() => readPersonalMedicines<Medicine>(), [medicineCount, refresh]);
  const healthReadings = useMemo(() => readStored<HealthReading[]>("carepath_health_readings", SAMPLE_READINGS), [refresh]);
  const medicationLog = useMemo(() => readStored<MedicationEvent[]>("carepath_medication_log", []), [refresh]);
  const profile = useMemo(() => readStored<{ name?: string; allergies?: string }>("carepath_profile", {}), [refresh]);
  const name = profile.name?.trim() || "Demo User";


  const refreshApp = useCallback(() => setRefresh((current) => current + 1), []);
  const clearPendingUploadFile = useCallback(() => setPendingUploadFile(null), []);
  const clearPendingAskQuestion = useCallback(() => setPendingAskQuestion(""), []);
  const applyRoute = useCallback((route: RouteState) => {
    setActive(route.section);
    setShowMedicines(route.overlay === "medicines");
    setShowHealthMonitor(route.overlay === "monitor");
    setMobileMenu(false);
    window.requestAnimationFrame(() => window.scrollTo({ top: route.scrollY, behavior: "auto" }));
  }, []);
  useEffect(() => {
    const initial = routeStateFromHistory();
    window.history.replaceState({ ...window.history.state, carepath: initial }, "", sectionHash(initial.section));
    const onPopState = () => applyRoute(routeStateFromHistory());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [applyRoute]);
  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => { window.removeEventListener("online", updateOnline); window.removeEventListener("offline", updateOnline); };
  }, []);
  useEffect(() => {
    const updateLocalSnapshot = () => {
      setRefresh((current) => current + 1);
      setMedicineCount(readPersonalMedicines<Medicine>().length);
      setLastSaved(readStored<string>("carepath_last_local_save", new Date().toISOString()));
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
        void navigator.serviceWorker.ready.then((registration) => Promise.all(due.map((reminder) => registration.showNotification("CARE CONNECTED reminder", { body: `${reminder.name} · ${reminder.time}. Check your current instructions.`, icon: `${import.meta.env.BASE_URL}favicon.svg`, tag: reminder.id })))).catch(() => { /* Browser notifications are optional; the in-app reminder remains available. */ });
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
    const checkReviewReminders = () => {
      const due = reviewReminders.filter((item) => !item.notified && new Date(item.at).getTime() <= Date.now());
      if (!due.length) return;
      const dueIds = new Set(due.map((item) => item.id));
      const next = reviewReminders.map((item) => dueIds.has(item.id) ? { ...item, notified: true } : item);
      try { localStorage.setItem("carepath_review_reminders", JSON.stringify(next)); } catch { /* Show the in-session reminder even if storage is full. */ }
      setReviewReminders(next);
      setDueReviewReminder(due[0]);
    };
    checkReviewReminders();
    const timer = window.setInterval(checkReviewReminders, 15_000);
    return () => window.clearInterval(timer);
  }, [reviewReminders]);
  useEffect(() => {
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
  }, []);
  const onCountChange = useCallback((count: number) => setMedicineCount(count), []);
  const navigateTo = (section: string, overlay: RouteOverlay = null) => {
    const current = routeStateFromHistory();
    const next = { section, overlay, scrollY: 0 } satisfies RouteState;
    window.history.replaceState({ ...window.history.state, carepath: { ...current, scrollY: window.scrollY } }, "", sectionHash(current.section));
    window.history.pushState({ ...window.history.state, carepath: next }, "", sectionHash(section));
    setQuery("");
    applyRoute(next);
  };
  const openSection = (section: string) => navigateTo(section, section === "My Medicines" ? "medicines" : null);
  const openOverlay = (overlay: RouteOverlay, section = active) => navigateTo(section, overlay);
  const closeOverlay = (overlay: RouteOverlay) => {
    const current = routeStateFromHistory();
    if (current.overlay === overlay) window.history.back();
    else { setShowMedicines(false); setShowHealthMonitor(false); }
  };
  const openMonitor = () => openOverlay("monitor", "Health Tracker");
  const saveReminders = (next: Reminder[]) => {
    setReminders(next);
    try { localStorage.setItem("carepath_reminders", JSON.stringify(next)); localStorage.setItem("carepath_last_local_save", new Date().toISOString()); setLastSaved(new Date().toISOString()); } catch { setNotice("This browser could not save your reminder settings."); }
  };
  const scheduleReviewReminder = (medicine: string, at: string) => {
    const next = [{ id: `review-${Date.now()}`, medicine, at: new Date(at).toISOString(), notified: false }, ...readStored<ReviewReminder[]>("carepath_review_reminders", [])];
    try {
      localStorage.setItem("carepath_review_reminders", JSON.stringify(next));
      localStorage.setItem("carepath_last_local_save", new Date().toISOString());
      setReviewReminders(next);
      setLastSaved(new Date().toISOString());
      setNotice("A reminder to review the written guidance was saved on this device.");
      window.setTimeout(() => setNotice(""), 3600);
    } catch { setNotice("This browser could not save the review reminder."); }
  };
  const finishReviewReminder = (snooze = false) => {
    if (!dueReviewReminder) return;
    const next = snooze
      ? reviewReminders.map((item) => item.id === dueReviewReminder.id ? { ...item, at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), notified: false } : item)
      : reviewReminders.filter((item) => item.id !== dueReviewReminder.id);
    try { localStorage.setItem("carepath_review_reminders", JSON.stringify(next)); } catch { /* Keep the current screen usable if storage is unavailable. */ }
    setReviewReminders(next);
    setDueReviewReminder(null);
  };
  const finishGuide = () => {
    setShowGuide(false);
    try { localStorage.setItem("carepath_start_guide_complete", "true"); } catch { /* Keep the guide usable when storage is unavailable. */ }
  };
  const readAloud = (text?: string) => {
    if (!voiceEnabled) { setNotice("Turn on voice support in the accessibility bar to listen."); return; }
    const selected = window.getSelection()?.toString().trim();
    const content = text || selected || document.querySelector(".content")?.textContent || "Welcome to CARE CONNECTED. Your personal health organizer.";
    if (!speakText(content, { rate: easyMode ? 0.82 : undefined })) setNotice("Read aloud is not available in this browser.");
  };
  const toggleVoiceSupport = () => {
    const next = !voiceEnabled;
    if (!next) {
      speechRecognitionRef.current?.stop();
      speechRecognitionRef.current = null;
      setListening(false);
      setVoiceOpen(false);
      stopReading();
    }
    setVoiceEnabled(next);
    try { localStorage.setItem("carepath_voice_support", JSON.stringify(next)); } catch { /* Voice remains available for this visit. */ }
    window.dispatchEvent(new Event("carepath:voice-setting"));
    setNotice(next ? "Voice support is on. Use Listen for a page or section." : "Voice support is off and active speech has stopped.");
  };
  const installApp = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (result.outcome === "accepted") setNotice("CARE CONNECTED is being added to your device.");
    } catch { setNotice("Use your browser menu to install CARE CONNECTED on this device."); }
  };
  const startVoice = () => {
    if (!voiceEnabled) { setNotice("Turn on voice support in the accessibility bar to use voice input."); return; }
    setVoiceOpen(true);
    setVoiceText("");
    setVoiceStatus("");
    const Speech = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
    if (!Speech) { setVoiceStatus("Voice input is not supported here. Type a command below, or use the large quick-action buttons."); return; }
    try {
      const recognition = new Speech();
      recognition.lang = getVoiceLanguage() === "kn" ? "kn-IN" : "en-IN";
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript || "";
        setVoiceText(transcript);
        setVoiceStatus("I heard this. Review it, then choose Use command.");
        setListening(false);
      };
      recognition.onerror = () => { setListening(false); setVoiceStatus("I couldn’t hear that clearly. Try again or type a short command."); };
      recognition.onend = () => { setListening(false); speechRecognitionRef.current = null; };
      speechRecognitionRef.current = recognition;
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
    if (/\b(add|new) medicine\b/.test(command)) { openOverlay("medicines", "My Medicines"); return; }
    if (/\b(visit|doctor|appointment|prepare)\b/.test(command)) { openSection("Visit Prep"); return; }
    if (/\b(blood pressure|glucose|reading|health tracker|show my health)\b/.test(command)) { openSection("Health Tracker"); return; }
    if (/\b(symptom|feeling unwell|not feeling well)\b/.test(command)) { openSection("Symptom Guide"); return; }
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
      const answer = next ? `Your next saved reminder for ${next.name} is ${when} at ${next.time}. Please confirm timing with the current prescription.` : "You have no CARE CONNECTED reminders set up. Open reminders to create a personal time note from your current instructions.";
      setNotice(answer); readAloud(answer); return;
    }
    if (/\b(show|list|my)\b/.test(command) && /medicine|medication|pills/.test(command)) { openSection("Medicine Passport"); return; }
    if (/remind|reminder/.test(command)) { setShowReminders(true); return; }
    setPendingAskQuestion(raw.trim());
    openSection("ASK CARE CONNECTED");
    setNotice("Your spoken question is ready in ASK CARE CONNECTED. Review it before sending anything to an AI service.");
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
      localStorage.setItem("carepath_last_local_save", new Date().toISOString());
      setLastSaved(new Date().toISOString());
      setNotice("Dose note saved on this device. Follow your current prescription instructions.");
      window.setTimeout(() => setNotice(""), 3600);
      refreshApp();
    } catch {
      setNotice("This browser could not save the note. Check available device storage.");
    }
  };

  const results = query.trim()
    ? [
        ...navItems.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).map((item) => ({ label: item.name, detail: "Open CARE CONNECTED workspace", action: () => openSection(item.name), icon: item.icon })),
        ...medicines.filter((item) => `${item.name} ${item.strength}`.toLowerCase().includes(query.toLowerCase())).slice(0, 4).map((item) => ({ label: item.name, detail: `${item.strength} · ${item.form}`, action: () => openSection("Medicine Passport"), icon: Pill })),
      ].slice(0, 7)
    : [];

  return (
    <div className={`carepath-app${easyMode ? " cp-easy-mode" : ""}`}>
      <a className="cp-skip-link" href="#carepath-main">Skip to main content</a>
      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-logo"><HeartPulse size={25} /></div>
          <div className="brand-copy"><h1>CARE CONNECTED</h1><span>Understand better. Stay connected.</span></div>
          <button className="close-menu" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={20} /></button>
        </div>
        <div className="cp-sidebar-caption">YOUR CARE WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <div className="cp-nav-group">
            <span className="cp-nav-group-label">START HERE</span>
            {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const selected = active === item.name || (active === "Medicine Passport" && item.name === "My Medicines");
            return <button key={item.name} className={`nav-item ${selected ? "active" : ""}`} onClick={() => openSection(item.name)} aria-current={selected ? "page" : undefined}><Icon size={18} /><span>{item.name}</span>{item.name === "Safety Alerts" && !profile.allergies?.trim() && <span className="cp-nav-dot" />}</button>;
            })}
          </div>
          <div className="cp-nav-group">
            <span className="cp-nav-group-label">EVERYDAY TOOLS</span>
            {everydayNavItems.map((item) => {
              const Icon = item.icon;
              const selected = active === item.name || (active === "Medicine Passport" && item.name === "My Medicines");
              return <button key={item.name} className={`nav-item ${selected ? "active" : ""}`} onClick={() => openSection(item.name)} aria-current={selected ? "page" : undefined}><Icon size={18} /><span>{item.name}</span></button>;
            })}
          </div>
          <details className="cp-nav-more" open={moreToolsOpen || moreNavItems.some((item) => item.name === active)} onToggle={(event) => setMoreToolsOpen(event.currentTarget.open)}>
            <summary><span>More tools</span><span className="cp-nav-count">{moreNavItems.length}</span></summary>
            <div className="cp-nav-group cp-nav-extra">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                const selected = active === item.name;
                return <button key={item.name} className={`nav-item ${selected ? "active" : ""}`} onClick={() => openSection(item.name)} aria-current={selected ? "page" : undefined}><Icon size={18} /><span>{item.name}</span>{item.name === "Safety Alerts" && !profile.allergies?.trim() && <span className="cp-nav-dot" />}</button>;
              })}
            </div>
          </details>
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
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setQuery(""); if (event.key === "Enter" && results[0]) results[0].action(); }} placeholder="Search your CARE CONNECTED workspace…" aria-label="Search medicines and sections" />
            <span className="search-shortcut">/</span>
            {results.length > 0 && <div className="cp-search-results">{results.map((result, index) => { const Icon = result.icon; return <button key={`${result.label}-${index}`} onClick={result.action}><span><Icon size={17} /></span><span><strong>{result.label}</strong><small>{result.detail}</small></span><ChevronRight size={15} /></button>; })}</div>}
          </div>
          <div className="top-actions">
            <span className={`cp-device-status ${online ? "" : "offline"}`}><i /> {online ? "Online · local workspace" : "Offline · saved locally"}{lastSaved ? ` · ${new Date(lastSaved).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</span>
            <button className="icon-button notification-button" aria-label="Review safety notes" onClick={() => openSection("Safety Alerts")}><Bell size={19} /><span className="notification-dot">!</span></button>
            <button className="cp-user-button" onClick={() => openSection("Care Circle")} aria-label="Open my care profile"><span className="avatar">{name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "CP"}</span><span className="user-mini"><strong>{name}</strong><small>CARE CONNECTED ID</small></span></button>
          </div>
        </header>

        <section className="content">
          <div className="cp-accessibility-bar" aria-label="Accessibility and quick help">
            <button className={easyMode ? "selected" : ""} aria-pressed={easyMode} onClick={() => { const next = !easyMode; setEasyMode(next); try { localStorage.setItem("carepath_easy_mode", JSON.stringify(next)); } catch { /* Optional preference. */ } }}><Accessibility size={17} /><span>{easyMode ? "Easy mode on" : "Easy mode"}</span></button>
            <button className={voiceEnabled ? "selected" : ""} aria-pressed={voiceEnabled} onClick={toggleVoiceSupport}><Volume2 size={17} /><span>Voice {voiceEnabled ? "on" : "off"}</span></button>
            <button onClick={startVoice} disabled={!voiceEnabled}><Mic size={17} /><span>Tell CARE CONNECTED</span></button>
            <button onClick={() => readAloud()} disabled={!voiceEnabled}><Volume2 size={17} /><span>Read this to me</span></button>
            <button onClick={() => setShowReminders(true)}><BellRing size={17} /><span>Reminders{reminders.filter((item) => item.enabled).length ? ` · ${reminders.filter((item) => item.enabled).length}` : ""}</span></button>
            {installPrompt && <button onClick={() => void installApp()}><Plus size={17} /><span>Install app</span></button>}
            <button onClick={() => setShowGuide(true)}><BookOpen size={17} /><span>Show me how</span></button>
          </div>
        {active === "Home" ? <HomeDashboard name={name} medicines={medicines} readings={healthReadings} medicationLog={medicationLog} reminders={reminders} onNavigate={openSection} onOpenMonitor={openMonitor} onOpenReminders={() => setShowReminders(true)} onMarkDose={markDose} onAskQuestion={(question) => { setPendingAskQuestion(question); openSection("ASK CARE CONNECTED"); }} onStartVoice={startVoice} onUploadFile={(file) => { setPendingUploadFile(file); openSection("Scan & Upload"); }} /> : <>
            <div className="cp-route-topline"><button onClick={() => openSection("Home")}><Home size={14} /> Home</button><ChevronRight size={13} /><span>{active}</span></div>
            <Suspense fallback={<ModuleLoading />}><CarePathModules active={active} medicineCount={medicineCount} initialQuestion={pendingAskQuestion} onQuestionConsumed={clearPendingAskQuestion} initialFile={pendingUploadFile} onInitialFileHandled={clearPendingUploadFile} onOpenMedicines={() => openOverlay("medicines")} onOpenMonitor={openMonitor} onScheduleReview={scheduleReviewReminder} onNavigate={openSection} onInstallApp={() => void installApp()} /></Suspense>
          </>}
          <footer className="cp-app-footer"><div><strong>CARE CONNECTED</strong><span>Ask anything. Understand better. Stay connected.</span></div><span>Personal organization tool · Verify health details with a qualified professional.</span></footer>
        </section>
      </main>

      {notice && <div className="cp-toast" role="status"><Check size={16} />{notice}</div>}
      {showGuide && <StartGuide onClose={finishGuide} onNavigate={(section) => { finishGuide(); if (section === "__reminders") { setShowReminders(true); return; } if (section === "My Medicines") { openOverlay("medicines", "My Medicines"); return; } openSection(section); }} />}
      {voiceOpen && <VoiceDialog text={voiceText} status={voiceStatus} listening={listening} onText={setVoiceText} onListen={startVoice} onUse={() => handleVoiceCommand(voiceText)} onClose={() => { speechRecognitionRef.current?.stop(); speechRecognitionRef.current = null; setListening(false); setVoiceOpen(false); }} />}
      {confirmDose && <DoseConfirm medicines={medicines} onCancel={() => setConfirmDose(false)} onConfirm={(medicine) => { setConfirmDose(false); markDose(medicine); }} />}
      {showReminders && <ReminderCenter medicines={medicines} reminders={reminders} onSave={saveReminders} onClose={() => setShowReminders(false)} />}
      {dueReminder && <div className="cp-reminder-toast" role="alert"><div className="cp-reminder-toast-icon"><BellRing size={22} /></div><div><strong>Time for your reminder</strong><p>{dueReminder.name} · {dueReminder.time}</p><small>Check your current package or prescription before acting.</small></div><button onClick={() => { setDueReminder(null); setConfirmDose(true); }}>I took it · log</button><button aria-label="Dismiss reminder" onClick={() => setDueReminder(null)}><X size={16} /></button></div>}
      {dueReviewReminder && <div className="cp-reminder-toast cp-review-reminder-toast" role="alert"><div className="cp-reminder-toast-icon"><Info size={22} /></div><div><strong>Review your missed-dose guidance</strong><p>{dueReviewReminder.medicine}</p><small>This is a reminder to check the package or ask a pharmacist. It is not a dose instruction.</small></div><button onClick={() => finishReviewReminder(true)}>Remind in 1 hour</button><button onClick={() => finishReviewReminder()} aria-label="Dismiss review reminder"><Check size={16} /></button></div>}
      <Suspense fallback={<ModuleLoading overlay />}>
        {showMedicines && <MedicineCenter onClose={() => { closeOverlay("medicines"); refreshApp(); }} onCountChange={onCountChange} language={getVoiceLanguage()} />}
        {showHealthMonitor && <HealthMonitor voiceEnabled={voiceEnabled} onClose={() => { closeOverlay("monitor"); refreshApp(); }} />}
      </Suspense>
    </div>
  );
}

function StartGuide({ onClose, onNavigate }: { onClose: () => void; onNavigate: (section: string) => void }) {
  const steps = [
    { title: "Save a medicine", text: "Record what is written on your current package or prescription. CARE CONNECTED won’t choose a dose for you.", action: "Open My Medicines", route: "My Medicines", icon: <Pill size={22} /> },
    { title: "Capture and read a document", text: "Choose a photo or PDF. CARE CONNECTED can extract text in this browser; review every word against the original before keeping it.", action: "Open Scan & Upload", route: "Scan & Upload", icon: <ScanLine size={22} /> },
    { title: "Set a personal reminder", text: "Add a time from your existing instructions. Reminders only run while CARE CONNECTED is open.", action: "Open reminders", route: "__reminders", icon: <BellRing size={22} /> },
    { title: "Keep urgent details nearby", text: "Add a trusted contact and review your emergency card. In an emergency, contact local services directly.", action: "Open Emergency Help", route: "Emergency Help", icon: <Siren size={22} /> },
  ];
  return <div className="cp-modal-backdrop" role="presentation"><section className="cp-guide-modal" role="dialog" aria-modal="true" aria-labelledby="cp-guide-title"><button className="cp-modal-close" onClick={onClose} aria-label="Close start guide"><X size={19} /></button><span className="cp-eyebrow">A SHORT, HANDS-ON TOUR</span><h2 id="cp-guide-title">Welcome to your CARE CONNECTED</h2><p className="cp-guide-intro">Choose a first step. Each button opens the real workspace so you can try it when you’re ready.</p><div className="cp-guide-modal-grid">{steps.map((step, index) => <button key={step.title} onClick={() => onNavigate(step.route)}><span className="cp-guide-modal-icon">{step.icon}</span><small>STEP 0{index + 1}</small><strong>{step.title}</strong><p>{step.text}</p><em>{step.action}<ArrowRight size={14} /></em></button>)}</div><div className="cp-guide-modal-footer"><span>Demo information is illustrative. Verify medicine details with their source.</span><button className="cp-button primary" onClick={onClose}>Start exploring <ArrowRight size={15} /></button></div></section></div>;
}

function VoiceDialog({ text, status, listening, onText, onListen, onUse, onClose }: { text: string; status: string; listening: boolean; onText: (text: string) => void; onListen: () => void; onUse: () => void; onClose: () => void }) {
  const examples = ["Show my medicines", "I took my medicine", "I forgot a dose", "Prepare my doctor visit", "Read this to me"];
  return <div className="cp-modal-backdrop" role="presentation"><section className="cp-voice-modal" role="dialog" aria-modal="true" aria-labelledby="cp-voice-title"><button className="cp-modal-close" onClick={onClose} aria-label="Close voice help"><X size={19} /></button><div className={`cp-voice-orb${listening ? " listening" : ""}`}><Mic size={29} /></div><span className="cp-eyebrow">VOICE-FIRST SHORTCUTS</span><h2 id="cp-voice-title">Tell CARE CONNECTED</h2><p>Try a short command. You can review the words before CARE CONNECTED opens anything or saves a dose note.</p><button className="cp-button primary cp-voice-listen" onClick={onListen} disabled={listening}><Mic size={17} />{listening ? "Listening…" : "Start listening"}</button><label className="cp-voice-field">Your words<textarea value={text} onChange={(event) => onText(event.target.value)} rows={2} placeholder="Or type: show my medicines" /></label><p className="cp-voice-status" aria-live="polite">{status || "Commands: medicines, scan, readings, reminders, visit prep, emergency help, or read this aloud."}</p><div className="cp-voice-examples">{examples.map((example) => <button key={example} onClick={() => onText(example)}>{example}</button>)}</div><div className="cp-voice-privacy"><Info size={15} /> Voice recognition depends on your browser; some browsers send audio to their recognition service. CARE CONNECTED does not save audio or transcripts.</div><div className="cp-guide-modal-footer"><button className="cp-button quiet" onClick={onClose}>Cancel</button><button className="cp-button primary" onClick={onUse} disabled={!text.trim()}>Use command <ArrowRight size={15} /></button></div></section></div>;
}

function DoseConfirm({ medicines, onCancel, onConfirm }: { medicines: Medicine[]; onCancel: () => void; onConfirm: (medicine: Medicine) => void }) {
  const [selected, setSelected] = useState(medicines[0]?.id || "");
  return <div className="cp-modal-backdrop" role="presentation"><section className="cp-dose-modal" role="dialog" aria-modal="true" aria-labelledby="cp-dose-title"><button className="cp-modal-close" onClick={onCancel} aria-label="Close dose confirmation"><X size={19} /></button><span className="cp-guide-modal-icon"><Check size={22} /></span><span className="cp-eyebrow">PERSONAL NOTE ONLY</span><h2 id="cp-dose-title">Which medicine did you take?</h2><p>Choose one to save a time-stamped note. CARE CONNECTED cannot confirm a dose or change your prescription.</p>{medicines.length ? <div className="cp-dose-options">{medicines.map((medicine) => <label key={medicine.id}><input type="radio" name="voice-dose" value={medicine.id} checked={selected === medicine.id} onChange={() => setSelected(medicine.id)} /><span><strong>{medicine.name}</strong><small>{medicine.strength} · {medicine.schedule || "No time note"}</small></span></label>)}</div> : <p>No medicines are saved yet. Add details from your current source first.</p>}<div className="cp-guide-modal-footer"><button className="cp-button quiet" onClick={onCancel}>Cancel</button><button className="cp-button primary" disabled={!medicines.length} onClick={() => { const medicine = medicines.find((item) => item.id === selected); if (medicine) onConfirm(medicine); }}>Save dose note</button></div></section></div>;
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
    if (!("Notification" in window)) { setMessage("This browser does not support notifications. CARE CONNECTED can still show reminders while open."); return; }
    try { const permission = await Notification.requestPermission(); setMessage(permission === "granted" ? "Browser notifications are enabled for this device." : "Notifications were not enabled. In-app reminders still work while CARE CONNECTED is open."); }
    catch { setMessage("Notifications could not be enabled here. In-app reminders still work while CARE CONNECTED is open."); }
  };
  const update = (id: string, patch: Partial<Reminder>) => onSave(reminders.map((item) => item.id === id ? { ...item, ...patch } : item));
  return <div className="cp-modal-backdrop" role="presentation"><section className="cp-reminder-modal" role="dialog" aria-modal="true" aria-labelledby="cp-reminder-title"><button className="cp-modal-close" onClick={onClose} aria-label="Close reminders"><X size={19} /></button><span className="cp-guide-modal-icon"><BellRing size={22} /></span><span className="cp-eyebrow">PERSONAL TIME NOTES</span><h2 id="cp-reminder-title">Medicine reminders</h2><p>Set a daily reminder time copied from your current instructions. It only runs while this page is open; it is not a background alarm or clinical instruction.</p><div className="cp-reminder-form"><label>Medicine<select value={medicineId} onChange={(event) => setMedicineId(event.target.value)}>{medicines.length ? medicines.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.strength}</option>) : <option value="">Add a medicine first</option>}</select></label><label>Reminder time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label><button className="cp-button primary" onClick={add}><Plus size={16} /> Add reminder</button></div>{message && <p className="cp-voice-status" role="status">{message}</p>}<div className="cp-reminder-list">{reminders.map((item) => <div key={item.id}><span><strong>{item.name}</strong><small>{item.time} · daily personal note</small></span><label className="cp-switch"><input type="checkbox" checked={item.enabled} onChange={(event) => update(item.id, { enabled: event.target.checked, lastFiredDate: undefined })} /><span>{item.enabled ? "On" : "Off"}</span></label><button aria-label={`Remove reminder for ${item.name}`} onClick={() => onSave(reminders.filter((reminder) => reminder.id !== item.id))}><X size={16} /></button></div>)}</div><div className="cp-reminder-actions"><button className="cp-button quiet" onClick={allowNotifications}><Bell size={16} /> Enable browser notifications</button><button className="cp-button quiet" aria-pressed={soundEnabled} onClick={() => { const next = !soundEnabled; setSoundEnabled(next); try { localStorage.setItem("carepath_reminder_sound", JSON.stringify(next)); } catch { /* Optional preference. */ } setMessage(next ? "Reminder sound enabled where the device permits it." : "Reminder sound disabled."); }}>Sound: {soundEnabled ? "On" : "Off"}</button></div><div className="cp-voice-privacy"><Info size={15} /> Notifications need your explicit browser permission. Timing varies by device; no reminder is guaranteed if the browser is closed.</div><div className="cp-guide-modal-footer"><button className="cp-button quiet" onClick={onClose}>Close</button></div></section></div>;
}

function HomeDashboard({ name, medicines, readings, medicationLog, reminders, onNavigate, onOpenMonitor, onOpenReminders, onMarkDose, onAskQuestion, onStartVoice, onUploadFile }: {
  name: string;
  medicines: Medicine[];
  readings: HealthReading[];
  medicationLog: MedicationEvent[];
  reminders: Reminder[];
  onNavigate: (section: string) => void;
  onOpenMonitor: () => void;
  onOpenReminders: () => void;
  onMarkDose: (medicine: Medicine) => void;
  onAskQuestion: (question: string) => void;
  onStartVoice: () => void;
  onUploadFile: (file: File) => void;
}) {
  const today = getToday();
  const personalMedicines = medicines.filter((medicine) => medicine.source !== "sample");
  const personalReadings = readings
    .filter((reading) => !reading.id.startsWith("demo-"))
    .slice()
    .sort((a, b) => (b.date + " " + b.time).localeCompare(a.date + " " + a.time));
  const latestReadings = Array.from(new Map(personalReadings.map((reading) => [reading.metric, reading])).values()).slice(0, 3);
  const todayNotes = medicationLog.filter((entry) => entry.date === today).slice(0, 3);
  const activeReminders = reminders.filter((reminder) => reminder.enabled).slice().sort((a, b) => a.time.localeCompare(b.time));
  const [actionQuestion, setActionQuestion] = useState("");
  const [useSavedRecords, setUseSavedRecords] = useState(false);
  const [recordAnswer, setRecordAnswer] = useState<{ title: string; lines: string[]; sources: string[] } | null>(null);
  const [actionLanguage, setActionLanguage] = useState<VoiceLanguage>(() => getVoiceLanguage());
  const savedDocuments = readStored<Array<{ id: string; name: string; kind: string; status: string; fileStored?: boolean }>>("carepath_documents", []);
  const actionCopy = actionLanguage === "kn" ? {
    heading: "ಇಂದು ಏನನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸಹಾಯ ಬೇಕು?", intro: "ಪ್ರಶ್ನೆ ಕೇಳಿ, ಹೊಸ ವಿಷಯ ಅನ್ವೇಷಿಸಿ ಅಥವಾ ಫೋಟೋ/PDF ಸೇರಿಸಿ. CARE CONNECTED ಒಳಗೇ ಮುಂದುವರಿಯಿರಿ.",
    placeholder: "ಉದಾಹರಣೆ: ಈ ಔಷಧಿ ಯಾವುದಕ್ಕೆ? ನನ್ನ ವರದಿಯನ್ನು ವಿವರಿಸಿ…", ask: "CARE CONNECTED ಕೇಳಿ", showRecords: "ಉಳಿಸಿದ ಮಾಹಿತಿ ತೋರಿಸಿ", speak: "ಮಾತನಾಡಿ", upload: "ಫೋಟೋ ಅಥವಾ PDF ಸೇರಿಸಿ",
    consent: "ಈ ಪ್ರಶ್ನೆಗೆ ನನ್ನ ಉಳಿಸಿದ ದಾಖಲೆಗಳನ್ನು ಬಳಸಿ", consentHint: "CARE CONNECTED ಸಂಬಂಧಿತ ದಾಖಲೆಗಳನ್ನು ಈ ಸಾಧನದಲ್ಲೇ ತೋರಿಸುತ್ತದೆ. AI ಸೇವೆಗೆ ಕಳುಹಿಸುವುದಿಲ್ಲ.",
    prompts: ["ಈ ಔಷಧಿ ಯಾವುದಕ್ಕೆ?", "ನನ್ನ ಪರೀಕ್ಷಾ ವರದಿ ವಿವರಿಸಿ", "ಡೋಸ್ ಮರೆತರೆ ಸೂಚನೆ ಎಲ್ಲಿ ನೋಡಲಿ?"], recordTitle: "ನಿಮ್ಮ CARE CONNECTED ದಾಖಲೆಗಳಿಂದ",
    readBp: "ರಕ್ತದೊತ್ತಡ ದಾಖಲಿಸಿ", visit: "ವೈದ್ಯರ ಭೇಟಿಗೆ ತಯಾರಿ", alsoAsk: "ಸಾಮಾನ್ಯ ಮಾಹಿತಿಯನ್ನೂ ಕೇಳಿ",
    noMedicines: "ಈ ಸಾಧನದಲ್ಲಿ ನಿಮ್ಮದೇ ಆದ ಔಷಧಿ ದಾಖಲೆ ಇಲ್ಲ.", sampleMedicines: "ಆ್ಯಪ್‌ನಲ್ಲಿ ಉದಾಹರಣೆ ಔಷಧಿಗಳಿವೆ; ಅವು ನಿಮ್ಮ ದೃಢೀಕೃತ ಪಟ್ಟಿಯಲ್ಲ.",
    savedMedicines: "ಉಳಿಸಿದ ಔಷಧಿಗಳು:",
    recentReadings: "ನೀವು ನಮೂದಿಸಿದ ಇತ್ತೀಚಿನ ಅಳತೆಗಳು:", noReadings: "ವೈಯಕ್ತಿಕ ಅಳತೆಗಳಿಲ್ಲ. ಬೇರೆಡೆ ಕಾಣುವ ಉದಾಹರಣೆಗಳು ನಿಮ್ಮ ಅಳತೆಗಳಲ್ಲ.",
    documents: "ಉಳಿಸಿದ ದಾಖಲೆಗಳು:", noDocuments: "ಈ ಸಾಧನದಲ್ಲಿ ಮೂಲ ದಾಖಲೆಗಳನ್ನು ಉಳಿಸಿಲ್ಲ.", noMatch: "ಉಳಿಸಿದ ದಾಖಲೆಗಳು ಈ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸುವುದಿಲ್ಲ. ಸಂಬಂಧವಿಲ್ಲದ ದಾಖಲೆಗಳಿಂದ ನಾನು ಊಹಿಸುವುದಿಲ್ಲ. ಸಂಬಂಧಿತ ದಾಖಲೆ ತೆರೆಯಿರಿ ಅಥವಾ ಸಾಮಾನ್ಯ ಮಾಹಿತಿಗಾಗಿ CARE CONNECTED ಕೇಳಿ.",
    medicinesSource: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಉಳಿಸಿದ ಔಷಧಿ ದಾಖಲೆಗಳು", readingsSource: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ನೀವು ನಮೂದಿಸಿದ ಅಳತೆಗಳು", docsSource: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಉಳಿಸಿದ ದಾಖಲೆ ಹೆಸರು ಮತ್ತು ಪರಿಶೀಲನಾ ಸ್ಥಿತಿ",
  } : {
    heading: "What can I help you understand today?", intro: "Ask a question, explore an idea, speak naturally, or share a document.",
    placeholder: "For example: What is this medicine used for? · Explain my report · I have a cough", ask: "Ask CARE CONNECTED", showRecords: "Show my saved information", speak: "Speak", upload: "Add photo or PDF",
    consent: "Use my saved records for this question on this device", consentHint: "CARE CONNECTED only shows matching entries here. It does not send records to an AI service.",
    prompts: ["What is this medicine used for?", "Explain my test report", "I forgot a dose — where can I check?"], recordTitle: "From your saved CARE CONNECTED records",
    readBp: "Record blood pressure", visit: "Prepare for a doctor visit", alsoAsk: "Also ask for general information",
    noMedicines: "No personal medicine entry was found in this browser.", sampleMedicines: "Illustrative sample medicines are shown in the app; they are not your confirmed medicine list.",
    savedMedicines: "Saved medicines:",
    recentReadings: "Recent readings you entered:", noReadings: "No personal readings were found. Example values shown elsewhere are not your measurements.",
    documents: "Saved documents:", noDocuments: "No original documents are saved in this browser.", noMatch: "Your saved records do not answer this question. I will not guess from unrelated records. Open the relevant record, or ask CARE CONNECTED for general information.",
    medicinesSource: "Medicine entries saved in this browser", readingsSource: "Health readings entered in this browser", docsSource: "Document names and review status saved in this browser",
  };
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  const firstName = name === "Demo User" ? "there" : name.trim().split(/\s+/)[0] || "there";
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const nextStep = personalMedicines.length === 0 && personalReadings.length === 0
    ? { title: "Start with one useful thing", detail: "Add a medicine from its label, scan a report, or simply leave this space empty until you need it.", action: "Scan a document", route: "Scan & Upload", icon: <ScanLine size={20} /> }
    : personalMedicines.length === 0
      ? { title: "Keep your current medicine list nearby", detail: "Save details exactly as written on your package or prescription. You can review them later.", action: "Open my medicine list", route: "My Medicines", icon: <Pill size={20} /> }
      : personalReadings.length === 0
        ? { title: "Keep a reading when it is useful", detail: "Enter a value from your own device with its date and time. CARE CONNECTED will show it as entered.", action: "Add a reading", route: "__monitor", icon: <HeartPulse size={20} /> }
        : { title: "Bring your notes to a care visit", detail: "Gather your own saved medicines, readings, and questions into a short visit brief.", action: "Prepare a visit brief", route: "Visit Prep", icon: <Stethoscope size={20} /> };
  const submitActionQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = actionQuestion.trim();
    if (!question) return;
    if (!useSavedRecords) {
      setRecordAnswer(null);
      onAskQuestion(question);
      return;
    }

    const lower = question.toLowerCase();
    const lines: string[] = [];
    const sources: string[] = [];
    const asksMedicines = /medicine|medication|tablet|pill|ಔಷಧಿ|ಮಾತ್ರೆ/.test(lower);
    const asksReadings = /blood pressure|\bbp\b|glucose|sugar|reading|measurement|ರಕ್ತದೊತ್ತಡ|ಸಕ್ಕರೆ|ಮೌಲ್ಯ/.test(lower);
    const asksDocuments = /document|report|prescription|scan|file|ದಾಖಲೆ|ವರದಿ|ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್/.test(lower);
    const asksSummary = /my health|my record|my details|saved record|what do you know|ನನ್ನ ಆರೋಗ್ಯ|ನನ್ನ ದಾಖಲೆ/.test(lower);

    if (asksMedicines || asksSummary) {
      const personal = medicines.filter((item) => item.source !== "sample" && !["2", "3", "4"].includes(item.id));
      const examples = medicines.filter((item) => item.source === "sample" || ["2", "3", "4"].includes(item.id));
      if (personal.length) {
        lines.push(`${actionCopy.savedMedicines} ${personal.map((item) => `${item.name} ${item.strength}${item.schedule ? ` · ${item.schedule}` : ""}`).join("; ")}.`);
        sources.push(actionCopy.medicinesSource);
      } else lines.push(actionCopy.noMedicines);
      if (!personal.length && examples.length) lines.push(`${actionCopy.sampleMedicines} (${examples.map((item) => `${item.name} ${item.strength}`).join(", ")}).`);
    }
    if (asksReadings || asksSummary) {
      const personal = personalReadings.slice(0, 5);
      if (personal.length) {
        lines.push(`${actionCopy.recentReadings} ${personal.map((item) => `${item.metric} ${item.value}${item.secondValue === undefined ? "" : `/${item.secondValue}`} ${item.unit} · ${item.date} ${item.time}`).join("; ")}.`);
        sources.push(actionCopy.readingsSource);
      } else lines.push(actionCopy.noReadings);
    }
    if (asksDocuments || asksSummary) {
      const personal = savedDocuments.filter((item) => item.fileStored);
      lines.push(personal.length
        ? `${actionCopy.documents} ${personal.map((item) => `${item.name} (${item.kind}; ${item.status})`).join("; ")}. ${actionLanguage === "kn" ? "ಈ ಪಟ್ಟಿ ದಾಖಲೆ ವಿಷಯವನ್ನು ಅರ್ಥೈಸುವುದಿಲ್ಲ." : "This list does not interpret the document contents."}`
        : actionCopy.noDocuments);
      if (personal.length) sources.push(actionCopy.docsSource);
    }
    if (!asksMedicines && !asksReadings && !asksDocuments && !asksSummary) {
      lines.push(actionCopy.noMatch);
    }
    setRecordAnswer({ title: actionCopy.recordTitle, lines, sources });
  };
  return <>
    <section className="cp-today-hero">
      <div className="cp-today-hero-copy">
        <div className="cp-today-topline"><span className="cp-today-date"><CalendarDays size={15} /> {dateLabel}</span><span className="cp-today-private"><ShieldCheck size={15} /> Saved on this device</span></div>
        <span className="cp-today-eyebrow">YOUR HEALTH, MADE SIMPLER</span>
        <h1>{greeting}, <span>{firstName}</span></h1>
        <p>Get a clear starting point for medicines, health notes, and questions you want to understand.</p>
        <div className="cp-today-hero-actions">
          <button className="cp-button cp-today-primary" onClick={() => onNavigate("ASK CARE CONNECTED")}><Search size={17} /> Ask a question</button>
          <button className="cp-button cp-today-secondary" onClick={() => onNavigate("Scan & Upload")}><ScanLine size={17} /> Scan a document</button>
          <button className="cp-today-emergency" onClick={() => onNavigate("Emergency Help")}><Siren size={16} /> Need urgent help?</button>
        </div>
        <small>General health information and personal organization. Not a diagnosis or emergency service.</small>
      </div>
      <div className="cp-today-hero-mark" aria-hidden="true"><span><HeartPulse size={42} /></span><i /><i /><i /></div>
    </section>

    <section className="cp-action-center" aria-labelledby="cp-action-center-title">
      <div className="cp-action-center-heading"><span className="cp-action-center-icon"><HeartPulse size={20} /></span><div><span className="cp-eyebrow">ONE PLACE TO START · {actionLanguage === "kn" ? "ಸರಳವಾಗಿ ಪ್ರಾರಂಭಿಸಿ" : "START SIMPLY"}</span><h2 id="cp-action-center-title">{actionCopy.heading}</h2><p>{actionCopy.intro}</p></div><div className="cp-action-center-language" role="group" aria-label="Action center language"><button type="button" className={actionLanguage === "en" ? "selected" : ""} aria-pressed={actionLanguage === "en"} onClick={() => { setActionLanguage("en"); saveVoiceLanguage("en"); }}>English</button><button type="button" className={actionLanguage === "kn" ? "selected" : ""} aria-pressed={actionLanguage === "kn"} onClick={() => { setActionLanguage("kn"); saveVoiceLanguage("kn"); }}>ಕನ್ನಡ</button></div></div>
      <form className="cp-action-center-form" onSubmit={submitActionQuestion}>
        <textarea value={actionQuestion} onChange={(event) => setActionQuestion(event.target.value)} placeholder={actionCopy.placeholder} rows={2} maxLength={1200} aria-label={actionCopy.heading} />
        <div className="cp-action-center-buttons">
          <button className="cp-button cp-today-primary" type="submit"><Search size={16} /> {useSavedRecords ? actionCopy.showRecords : actionCopy.ask}</button>
          <button className="cp-button quiet" type="button" onClick={onStartVoice}><Mic size={16} /> {actionCopy.speak}</button>
          <label className="cp-button quiet cp-action-upload"><FileUp size={16} /> {actionCopy.upload}<input type="file" accept="image/*,.pdf,application/pdf" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) onUploadFile(file); }} /></label>
        </div>
        <label className="cp-record-consent"><input type="checkbox" checked={useSavedRecords} onChange={(event) => { setUseSavedRecords(event.target.checked); setRecordAnswer(null); }} /><span><strong>{actionCopy.consent}</strong><small>{actionCopy.consentHint}</small></span></label>
      </form>
      <div className="cp-action-prompts" aria-label="Suggested questions and tasks">
        {actionCopy.prompts.map((prompt) => <button key={prompt} type="button" onClick={() => { setActionQuestion(prompt); setRecordAnswer(null); }}>{prompt}<ArrowRight size={14} /></button>)}
        <button type="button" onClick={onOpenMonitor}>{actionCopy.readBp} <ArrowRight size={14} /></button>
        <button type="button" onClick={() => onNavigate("Visit Prep")}>{actionCopy.visit} <ArrowRight size={14} /></button>
      </div>
      {recordAnswer && <article className="cp-record-answer" aria-live="polite"><div><span className="cp-eyebrow">{actionLanguage === "kn" ? "ಸ್ಥಳೀಯ ದಾಖಲೆ ಹುಡುಕಾಟ · ಕಳುಹಿಸಲಾಗಿಲ್ಲ" : "LOCAL RECORD LOOKUP · NOT SENT"}</span><h3>{recordAnswer.title}</h3></div><ul>{recordAnswer.lines.map((line, index) => <li key={`${line}-${index}`}>{line}</li>)}</ul>{recordAnswer.sources.length > 0 && <p>{actionLanguage === "kn" ? "ಆಧಾರ:" : "Based on:"} {recordAnswer.sources.join("; ")}.</p>}<button type="button" className="cp-button quiet" onClick={() => onAskQuestion(actionQuestion.trim())}>{actionCopy.alsoAsk} <ArrowRight size={14} /></button></article>}
    </section>

    <section className="cp-today-grid" aria-label="Today's health workspace">
      <article className="cp-today-panel cp-today-reminders">
        <div className="cp-today-panel-heading"><div><span className="cp-eyebrow">TODAY</span><h2>My reminders</h2></div><button className="cp-today-manage" onClick={onOpenReminders}><BellRing size={15} /> Manage</button></div>
        {activeReminders.length ? <div className="cp-today-reminder-list">{activeReminders.map((reminder) => {
          const medicine = medicines.find((item) => item.id === reminder.medicineId);
          const loggedToday = todayNotes.some((entry) => entry.medicine.toLowerCase().includes(reminder.name.toLowerCase()));
          return <div className="cp-today-reminder" key={reminder.id}><span className="cp-today-reminder-icon"><Pill size={18} /></span><div className="cp-today-reminder-copy"><strong>{reminder.name}</strong><span><Clock3 size={13} /> {reminder.time} · personal time note</span><small>{loggedToday ? "A note is recorded today." : "Check the current package or prescription before acting."}</small></div>{medicine && <button className="cp-today-log" onClick={() => onMarkDose(medicine)}>{loggedToday ? "Log another note" : "I took it · log"}</button>}</div>;
        })}</div> : <div className="cp-today-empty"><span className="cp-today-empty-icon"><BellRing size={19} /></span><div><strong>No reminders set</strong><p>Create a personal time note using the schedule from your current medicine instructions.</p><button className="cp-text-link" onClick={onOpenReminders}>Set a reminder <ArrowRight size={14} /></button></div></div>}
        {todayNotes.length > 0 && <div className="cp-today-log-summary"><span>NOTES YOU RECORDED TODAY</span>{todayNotes.map((entry) => <div key={entry.id}><Check size={14} /><span>{entry.status} · {entry.medicine}</span><time>{entry.time}</time></div>)}</div>}
        <p className="cp-today-reminder-footnote">Reminders depend on this page and device. They are not guaranteed alarms or medicine instructions.</p>
      </article>

      <article className="cp-today-panel cp-today-next">
        <div className="cp-today-panel-heading"><div><span className="cp-eyebrow">A GENTLE NEXT STEP</span><h2>Make it yours</h2></div><span className="cp-today-next-icon">{nextStep.icon}</span></div>
        <strong className="cp-today-next-title">{nextStep.title}</strong>
        <p>{nextStep.detail}</p>
        <button className="cp-button cp-today-next-action" onClick={() => nextStep.route === "__monitor" ? onOpenMonitor() : onNavigate(nextStep.route)}>{nextStep.action}<ArrowRight size={16} /></button>
        <span className="cp-today-next-note">Nothing is required. Add only the information you want to keep.</span>
      </article>
    </section>

    <section className="cp-today-actions-section">
      <div className="cp-today-section-heading"><div><span className="cp-eyebrow">START WITH ONE TAP</span><h2>What would help right now?</h2></div><p>Choose a task. You can always come back here.</p></div>
      <div className="cp-today-actions-grid">
        <QuickAction icon={<Search />} label="Ask CARE CONNECTED" detail="Find a clear starting point" tone="violet" onClick={() => onNavigate("ASK CARE CONNECTED")} />
        <QuickAction icon={<ScanLine />} label="Scan a document" detail="Read and review a file" tone="blue" onClick={() => onNavigate("Scan & Upload")} />
        <QuickAction icon={<HeartPulse />} label="Add a health reading" detail="Type or speak a value" tone="rose" onClick={onOpenMonitor} />
        <QuickAction icon={<Pill />} label="My medicines" detail="Review my saved list" tone="mint" onClick={() => onNavigate("My Medicines")} />
      </div>
    </section>

    <DiscoverCarousel onNavigate={onNavigate} />

    <section className="cp-today-records">
      <div className="cp-today-records-heading"><div><span className="cp-eyebrow">YOUR PERSONAL RECORD</span><h2>Recent readings</h2></div>{personalReadings.length > 0 && <button className="cp-today-manage" onClick={() => onNavigate("Health Timeline")}>View timeline <ArrowRight size={14} /></button>}</div>
      {latestReadings.length ? <div className="cp-today-reading-list">{latestReadings.map((reading) => <button className="cp-today-reading" key={reading.id} onClick={() => onNavigate("Health Tracker")}><span className="cp-today-reading-symbol">{reading.metric === "Blood Pressure" ? <HeartPulse size={18} /> : <Activity size={18} />}</span><span><strong>{reading.metric}</strong><small>{reading.date === today ? "Today" : reading.date} · {reading.time}</small></span><b>{reading.value}{reading.secondValue !== undefined ? " / " + reading.secondValue : ""}<small> {reading.unit}</small></b><ArrowRight size={16} /></button>)}</div> : <div className="cp-today-record-empty"><span className="cp-today-empty-icon"><Activity size={19} /></span><div><strong>No personal readings yet</strong><p>Only values you enter will appear here. CARE CONNECTED will not interpret or label them normal or abnormal.</p></div><button className="cp-button cp-today-outline" onClick={onOpenMonitor}>Add a reading <Plus size={15} /></button></div>}
    </section>
  </>;
}
function DiscoverCarousel({ onNavigate }: { onNavigate: (section: string) => void }) {
  const cards = [
    { title: "CARE CONNECTED EASY", text: "A calmer way to use your health workspace", detail: "Large controls, read-aloud support, and clear next steps.", action: "Turn on Easy mode", route: "__easy", icon: <Accessibility size={24} />, tone: "mint" },
    { title: "ASK CARE CONNECTED", text: "Find information with a safer starting point", detail: "Read curated answers and official sources. Your typed question stays on this device.", action: "Open ASK CARE CONNECTED", route: "ASK CARE CONNECTED", icon: <Search size={24} />, tone: "violet" },
    { title: "LEARN WITH AUDIO & VIDEO", text: "Play a clip and find the moment you need", detail: "Add a device-local video or audio clip, search its captions, and hear matching lines.", action: "Open learning studio", route: "Learn", icon: <BookOpen size={24} />, tone: "blue" },
    { title: "SAFETY REVIEW", text: "See what needs a second look", detail: "Review missing notes, repeated names, and questions for a professional.", action: "Review my list", route: "Safety Check", icon: <ShieldCheck size={24} />, tone: "amber" },
    { title: "HEALTH JOURNEY", text: "Keep the story together", detail: "Bring readings, documents, and personal notes into one timeline.", action: "Open timeline", route: "Health Timeline", icon: <Clock3 size={24} />, tone: "blue" },
    { title: "CARE CIRCLE", text: "Keep support close", detail: "Save optional care-team and trusted-contact details on this device.", action: "Open Care Circle", route: "Care Circle", icon: <Users size={24} />, tone: "rose" },
    { title: "VISIT PREP", text: "Walk into conversations prepared", detail: "Build a concise, print-ready brief from your own saved notes.", action: "Build a visit brief", route: "Visit Prep", icon: <Stethoscope size={24} />, tone: "teal" },
    { title: "SYMPTOM GUIDE", text: "Put what you feel into clear words", detail: "Record a symptom, its timing, and a question for your care team.", action: "Start a symptom note", route: "Symptom Guide", icon: <HeartPulse size={24} />, tone: "rose" },
    { title: "SCAN · REVIEW · CONFIRM", text: "Keep document details under your control", detail: "Add a document reference and review each detail before saving it.", action: "Open Scan & Upload", route: "Scan & Upload", icon: <ScanLine size={24} />, tone: "blue" },
  ];
  const [index, setIndex] = useState(() => readStored<number>("carepath_discover_index", 0) % cards.length);
  const touchStartX = useRef<number | null>(null);
  const card = cards[index];
  const move = (offset: number) => setIndex((current) => {
    const next = (current + offset + cards.length) % cards.length;
    try { localStorage.setItem("carepath_discover_index", JSON.stringify(next)); } catch { /* Optional preference. */ }
    return next;
  });
  return <section className="cp-discover" aria-roledescription="carousel" aria-label="Discover CARE CONNECTED features" onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.screenX ?? null; }} onTouchEnd={(event) => { const startX = touchStartX.current; touchStartX.current = null; const endX = event.changedTouches[0]?.screenX; if (startX === null || endX === undefined) return; const distance = startX - endX; if (Math.abs(distance) > 48) move(distance > 0 ? 1 : -1); }}><div className="cp-discover-copy"><span className="cp-eyebrow">DISCOVER CARE CONNECTED ✨</span><h2 aria-live="polite">{card.text}</h2><p>{card.detail}</p><div className="cp-discover-actions"><button className="cp-button primary" onClick={() => card.route === "__easy" ? document.querySelector<HTMLButtonElement>(".cp-accessibility-bar button")?.click() : onNavigate(card.route)}>{card.action}<ArrowRight size={15} /></button><span>{index + 1} / {cards.length}</span></div></div><div className={`cp-discover-art ${card.tone}`}><span>{card.icon}</span><strong>{card.title}</strong><small>PERSONAL ORGANIZATION · DEMO SAFE</small></div><div className="cp-discover-controls"><button onClick={() => move(-1)} aria-label="Previous CARE CONNECTED feature"><ChevronLeft size={17} /></button><button onClick={() => move(1)} aria-label="Next CARE CONNECTED feature"><ChevronRight size={17} /></button></div><div className="cp-discover-dots" role="tablist" aria-label="Choose a CARE CONNECTED feature">{cards.map((item, itemIndex) => <button key={item.title} className={itemIndex === index ? "active" : ""} role="tab" aria-selected={itemIndex === index} aria-label={`Show ${item.title}`} onClick={() => { setIndex(itemIndex); try { localStorage.setItem("carepath_discover_index", JSON.stringify(itemIndex)); } catch { /* Optional preference. */ } }} />)}</div></section>;
}

function QuickAction({ icon, label, detail, tone, onClick }: { icon: ReactNode; label: string; detail: string; tone: string; onClick: () => void }) { return <button className="cp-quick-action" onClick={onClick}><span className={`cp-quick-icon ${tone}`}>{icon}</span><strong>{label}</strong><small>{detail}</small><ArrowRight size={14} /></button>; }

function ModuleLoading({ overlay = false }: { overlay?: boolean }) { return <div className={`cp-loading ${overlay ? "overlay" : ""}`}><span /><strong>Opening your workspace…</strong></div>; }

export default App;

