import { useEffect, useMemo, useState } from "react";
import CareGuide from "./CareGuide";
import SymptomGuide from "./SymptomGuide";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import {
  Activity,
  AlarmClock,
  ArrowDownToLine,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CircleAlert,
  Clock3,
  Copy,
  FileCheck2,
  FileImage,
  FilePlus2,
  Heart,
  HeartPulse,
  Info,
  ListChecks,
  LocateFixed,
  MapPin,
  MapPinned,
  MessageCircle,
  MessageSquareText,
  Pill,
  Plus,
  Phone,
  Printer,
  ScanLine,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  Upload,
  Users,
} from "lucide-react";

type Medicine = {
  id: string;
  name: string;
  strength: string;
  form: string;
  schedule: string;
  instructions: string;
  remainingUnits?: number;
  unitsPerDay?: number;
  expiryDate?: string;
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

type Profile = {
  name: string;
  age: string;
  bloodType: string;
  allergies: string;
  conditions: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  clinician: string;
  clinicianPhone: string;
  pharmacy: string;
  pharmacyPhone: string;
  locationHint: string;
};

type DocumentRecord = {
  id: string;
  name: string;
  kind: string;
  date: string;
  status: string;
  fields: string[];
};

type ReportResult = { id: string; test: string; value: number; unit: string; date: string };
type SymptomEntry = { id: string; symptom: string; person: string; ageGroup: string; duration: string; measurement: string; measurementUnit: string; notes: string; date: string; time: string };

type MedicationEvent = {
  id: string;
  medicine: string;
  time: string;
  date: string;
  status: "Taken" | "Skipped" | "Remind Later" | "Not Sure";
};

type Props = {
  active: string;
  medicineCount: number;
  onOpenMedicines: () => void;
  onOpenMonitor: () => void;
  onScheduleReview: (medicine: string, at: string) => void;
  onNavigate: (section: string) => void;
};

const DEFAULT_PROFILE: Profile = {
  name: "Demo User",
  age: "",
  bloodType: "Not provided",
  allergies: "",
  conditions: "",
  emergencyName: "",
  emergencyRelation: "",
  emergencyPhone: "",
  clinician: "",
  clinicianPhone: "",
  pharmacy: "",
  pharmacyPhone: "",
  locationHint: "",
};

const EXTRACTED_SAMPLE = [
  { name: "Amlodipine", strength: "5 mg", form: "Tablet", schedule: "8:00 AM", instructions: "Morning" },
  { name: "Atorvastatin", strength: "10 mg", form: "Tablet", schedule: "10:00 PM", instructions: "Night" },
  { name: "Metformin", strength: "500 mg", form: "Tablet", schedule: "1:00 PM", instructions: "After food" },
];

const DEFAULT_MEDICINES: Medicine[] = [
  { id: "2", name: "Amlodipine", strength: "5 mg", form: "Tablet", schedule: "8:00 AM", instructions: "Morning" },
  { id: "3", name: "Atorvastatin", strength: "10 mg", form: "Tablet", schedule: "10:00 PM", instructions: "Night" },
  { id: "4", name: "Metformin", strength: "500 mg", form: "Tablet", schedule: "1:00 PM", instructions: "After food" },
];

function sampleReadings(): HealthReading[] {
  const date = (offset: number) => {
    const value = new Date();
    value.setDate(value.getDate() + offset);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  };
  return [
    { id: "demo-1", metric: "Blood Pressure", value: 128, secondValue: 82, unit: "mmHg", date: date(0), time: "08:30", note: "Morning reading" },
    { id: "demo-2", metric: "Blood Pressure", value: 124, secondValue: 80, unit: "mmHg", date: date(-1), time: "08:20", note: "Morning reading" },
    { id: "demo-3", metric: "Blood Pressure", value: 130, secondValue: 84, unit: "mmHg", date: date(-2), time: "08:45", note: "Morning reading" },
    { id: "demo-4", metric: "Blood Pressure", value: 126, secondValue: 81, unit: "mmHg", date: date(-3), time: "09:00", note: "Morning reading" },
    { id: "demo-5", metric: "Blood Glucose", value: 96, unit: "mg/dL", date: date(0), time: "07:45", note: "Fasting" },
    { id: "demo-6", metric: "Pulse", value: 74, unit: "bpm", date: date(0), time: "08:35", note: "Resting" },
    { id: "demo-7", metric: "SpO₂", value: 98, unit: "%", date: date(0), time: "08:40", note: "Resting" },
    { id: "demo-8", metric: "Temperature", value: 36.7, unit: "°C", date: date(0), time: "08:42", note: "Morning" },
    { id: "demo-9", metric: "Weight", value: 68.4, unit: "kg", date: date(0), time: "07:30", note: "Morning" },
    { id: "demo-10", metric: "Steps", value: 4200, unit: "steps", date: date(0), time: "08:45", note: "Illustrative daily count" },
  ];
}

const DEFAULT_READINGS = sampleReadings();

const todayISO = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem("carepath_last_local_save", new Date().toISOString());
    return true;
  } catch {
    return false;
  }
}

function dateLabel(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function PageHeader({ eyebrow, title, description, icon, action }: { eyebrow: string; title: string; description: string; icon: ReactNode; action?: ReactNode }) {
  return (
    <header className="cp-page-header">
      <div className="cp-page-title-icon">{icon}</div>
      <div className="cp-page-copy">
        <span className="cp-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="cp-page-action">{action}</div>}
    </header>
  );
}

function Panel({ title, eyebrow, children, className = "" }: { title: string; eyebrow?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`cp-panel ${className}`}>
      <div className="cp-panel-heading">
        <div>{eyebrow && <span className="cp-eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>
      </div>
      {children}
    </section>
  );
}

function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warm" | "good" }) {
  const Icon = tone === "good" ? CheckCircle2 : tone === "warm" ? CircleAlert : Info;
  return <div className={`cp-notice ${tone}`}><Icon size={17} /><p>{children}</p></div>;
}

export default function CarePathModules({ active, medicineCount, onOpenMedicines, onOpenMonitor, onScheduleReview, onNavigate }: Props) {
  const [refresh, setRefresh] = useState(0);
  const medicines = useMemo(() => readStored<Medicine[]>("carepath_medicines", DEFAULT_MEDICINES), [medicineCount, refresh]);
  const readings = useMemo(() => readStored<HealthReading[]>("carepath_health_readings", DEFAULT_READINGS), [refresh]);
  const documents = useMemo(() => readStored<DocumentRecord[]>("carepath_documents", []), [refresh]);
  const profile = useMemo(() => ({ ...DEFAULT_PROFILE, ...readStored<Profile>("carepath_profile", DEFAULT_PROFILE) }), [refresh]);
  const medEvents = useMemo(() => readStored<MedicationEvent[]>("carepath_medication_log", []), [refresh]);
  const bump = () => setRefresh((current) => current + 1);

  useEffect(() => {
    const handleStorage = () => bump();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("carepath:refresh", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("carepath:refresh", handleStorage);
    };
  }, []);

  const shared = { medicines, readings, documents, profile, medEvents, bump, onOpenMedicines, onOpenMonitor, onScheduleReview, onNavigate };

  return (
    <div className="cp-module">
      {active === "Care Guide" && <CareGuide />}
      {active === "Symptom Guide" && <SymptomGuide onNavigate={onNavigate} />}
      {active === "Official Sources" && <OfficialSources {...shared} />}
      {active === "ASK CAREPATH" && <AskCarepath {...shared} />}
      {active === "My Medicines" && <MedicinePassport {...shared} />}
      {active === "Scan & Upload" && <Scanner {...shared} />}
      {active === "Medicine Passport" && <MedicinePassport {...shared} />}
      {active === "Safety Check" && <SafetyReview {...shared} />}
      {active === "Medication Changes" && <MedicationChanges {...shared} />}
      {(active === "Monitor" || active === "Health Tracker") && <HealthTracker {...shared} />}
      {active === "Health Timeline" && <Timeline {...shared} />}
      {active === "Health Calendar" && <HealthCalendar {...shared} />}
      {active === "Health Map" && <HealthMap {...shared} />}
      {active === "Tests & Reports" && <Reports {...shared} />}
      {active === "Visit Prep" && <VisitPrep {...shared} />}
      {active === "Care Circle" && <CareCircle {...shared} />}
      {active === "Safety Alerts" && <SafetyAlerts {...shared} />}
      {active === "Emergency Help" && <Emergency {...shared} />}
      {active === "Learn" && <Learn {...shared} />}
      {active === "Settings" && <SettingsPage {...shared} />}
    </div>
  );
}

type Shared = {
  medicines: Medicine[];
  readings: HealthReading[];
  documents: DocumentRecord[];
  profile: Profile;
  medEvents: MedicationEvent[];
  bump: () => void;
  onOpenMedicines: () => void;
  onOpenMonitor: () => void;
  onScheduleReview: (medicine: string, at: string) => void;
  onNavigate: (section: string) => void;
};

const MEDICINE_MARKETS = [
  { id: "global", label: "Global · WHO", url: "https://www.who.int/", sources: ["who.int", "fda.gov", "open.fda.gov", "cdsco.gov.in", "ema.europa.eu", "gov.uk", "canada.ca", "tga.gov.au", "pmda.go.jp"] },
  { id: "india", label: "India · CDSCO", url: "https://cdsco.gov.in/opencms/opencms/en/Approval_new/Approved-New-Drugs/", sources: ["cdsco.gov.in", "nppaindia.nic.in"] },
  { id: "us", label: "United States · FDA", url: "https://www.fda.gov/drugs/development-approval-process-drugs/drug-approvals-and-databases", sources: ["fda.gov", "open.fda.gov"] },
  { id: "uk", label: "United Kingdom · MHRA / NHS", url: "https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency", sources: ["gov.uk", "nhs.uk", "medicines.org.uk"] },
  { id: "eu", label: "European Union · EMA", url: "https://www.ema.europa.eu/en/medicines", sources: ["ema.europa.eu", "europa.eu"] },
  { id: "canada", label: "Canada · Health Canada", url: "https://health-products.canada.ca/dpd-bdpp/index-eng.jsp", sources: ["canada.ca"] },
  { id: "australia", label: "Australia · TGA", url: "https://www.tga.gov.au/resources/artg", sources: ["tga.gov.au"] },
  { id: "japan", label: "Japan · PMDA", url: "https://www.pmda.go.jp/english/", sources: ["pmda.go.jp"] },
] as const;

const HEALTH_SOURCES = ["who.int", "cancer.gov", "medlineplus.gov", "nhs.uk"];

type AskLanguage = "en" | "kn";
type AskCopy = { title: string; summary: string; points: string[]; source: string; url: string; next: string; route: string };
type AskGuide = { terms: string[]; en: AskCopy; kn: AskCopy };

const ASK_GUIDES: AskGuide[] = [
  {
    terms: ["emergency", "can't breathe", "cannot breathe", "chest pain", "unconscious", "seizure", "ತುರ್ತು", "ಉಸಿರಾಟ", "ಎದೆ ನೋವು"],
    en: { title: "Get urgent help now", summary: "If someone may be in immediate danger, contact local emergency services. CAREPATH cannot assess or call for you.", points: ["Use the emergency number for your location. In India, call 112.", "Do not wait for an app response if symptoms are severe or rapidly worsening."], source: "India Emergency Response Support System · 112", url: "https://112.gov.in/", next: "Open emergency card", route: "Emergency Help" },
    kn: { title: "ಈಗಲೇ ತುರ್ತು ಸಹಾಯ ಪಡೆಯಿರಿ", summary: "ಯಾರಾದರೂ ತಕ್ಷಣದ ಅಪಾಯದಲ್ಲಿದ್ದರೆ ಸ್ಥಳೀಯ ತುರ್ತು ಸೇವೆಗೆ ಕರೆ ಮಾಡಿ. CAREPATH ನಿಮ್ಮ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಲು ಅಥವಾ ಕರೆ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ.", points: ["ನಿಮ್ಮ ಪ್ರದೇಶದ ತುರ್ತು ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ. ಭಾರತದಲ್ಲಿ 112 ಕರೆ ಮಾಡಿ.", "ಲಕ್ಷಣಗಳು ತೀವ್ರವಾಗಿದ್ದರೆ ಅಥವಾ ಬೇಗ ಹದಗೆಟ್ಟರೆ ಆಪ್ ಉತ್ತರಕ್ಕಾಗಿ ಕಾಯಬೇಡಿ."], source: "ಭಾರತದ ತುರ್ತು ಪ್ರತಿಕ್ರಿಯೆ ಸಹಾಯ ವ್ಯವಸ್ಥೆ · 112", url: "https://112.gov.in/", next: "ತುರ್ತು ಕಾರ್ಡ್ ತೆರೆಯಿರಿ", route: "Emergency Help" },
  },
  {
    terms: ["missed dose", "missed my dose", "missed my medicine", "missed a dose", "miss a dose", "forgot my medicine", "forgot my dose", "forgot to take", "forgot dose", "skip a dose", "extra dose", "double dose", "ಔಷಧಿ ಮರೆತು", "ಮಾತ್ರೆ ಮರೆತು", "ಮಾತ್ರೆ ಮಿಸ್ ಆಯಿತು", "ಮಿಸ್ ಆದ ಡೋಸ್"],
    en: { title: "If you missed or are unsure about a dose", summary: "The right instructions depend on the exact medicine and timing, so this guide will not tell you to take, skip, or repeat a dose.", points: ["Read the leaflet or current prescription for that exact medicine.", "If it is unclear, ask a pharmacist or prescriber. Do not guess or double a dose unless your prescriber specifically tells you to."], source: "NHS Specialist Pharmacy Service · missed or delayed doses", url: "https://sps.nhs.uk/articles/advising-on-missed-or-delayed-doses-of-medicines/", next: "Record what happened", route: "Safety Alerts" },
    kn: { title: "ಡೋಸ್ ಮರೆತಿದ್ದರೆ ಅಥವಾ ಖಚಿತವಿಲ್ಲದಿದ್ದರೆ", summary: "ಸರಿಯಾದ ಸೂಚನೆ ಔಷಧಿ ಮತ್ತು ಸಮಯದ ಮೇಲೆ ಅವಲಂಬಿತ. ಈ ಮಾರ್ಗದರ್ಶಿ ಡೋಸ್ ತೆಗೆದುಕೊಳ್ಳಿ, ಬಿಡಿ ಅಥವಾ ಮರುತೆಗೆದುಕೊಳ್ಳಿ ಎಂದು ಹೇಳುವುದಿಲ್ಲ.", points: ["ಆ ಔಷಧಿಯ ಪ್ಯಾಕೆಟ್‌ನಲ್ಲಿರುವ ಕರಪತ್ರ ಅಥವಾ ಇತ್ತೀಚಿನ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ನೋಡಿ.", "ಸ್ಪಷ್ಟವಾಗದಿದ್ದರೆ ಫಾರ್ಮಸಿಸ್ಟ್ ಅಥವಾ ವೈದ್ಯರನ್ನು ಕೇಳಿ. ವೈದ್ಯರು ಹೇಳದಿದ್ದರೆ ಊಹಿಸಿ ಅಥವಾ ಎರಡು ಡೋಸ್ ತೆಗೆದುಕೊಳ್ಳಬೇಡಿ."], source: "NHS Specialist Pharmacy Service · ಮರೆತ ಅಥವಾ ತಡವಾದ ಡೋಸ್", url: "https://sps.nhs.uk/articles/advising-on-missed-or-delayed-doses-of-medicines/", next: "ಏನಾಯಿತು ಎಂದು ದಾಖಲಿಸಿ", route: "Safety Alerts" },
  },
  {
    terms: ["cancer", "chemotherapy", "chemo", "oncology", "ಕ್ಯಾನ್ಸರ್", "ಕಿಮೋ"],
    en: { title: "Keep your cancer-care plan close", summary: "During some cancer treatments, infections can become serious. Use the fever and after-hours instructions from your oncology team.", points: ["Save your oncology team's urgent phone number and written instructions.", "Contact the team promptly for concerns named in your plan. CAREPATH cannot set a safe temperature threshold or advise changing treatment."], source: "National Cancer Institute · Infection and cancer treatment", url: "https://www.cancer.gov/about-cancer/treatment/side-effects/infection", next: "Add a care-team contact", route: "Care Circle" },
    kn: { title: "ಕ್ಯಾನ್ಸರ್ ಆರೈಕೆ ಯೋಜನೆಯನ್ನು ಹತ್ತಿರದಲ್ಲಿಡಿ", summary: "ಕೆಲವು ಕ್ಯಾನ್ಸರ್ ಚಿಕಿತ್ಸೆಗಳ ಸಮಯದಲ್ಲಿ ಸೋಂಕು ಗಂಭೀರವಾಗಬಹುದು. ಜ್ವರ ಅಥವಾ ಕೆಲಸದ ಸಮಯದ ನಂತರದ ಸೂಚನೆಗಳಿಗೆ ನಿಮ್ಮ ಕ್ಯಾನ್ಸರ್ ತಂಡದ ಯೋಜನೆಯನ್ನು ಅನುಸರಿಸಿ.", points: ["ನಿಮ್ಮ ಕ್ಯಾನ್ಸರ್ ತಂಡದ ತುರ್ತು ಫೋನ್ ಸಂಖ್ಯೆ ಮತ್ತು ಲಿಖಿತ ಸೂಚನೆಗಳನ್ನು ಉಳಿಸಿ.", "ನಿಮ್ಮ ಯೋಜನೆಯಲ್ಲಿ ಹೇಳಿರುವ ಚಿಂತೆಗಳಿದ್ದರೆ ತಂಡವನ್ನು ತಕ್ಷಣ ಸಂಪರ್ಕಿಸಿ. CAREPATH ಸುರಕ್ಷಿತ ತಾಪಮಾನ ಮಿತಿ ಅಥವಾ ಚಿಕಿತ್ಸೆ ಬದಲಾವಣೆಯನ್ನು ಸೂಚಿಸುವುದಿಲ್ಲ."], source: "National Cancer Institute · ಕ್ಯಾನ್ಸರ್ ಚಿಕಿತ್ಸೆ ಮತ್ತು ಸೋಂಕು", url: "https://www.cancer.gov/about-cancer/treatment/side-effects/infection", next: "ಆರೈಕೆ ತಂಡದ ಸಂಪರ್ಕ ಸೇರಿಸಿ", route: "Care Circle" },
  },
  {
    terms: ["diabetes", "blood sugar", "glucose", "sugar", "insulin", "ಮಧುಮೇಹ", "ರಕ್ತದ ಸಕ್ಕರೆ", "ಸಕ್ಕರೆ"],
    en: { title: "Keep your diabetes plan personal", summary: "Diabetes care can include medicines, monitoring, food, movement, and regular check-ups. The right targets and schedule depend on your own care plan.", points: ["Use your diabetes team's written plan for what and when to measure.", "Record values with date, time, and context. Do not change insulin or other medicines based on this app."], source: "World Health Organization · Diabetes", url: "https://www.who.int/news-room/fact-sheets/detail/diabetes", next: "Open health tracker", route: "Health Tracker" },
    kn: { title: "ನಿಮ್ಮ ಮಧುಮೇಹ ಯೋಜನೆ ವೈಯಕ್ತಿಕವಾಗಿರಲಿ", summary: "ಮಧುಮೇಹ ಆರೈಕೆಯಲ್ಲಿ ಔಷಧಿ, ಪರಿಶೀಲನೆ, ಆಹಾರ, ಚಟುವಟಿಕೆ ಮತ್ತು ನಿಯಮಿತ ತಪಾಸಣೆ ಇರಬಹುದು. ಸರಿಯಾದ ಗುರಿ ಮತ್ತು ಸಮಯ ನಿಮ್ಮ ಆರೈಕೆ ಯೋಜನೆಗೆ ಅವಲಂಬಿತ.", points: ["ಏನು ಮತ್ತು ಯಾವಾಗ ಅಳೆಯಬೇಕು ಎಂಬುದಕ್ಕೆ ನಿಮ್ಮ ಮಧುಮೇಹ ತಂಡದ ಲಿಖಿತ ಯೋಜನೆ ಬಳಸಿ.", "ದಿನಾಂಕ, ಸಮಯ ಮತ್ತು ಸಂದರ್ಭದೊಂದಿಗೆ ಮೌಲ್ಯಗಳನ್ನು ದಾಖಲಿಸಿ. ಈ ಆಪ್ ಆಧರಿಸಿ ಇನ್ಸುಲಿನ್ ಅಥವಾ ಬೇರೆ ಔಷಧಿ ಬದಲಿಸಬೇಡಿ."], source: "World Health Organization · ಮಧುಮೇಹ", url: "https://www.who.int/news-room/fact-sheets/detail/diabetes", next: "ಆರೋಗ್ಯ ಟ್ರ್ಯಾಕರ್ ತೆರೆಯಿರಿ", route: "Health Tracker" },
  },
  {
    terms: ["blood pressure", "hypertension", "bp", "ರಕ್ತದೊತ್ತಡ", "ಬಿಪಿ"],
    en: { title: "Track blood pressure with context", summary: "A record is most useful when it follows the measurement plan your care team gave you. CAREPATH does not interpret a reading or set a target.", points: ["Record the date, time, and any context your clinician asked you to note.", "Bring repeated readings and your monitor instructions to your clinician or pharmacist before changing treatment."], source: "World Health Organization · Hypertension", url: "https://www.who.int/news-room/fact-sheets/detail/hypertension", next: "Open blood pressure tracker", route: "Health Tracker" },
    kn: { title: "ರಕ್ತದೊತ್ತಡವನ್ನು ಸಂದರ್ಭದೊಂದಿಗೆ ದಾಖಲಿಸಿ", summary: "ನಿಮ್ಮ ಆರೈಕೆ ತಂಡದ ಅಳತೆ ಯೋಜನೆಯನ್ನು ಅನುಸರಿಸಿದಾಗ ದಾಖಲೆಯು ಹೆಚ್ಚು ಉಪಯುಕ್ತ. CAREPATH ಮೌಲ್ಯವನ್ನು ಅರ್ಥೈಸುವುದಿಲ್ಲ ಅಥವಾ ಗುರಿ ನಿಗದಿಪಡಿಸುವುದಿಲ್ಲ.", points: ["ದಿನಾಂಕ, ಸಮಯ ಮತ್ತು ವೈದ್ಯರು ದಾಖಲಿಸಲು ಹೇಳಿದ ಸಂದರ್ಭವನ್ನು ಸೇರಿಸಿ.", "ಚಿಕಿತ್ಸೆ ಬದಲಿಸುವ ಮೊದಲು ಮರುಮರು ಅಳತೆಗಳನ್ನು ಮತ್ತು ಸಾಧನದ ಸೂಚನೆಗಳನ್ನು ವೈದ್ಯರು ಅಥವಾ ಫಾರ್ಮಸಿಸ್ಟ್‌ಗೆ ತೋರಿಸಿ."], source: "World Health Organization · ಅಧಿಕ ರಕ್ತದೊತ್ತಡ", url: "https://www.who.int/news-room/fact-sheets/detail/hypertension", next: "ರಕ್ತದೊತ್ತಡ ಟ್ರ್ಯಾಕರ್ ತೆರೆಯಿರಿ", route: "Health Tracker" },
  },
  {
    terms: ["expiry", "expired", "expiration", "out of date", "medicine date", "ಅವಧಿ ಮುಗಿದ", "ಅವಧಿ ದಿನಾಂಕ"],
    en: { title: "Check the package expiry and storage", summary: "A medicine's labelled expiry and storage conditions matter. CAREPATH cannot tell whether a particular pack is still suitable.", points: ["Compare the printed date and storage directions on the original pack.", "Ask a pharmacist about an expired or damaged pack and how to dispose of it in your area."], source: "U.S. Food and Drug Administration · Expiration dates", url: "https://www.fda.gov/drugs/pharmaceutical-quality-resources/expiration-dates-questions-and-answers", next: "Review stock and expiry notes", route: "My Medicines" },
    kn: { title: "ಪ್ಯಾಕೆಟ್‌ನ ಅವಧಿ ಮತ್ತು ಸಂಗ್ರಹಣೆಯನ್ನು ಪರಿಶೀಲಿಸಿ", summary: "ಔಷಧಿಯ ಮೇಲೆ ಮುದ್ರಿಸಿದ ಅವಧಿ ಮತ್ತು ಸಂಗ್ರಹಣೆ ಸೂಚನೆ ಮುಖ್ಯ. ನಿರ್ದಿಷ್ಟ ಪ್ಯಾಕ್ ಇನ್ನೂ ಬಳಸಲು ಸರಿಯೇ ಎಂದು CAREPATH ಹೇಳಲಾರದು.", points: ["ಮೂಲ ಪ್ಯಾಕೆಟ್‌ನ ದಿನಾಂಕ ಮತ್ತು ಸಂಗ್ರಹಣೆ ಸೂಚನೆ ನೋಡಿ.", "ಅವಧಿ ಮುಗಿದ ಅಥವಾ ಹಾನಿಯಾದ ಪ್ಯಾಕ್ ಬಗ್ಗೆ ಮತ್ತು ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಅದನ್ನು ಹೇಗೆ ವಿಲೇವಾರಿ ಮಾಡಬೇಕು ಎಂದು ಫಾರ್ಮಸಿಸ್ಟ್ ಅನ್ನು ಕೇಳಿ."], source: "U.S. Food and Drug Administration · ಅವಧಿ ದಿನಾಂಕಗಳು", url: "https://www.fda.gov/drugs/pharmaceutical-quality-resources/expiration-dates-questions-and-answers", next: "ಸ್ಟಾಕ್ ಮತ್ತು ಅವಧಿ ಟಿಪ್ಪಣಿಗಳನ್ನು ನೋಡಿ", route: "My Medicines" },
  },
  {
    terms: ["lab", "test result", "blood test", "report", "result range", "ಪರೀಕ್ಷಾ ವರದಿ", "ರಕ್ತ ಪರೀಕ್ಷೆ", "ಲ್ಯಾಬ್"],
    en: { title: "Read a lab report with your care team", summary: "A lab result is only one part of a health picture. Reference ranges and units can vary between tests and laboratories.", points: ["Check the units and reference range printed on your own report.", "Ask the ordering clinician what the result means for you; CAREPATH will not label it normal or diagnose from a number."], source: "MedlinePlus · How to understand your lab results", url: "https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/", next: "Open tests and reports", route: "Tests & Reports" },
    kn: { title: "ಲ್ಯಾಬ್ ವರದಿಯನ್ನು ಆರೈಕೆ ತಂಡದೊಂದಿಗೆ ಓದಿ", summary: "ಲ್ಯಾಬ್ ಫಲಿತಾಂಶವು ಆರೋಗ್ಯದ ಸಂಪೂರ್ಣ ಚಿತ್ರವಲ್ಲ. ಪರೀಕ್ಷೆ ಮತ್ತು ಪ್ರಯೋಗಾಲಯದ ಪ್ರಕಾರ ಉಲ್ಲೇಖ ಮಿತಿಗಳು ಮತ್ತು ಘಟಕಗಳು ಬದಲಾಗಬಹುದು.", points: ["ನಿಮ್ಮ ವರದಿಯಲ್ಲಿ ಮುದ್ರಿಸಿರುವ ಘಟಕಗಳು ಮತ್ತು ಉಲ್ಲೇಖ ಮಿತಿಯನ್ನು ನೋಡಿ.", "ಫಲಿತಾಂಶ ನಿಮಗೆ ಏನು ಅರ್ಥ ಎಂದು ಪರೀಕ್ಷೆ ಕೇಳಿದ ವೈದ್ಯರನ್ನು ಕೇಳಿ; CAREPATH ಸಂಖ್ಯೆಯನ್ನು ಸಾಮಾನ್ಯ ಎಂದು ಗುರುತಿಸುವುದಿಲ್ಲ ಅಥವಾ ರೋಗ ನಿರ್ಣಯಿಸುವುದಿಲ್ಲ."], source: "MedlinePlus · ಲ್ಯಾಬ್ ಫಲಿತಾಂಶವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವುದು", url: "https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/", next: "ಪರೀಕ್ಷೆಗಳು ಮತ್ತು ವರದಿಗಳನ್ನು ತೆರೆಯಿರಿ", route: "Tests & Reports" },
  },
  {
    terms: ["cold", "common cold", "fever", "flu", "ಶೀತ", "ಜ್ವರ"],
    en: { title: "For a mild cold, use trusted self-care guidance", summary: "Many short-lived colds improve with time. Your age, health conditions, and treatment can change what advice is right for you.", points: ["Use a trusted local health service for self-care advice that fits your situation.", "Seek urgent help for severe or rapidly worsening symptoms; contact your care team sooner if you have a long-term condition or cancer treatment plan."], source: "NHS · Common cold", url: "https://www.nhs.uk/conditions/common-cold/", next: "Open everyday health guide", route: "Learn" },
    kn: { title: "ಸೌಮ್ಯ ಶೀತಕ್ಕೆ ವಿಶ್ವಾಸಾರ್ಹ ಸ್ವ-ಆರೈಕೆ ಮಾಹಿತಿ ಬಳಸಿ", summary: "ಅನೇಕ ತಾತ್ಕಾಲಿಕ ಶೀತಗಳು ಕಾಲಕ್ರಮೇಣ ಸುಧಾರಿಸುತ್ತವೆ. ವಯಸ್ಸು, ಆರೋಗ್ಯ ಸ್ಥಿತಿ ಮತ್ತು ಚಿಕಿತ್ಸೆ ಯಾವ ಸಲಹೆ ಸೂಕ್ತವೆಂಬುದನ್ನು ಬದಲಾಯಿಸಬಹುದು.", points: ["ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿಗೆ ಹೊಂದುವ ಸ್ವ-ಆರೈಕೆ ಸಲಹೆಗೆ ವಿಶ್ವಾಸಾರ್ಹ ಸ್ಥಳೀಯ ಆರೋಗ್ಯ ಸೇವೆ ಬಳಸಿ.", "ತೀವ್ರ ಅಥವಾ ಬೇಗ ಹದಗೆಡುವ ಲಕ್ಷಣಗಳಿಗೆ ತುರ್ತು ಸಹಾಯ ಪಡೆಯಿರಿ; ದೀರ್ಘಕಾಲದ ಸ್ಥಿತಿ ಅಥವಾ ಕ್ಯಾನ್ಸರ್ ಚಿಕಿತ್ಸೆಯಿದ್ದರೆ ನಿಮ್ಮ ಆರೈಕೆ ತಂಡವನ್ನು ಬೇಗ ಸಂಪರ್ಕಿಸಿ."], source: "NHS · ಸಾಮಾನ್ಯ ಶೀತ", url: "https://www.nhs.uk/conditions/common-cold/", next: "ದೈನಂದಿನ ಆರೋಗ್ಯ ಮಾರ್ಗದರ್ಶಿ ತೆರೆಯಿರಿ", route: "Learn" },
  },
];

const ASK_FALLBACK: Record<AskLanguage, AskCopy> = {
  en: { title: "I don’t have a verified answer for that yet", summary: "This on-device guide covers a few common topics. It cannot answer every question, identify a tablet, check interactions, or give personal treatment advice.", points: ["For a specific medicine, check the leaflet and your country's regulator register, or ask a pharmacist.", "For a personal health question, contact your care team. If it may be an emergency, contact local emergency services."], source: "MedlinePlus · Medicines", url: "https://medlineplus.gov/druginformation.html", next: "Prepare a question for my visit", route: "Visit Prep" },
  kn: { title: "ಇದಕ್ಕೆ ಪರಿಶೀಲಿಸಿದ ಉತ್ತರ ನನ್ನ ಬಳಿ ಇನ್ನೂ ಇಲ್ಲ", summary: "ಈ ಸಾಧನದಲ್ಲಿರುವ ಮಾರ್ಗದರ್ಶಿ ಕೆಲವು ಸಾಮಾನ್ಯ ವಿಷಯಗಳನ್ನು ಮಾತ್ರ ಒಳಗೊಂಡಿದೆ. ಇದು ಪ್ರತಿಯೊಂದು ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸುವುದಿಲ್ಲ, ಮಾತ್ರೆ ಗುರುತಿಸುವುದಿಲ್ಲ, ಔಷಧಿಗಳ ಪರಸ್ಪರ ಕ್ರಿಯೆ ಪರಿಶೀಲಿಸುವುದಿಲ್ಲ ಅಥವಾ ವೈಯಕ್ತಿಕ ಚಿಕಿತ್ಸೆ ಸಲಹೆ ನೀಡುವುದಿಲ್ಲ.", points: ["ನಿರ್ದಿಷ್ಟ ಔಷಧಿಗಾಗಿ ಕರಪತ್ರ ಮತ್ತು ನಿಮ್ಮ ದೇಶದ ನಿಯಂತ್ರಕದ ಮಾಹಿತಿಯನ್ನು ನೋಡಿ ಅಥವಾ ಫಾರ್ಮಸಿಸ್ಟ್ ಅನ್ನು ಕೇಳಿ.", "ವೈಯಕ್ತಿಕ ಆರೋಗ್ಯ ಪ್ರಶ್ನೆಗೆ ನಿಮ್ಮ ಆರೈಕೆ ತಂಡವನ್ನು ಸಂಪರ್ಕಿಸಿ. ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಿರಬಹುದು ಎಂದರೆ ಸ್ಥಳೀಯ ತುರ್ತು ಸೇವೆಗೆ ಕರೆ ಮಾಡಿ."], source: "MedlinePlus · ಔಷಧಿ ಮಾಹಿತಿ", url: "https://medlineplus.gov/druginformation.html", next: "ವೈದ್ಯರ ಭೇಟಿಗೆ ಪ್ರಶ್ನೆ ಸಿದ್ಧಪಡಿಸಿ", route: "Visit Prep" },
};

function findAskGuide(question: string) {
  const normalize = (value: string) => ` ${value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()} `;
  const normalized = normalize(question);
  return ASK_GUIDES.find((item) => item.terms.some((term) => normalized.includes(normalize(term)))) ?? null;
}

function AskCarepath({ medicines, readings, documents, profile, onNavigate }: Shared) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"medicine" | "health">("medicine");
  const [market, setMarket] = useState("global");
  const [language, setLanguage] = useState<AskLanguage>("en");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [matchedGuide, setMatchedGuide] = useState<AskGuide | null>(null);
  const [notice, setNotice] = useState("");
  const selectedMarket = MEDICINE_MARKETS.find((item) => item.id === market) ?? MEDICINE_MARKETS[0];
  const prompts = mode === "medicine"
    ? language === "en" ? ["I missed a dose", "How do I check an expiry date?", "How can I prepare a medicine list?"] : ["ನಾನು ಡೋಸ್ ಮರೆತಿದ್ದೇನೆ", "ಅವಧಿ ದಿನಾಂಕ ಹೇಗೆ ಪರಿಶೀಲಿಸಲಿ?", "ಔಷಧಿ ಪಟ್ಟಿಯನ್ನು ಹೇಗೆ ಸಿದ್ಧಪಡಿಸಲಿ?"]
    : language === "en" ? ["What should I track for diabetes?", "How do I record blood pressure?", "How can I understand a lab report?"] : ["ಮಧುಮೇಹಕ್ಕೆ ಏನು ದಾಖಲಿಸಬೇಕು?", "ರಕ್ತದೊತ್ತಡವನ್ನು ಹೇಗೆ ದಾಖಲಿಸಲಿ?", "ಲ್ಯಾಬ್ ವರದಿಯನ್ನು ಹೇಗೆ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲಿ?"];
  const answerQuestion = (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question) { setNotice(language === "en" ? "Type a question or choose one of the examples." : "ಪ್ರಶ್ನೆ ಬರೆಯಿರಿ ಅಥವಾ ಉದಾಹರಣೆ ಆಯ್ಕೆಮಾಡಿ."); return; }
    setSubmittedQuestion(question);
    setMatchedGuide(findAskGuide(question));
    setNotice("");
  };
  const setSearchMode = (next: "medicine" | "health") => {
    setMode(next);
    setNotice("");
  };
  const answer = (matchedGuide ? matchedGuide[language] : ASK_FALLBACK[language]);
  return <>
    <PageHeader eyebrow={language === "en" ? "ASK IN THE APP · ENGLISH OR ಕನ್ನಡ" : "ಆಪ್‌ನಲ್ಲೇ ಕೇಳಿ · ENGLISH OR ಕನ್ನಡ"} title="ASK CAREPATH" description={language === "en" ? "Get a short, source-linked answer from CAREPATH’s on-device guide. Your question and saved health notes stay in this browser." : "CAREPATH ಸಾಧನದಲ್ಲಿರುವ ಮಾರ್ಗದರ್ಶಿಯಿಂದ ಚಿಕ್ಕ ಉತ್ತರ ಮತ್ತು ಮೂಲಗಳನ್ನು ನೋಡಿ. ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಮತ್ತು ಆರೋಗ್ಯ ಟಿಪ್ಪಣಿಗಳು ಈ ಬ್ರೌಸರ್‌ನಲ್ಲೇ ಇರುತ್ತವೆ."} icon={<Search size={24} />} action={<span className="cp-local-pill"><span /> {language === "en" ? "No diagnosis · no dose advice" : "ರೋಗ ನಿರ್ಣಯವಿಲ್ಲ · ಡೋಸ್ ಸಲಹೆಯಿಲ್ಲ"}</span>} />
    <div className="cp-ai-layout">
      <Panel title={mode === "medicine" ? (language === "en" ? "Ask about medicines" : "ಔಷಧಿಗಳ ಬಗ್ಗೆ ಕೇಳಿ") : (language === "en" ? "Ask about health topics" : "ಆರೋಗ್ಯ ವಿಷಯಗಳ ಬಗ್ಗೆ ಕೇಳಿ")} eyebrow={language === "en" ? "ON-DEVICE GUIDE · NO QUESTION IS SENT" : "ಸಾಧನದಲ್ಲಿರುವ ಮಾರ್ಗದರ್ಶಿ · ಪ್ರಶ್ನೆ ಎಲ್ಲಿಗೂ ಕಳುಹಿಸುವುದಿಲ್ಲ"}>
        <div className="cp-ai-toolbar"><div className="cp-ai-mode-switch" role="group" aria-label="Choose guide category"><button className={mode === "medicine" ? "selected" : ""} onClick={() => setSearchMode("medicine")}><Pill size={16} /> {language === "en" ? "Medicines" : "ಔಷಧಿ"}</button><button className={mode === "health" ? "selected" : ""} onClick={() => setSearchMode("health")}><Search size={16} /> {language === "en" ? "Health topics" : "ಆರೋಗ್ಯ"}</button></div><div className="cp-language-switch" role="group" aria-label="Answer language"><button className={language === "en" ? "selected" : ""} aria-pressed={language === "en"} onClick={() => setLanguage("en")}>English</button><button className={language === "kn" ? "selected" : ""} aria-pressed={language === "kn"} onClick={() => setLanguage("kn")}>ಕನ್ನಡ</button></div></div>
        {mode === "medicine" && <label className="cp-market-select">{language === "en" ? "Country or region for official medicine information" : "ಅಧಿಕೃತ ಔಷಧಿ ಮಾಹಿತಿಗಾಗಿ ದೇಶ ಅಥವಾ ಪ್ರದೇಶ"}<select value={market} onChange={(event) => setMarket(event.target.value)}>{MEDICINE_MARKETS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
        <div className="cp-chat-thread"><div className="cp-chat-welcome"><div className="cp-ai-orb">{mode === "medicine" ? <Pill size={25} /> : <Search size={25} />}</div><h3>{language === "en" ? "What would you like to know?" : "ನೀವು ಏನು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ?"}</h3><p>{language === "en" ? "Choose a topic or type a question. Answers are curated general information, not a live AI response." : "ವಿಷಯ ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಪ್ರಶ್ನೆ ಬರೆಯಿರಿ. ಉತ್ತರಗಳು ಸಂಪಾದಿತ ಸಾಮಾನ್ಯ ಮಾಹಿತಿ; ಲೈವ್ AI ಉತ್ತರಗಳಲ್ಲ."}</p><div className="cp-prompt-grid">{prompts.map((prompt) => <button key={prompt} onClick={() => setInput(prompt)}>{prompt}<ArrowRight size={15} /></button>)}</div></div></div>
        <form className="cp-chat-composer" onSubmit={answerQuestion}><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={language === "en" ? "Ask in English or Kannada…" : "English ಅಥವಾ ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ…"} rows={2} maxLength={300} /><button type="submit" aria-label={language === "en" ? "Get an answer" : "ಉತ್ತರ ನೋಡಿ"}><Send size={18} /></button></form>
        {notice && <p className="cp-ai-status" role="status">{notice}</p>}
        {submittedQuestion && <section className="cp-ask-answer" aria-live="polite"><div className="cp-answer-question"><span className="cp-answer-avatar">{language === "en" ? "YOU" : "ನೀವು"}</span><p>{submittedQuestion}</p></div><article className="cp-answer-card"><div className="cp-answer-heading"><span className="cp-ai-orb"><BookOpen size={21} /></span><div><span className="cp-eyebrow">{language === "en" ? (matchedGuide ? "CURATED CAREPATH GUIDE" : "GUIDE LIMIT") : (matchedGuide ? "CAREPATH ಮಾರ್ಗದರ್ಶಿ" : "ಮಾರ್ಗದರ್ಶಿ ಮಿತಿ")}</span><h3>{answer.title}</h3></div></div><p className="cp-answer-summary">{answer.summary}</p><ul>{answer.points.map((point) => <li key={point}>{point}</li>)}</ul><div className="cp-answer-source"><span><strong>{language === "en" ? "Source to review" : "ಪರಿಶೀಲಿಸಬೇಕಾದ ಮೂಲ"}</strong><small>{answer.source}</small></span><a href={answer.url} target="_blank" rel="noreferrer">{language === "en" ? "Open source" : "ಮೂಲ ತೆರೆಯಿರಿ"}<ArrowRight size={14} /></a></div><button className="cp-button quiet" onClick={() => onNavigate(answer.route)}>{answer.next}<ArrowRight size={15} /></button></article></section>}
        <p className="cp-composer-hint"><Info size={13} /> {language === "en" ? "Your question stays in this browser. This is not Gemini or a medical professional. The guide does not identify tablets, verify a product, diagnose, check interactions, or recommend treatment. Review the linked source and ask a pharmacist or clinician for personal decisions." : "ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಈ ಬ್ರೌಸರ್‌ನಲ್ಲೇ ಇರುತ್ತದೆ. ಇದು Gemini ಅಥವಾ ವೈದ್ಯಕೀಯ ವೃತ್ತಿಪರರಲ್ಲ. ಮಾರ್ಗದರ್ಶಿ ಮಾತ್ರೆ ಗುರುತಿಸುವುದು, ಉತ್ಪನ್ನ ಪರಿಶೀಲನೆ, ರೋಗ ನಿರ್ಣಯ, ಔಷಧಿ ಪರಸ್ಪರ ಕ್ರಿಯೆ ಅಥವಾ ಚಿಕಿತ್ಸೆ ಸಲಹೆ ನೀಡುವುದಿಲ್ಲ. ಮೂಲವನ್ನು ಓದಿ ಮತ್ತು ವೈಯಕ್ತಿಕ ನಿರ್ಧಾರಕ್ಕೆ ಫಾರ್ಮಸಿಸ್ಟ್ ಅಥವಾ ವೈದ್ಯರನ್ನು ಕೇಳಿ."}</p>
      </Panel>
      <aside className="cp-ai-aside"><Panel title={language === "en" ? "Your CAREPATH snapshot" : "ನಿಮ್ಮ CAREPATH ಸಾರಾಂಶ"}><div className="cp-snapshot-list"><Snapshot icon={<Pill />} label={language === "en" ? "Medicines" : "ಔಷಧಿಗಳು"} value={`${medicines.length} ${language === "en" ? "saved" : "ಉಳಿಸಲಾಗಿದೆ"}`} /><Snapshot icon={<Activity />} label={language === "en" ? "Health readings" : "ಆರೋಗ್ಯ ಮೌಲ್ಯಗಳು"} value={`${readings.length} ${language === "en" ? "recorded" : "ದಾಖಲಿಸಲಾಗಿದೆ"}`} /><Snapshot icon={<FileCheck2 />} label={language === "en" ? "Documents" : "ದಾಖಲೆಗಳು"} value={`${documents.length} ${language === "en" ? "saved" : "ಉಳಿಸಲಾಗಿದೆ"}`} /><Snapshot icon={<Heart />} label={language === "en" ? "Allergy notes" : "ಅಲರ್ಜಿ ಟಿಪ್ಪಣಿ"} value={profile.allergies.trim() ? (language === "en" ? "On file" : "ದಾಖಲಾಗಿದೆ") : (language === "en" ? "Not added" : "ಸೇರಿಸಿಲ್ಲ")} /></div><p className="cp-muted-copy">{language === "en" ? "This summary stays on this device and is never sent with your question." : "ಈ ಸಾರಾಂಶ ಈ ಸಾಧನದಲ್ಲೇ ಇರುತ್ತದೆ; ನಿಮ್ಮ ಪ್ರಶ್ನೆಯೊಂದಿಗೆ ಕಳುಹಿಸುವುದಿಲ್ಲ."}</p></Panel><Panel title={language === "en" ? "Official medicine registers" : "ಅಧಿಕೃತ ಔಷಧಿ ನೋಂದಣಿಗಳು"} eyebrow={language === "en" ? "OPEN ONLY IF YOU CHOOSE" : "ನೀವು ಆಯ್ಕೆ ಮಾಡಿದರೆ ಮಾತ್ರ ತೆರೆಯುತ್ತದೆ"}><p className="cp-muted-copy">{language === "en" ? `Use the ${selectedMarket.label} source for product-specific information. The link opens separately; CAREPATH does not send your question or record.` : `${selectedMarket.label} ಅಧಿಕೃತ ಮೂಲವನ್ನು ಬಳಸಿ. ಲಿಂಕ್ ಪ್ರತ್ಯೇಕವಾಗಿ ತೆರೆಯುತ್ತದೆ; CAREPATH ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಅಥವಾ ದಾಖಲೆಯನ್ನು ಕಳುಹಿಸುವುದಿಲ್ಲ.`}</p><a className="cp-button quiet" href={selectedMarket.url} target="_blank" rel="noreferrer">{language === "en" ? "Open selected regulator" : "ಆಯ್ದ ನಿಯಂತ್ರಕ ಮೂಲ ತೆರೆಯಿರಿ"}<ArrowRight size={14} /></a><div className="cp-official-links"><a href="https://www.cdsco.gov.in/opencms/opencms/en/Approval_new/Approved-New-Drugs/" target="_blank" rel="noreferrer">India · CDSCO <ArrowRight size={13} /></a><a href="https://www.fda.gov/drugs/development-approval-process-drugs/drug-approvals-and-databases" target="_blank" rel="noreferrer">United States · FDA <ArrowRight size={13} /></a><a href="https://www.ema.europa.eu/en/medicines" target="_blank" rel="noreferrer">European Union · EMA <ArrowRight size={13} /></a><a href="https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency" target="_blank" rel="noreferrer">United Kingdom · MHRA <ArrowRight size={13} /></a></div></Panel><Panel title={language === "en" ? "Go to a workspace" : "ಕಾರ್ಯಸ್ಥಳ ತೆರೆಯಿರಿ"}><div className="cp-link-list"><button onClick={() => onNavigate("Learn")}>{language === "en" ? "Everyday health guide" : "ದೈನಂದಿನ ಆರೋಗ್ಯ ಮಾರ್ಗದರ್ಶಿ"}<ArrowRight size={15} /></button><button onClick={() => onNavigate("Medicine Passport")}>{language === "en" ? "Medicine passport" : "ಔಷಧಿ ಪಾಸ್‌ಪೋರ್ಟ್"}<ArrowRight size={15} /></button><button onClick={() => onNavigate("Visit Prep")}>{language === "en" ? "Prepare for a visit" : "ಭೇಟಿಗೆ ಸಿದ್ಧತೆ"}<ArrowRight size={15} /></button><button onClick={() => onNavigate("Health Map")}>{language === "en" ? "Find a pharmacy" : "ಫಾರ್ಮಸಿ ಹುಡುಕಿ"}<ArrowRight size={15} /></button></div></Panel></aside>
    </div>
  </>;
}

function OfficialSources({ medicines, readings, documents, profile, onNavigate }: Shared) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"medicine" | "health">("medicine");
  const [market, setMarket] = useState("global");
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState("");
  const selectedMarket = MEDICINE_MARKETS.find((item) => item.id === market) ?? MEDICINE_MARKETS[0];
  const prompts = mode === "medicine"
    ? ["Paracetamol official patient information", "Metformin medicine label", "Check a medicine approval in my country"]
    : ["WHO guidance for blood pressure", "Diabetes self-management", "Cancer treatment infection guidance"];
  const search = (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;
    if (!consent) { setNotice("Please confirm before sending this search to Google. Nothing is shared until you submit."); return; }
    if (!navigator.onLine) { setNotice("You are offline. Your saved CAREPATH records and guides remain available; searches need internet."); return; }
    const domains = mode === "medicine" ? selectedMarket.sources : HEALTH_SOURCES;
    const query = `${question} (${domains.map((domain) => `site:${domain}`).join(" OR ")})`;
    const searchLink = document.createElement("a");
    searchLink.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    searchLink.target = "_blank";
    searchLink.rel = "noopener noreferrer";
    searchLink.click();
    setInput("");
    setConsent(false);
    setNotice(mode === "medicine"
      ? `Google Search opened for ${selectedMarket.label}. Results may not cover every product or confirm current local availability; check the regulator and package. CAREPATH did not attach saved records.`
      : "Google Search opened with WHO, NCI, MedlinePlus, and NHS source filters. CAREPATH did not attach saved records.");
  };
  const setSearchMode = (next: "medicine" | "health") => {
    setMode(next);
    setConsent(false);
    setNotice("");
  };
  return <>
    <PageHeader eyebrow="OFFICIAL SOURCE SEARCH · OPENS A NEW TAB" title="Official Medicine & Health Sources" description="Find official medicine information by country or search trusted general health guidance. CAREPATH never sends your saved record with a search." icon={<Search size={24} />} action={<span className="cp-local-pill"><span /> Official source search</span>} />
    <div className="cp-ai-layout">
      <Panel title={mode === "medicine" ? "Search medicine sources" : "Search trusted health sources"} eyebrow="GOOGLE SEARCH · OPENS A NEW TAB">
        <div className="cp-ai-mode-switch" role="group" aria-label="Choose source search type"><button className={mode === "medicine" ? "selected" : ""} onClick={() => setSearchMode("medicine")}><Pill size={16} /> Medicine information</button><button className={mode === "health" ? "selected" : ""} onClick={() => setSearchMode("health")}><Search size={16} /> Health topics</button></div>
        {mode === "medicine" && <label className="cp-market-select">Country or region<select value={market} onChange={(event) => setMarket(event.target.value)}>{MEDICINE_MARKETS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
        <div className="cp-chat-thread">
          <div className="cp-chat-welcome"><div className="cp-ai-orb">{mode === "medicine" ? <Pill size={25} /> : <Search size={25} />}</div><h3>{mode === "medicine" ? "Look up official medicine information" : "Find general health guidance"}</h3><p>{mode === "medicine" ? "Search by medicine name or active ingredient. Choose the country where the product is sold; national registers differ, so global results are only starting points." : "Search a general topic across WHO, National Cancer Institute, MedlinePlus, and NHS information. Review the original source page."}</p><div className="cp-prompt-grid">{prompts.map((prompt) => <button key={prompt} onClick={() => setInput(prompt)}>{prompt}<ArrowRight size={15} /></button>)}</div></div>
        </div>
        <form className="cp-chat-composer" onSubmit={search}><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={mode === "medicine" ? "Medicine name or active ingredient…" : "A general health topic…"} rows={2} maxLength={300} /><button type="submit" aria-label="Search selected sources"><Send size={18} /></button></form>
        <label className="cp-ai-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span><strong>Share this search with Google.</strong> Only the text above and the selected source filter are sent. Saved medicines, readings, allergies, and profile details are not attached. Don’t include names or identifying health details.</span></label>
        {notice && <p className="cp-ai-status" role="status">{notice}</p>}
        <p className="cp-composer-hint"><Info size={13} /> Search results can be incomplete or outdated. CAREPATH does not identify tablets, verify a product, diagnose, select treatment, check interactions, or recommend a dose. Ask a local pharmacist or care professional for personal decisions.</p>
      </Panel>
      <aside className="cp-ai-aside"><Panel title="Your CAREPATH snapshot"><div className="cp-snapshot-list"><Snapshot icon={<Pill />} label="Medicines" value={`${medicines.length} saved`} /><Snapshot icon={<Activity />} label="Health readings" value={`${readings.length} recorded`} /><Snapshot icon={<FileCheck2 />} label="Documents" value={`${documents.length} saved`} /><Snapshot icon={<Heart />} label="Allergy notes" value={profile.allergies.trim() ? "On file" : "Not added"} /></div><p className="cp-muted-copy">This snapshot stays on this device and is never included in a search.</p></Panel><Panel title="Official starting points" eyebrow="SELECT A COUNTRY ABOVE TO SEARCH"><div className="cp-official-links"><a href="https://www.cdsco.gov.in/opencms/opencms/en/Approval_new/Approved-New-Drugs/" target="_blank" rel="noreferrer">India · CDSCO approved new drugs <ArrowRight size={13} /></a><a href="https://www.fda.gov/drugs/development-approval-process-drugs/drug-approvals-and-databases" target="_blank" rel="noreferrer">United States · FDA drug databases <ArrowRight size={13} /></a><a href="https://www.ema.europa.eu/en/medicines" target="_blank" rel="noreferrer">European Union · EMA medicines <ArrowRight size={13} /></a><a href="https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency" target="_blank" rel="noreferrer">United Kingdom · MHRA <ArrowRight size={13} /></a><a href="https://www.who.int/" target="_blank" rel="noreferrer">Global health reference · WHO <ArrowRight size={13} /></a></div></Panel><Panel title="Go to a workspace"><div className="cp-link-list"><button onClick={() => onNavigate("Learn")}>Chronic-care guides <ArrowRight size={15} /></button><button onClick={() => onNavigate("Medicine Passport")}>Medicine passport <ArrowRight size={15} /></button><button onClick={() => onNavigate("Visit Prep")}>Prepare for a visit <ArrowRight size={15} /></button><button onClick={() => onNavigate("Health Map")}>Find a pharmacy <ArrowRight size={15} /></button></div></Panel></aside>
    </div>
  </>;
}


function Snapshot({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="cp-snapshot-row"><span className="cp-snapshot-icon">{icon}</span><span>{label}</span><strong>{value}</strong></div>; }

function Scanner({ medicines, documents, bump, onOpenMedicines }: Shared) {
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState("");
  const [kind, setKind] = useState("Prescription");
  const [selected, setSelected] = useState([true, true, true]);
  const [saved, setSaved] = useState(false);
  const [confirmedDemo, setConfirmedDemo] = useState(false);
  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setSaved(false);
    setConfirmedDemo(false);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : "");
  };
  const addSelected = () => {
    const additions = EXTRACTED_SAMPLE.filter((_, index) => selected[index]).map((item) => ({ ...item, id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }));
    const existing = readStored<Medicine[]>("carepath_medicines", medicines);
    const known = new Set(existing.map((item) => `${item.name.toLowerCase()}-${item.strength.toLowerCase()}`));
    const next = [...additions.filter((item) => !known.has(`${item.name.toLowerCase()}-${item.strength.toLowerCase()}`)), ...existing];
    saveStored("carepath_medicines", next);
    const record: DocumentRecord = { id: `doc-${Date.now()}`, name: fileName || `${kind} demo sample`, kind, date: todayISO(), status: "Review before use", fields: EXTRACTED_SAMPLE.filter((_, index) => selected[index]).map((item) => `${item.name} ${item.strength}`) };
    saveStored("carepath_documents", [record, ...readStored<DocumentRecord[]>("carepath_documents", documents)]);
    setSaved(true);
    bump();
    window.dispatchEvent(new Event("carepath:refresh"));
  };
  return <>
    <PageHeader eyebrow="DOCUMENT WORKSPACE" title="Scan & Understand" description="Keep a document beside its reviewable notes. Confirm every detail against the original before using it." icon={<ScanLine size={24} />} />
    <div className="cp-scanner-grid">
      <Panel title="Add a document" eyebrow="PRIVATE ON THIS DEVICE" className="cp-scanner-upload">
        <div className="cp-upload-stage">
          {preview ? <img src={preview} alt="Selected document preview" /> : <div className="cp-upload-illustration"><div><FileImage size={34} /></div><strong>{fileName || "Your document preview"}</strong><span>{fileName ? "PDF preview is not shown here." : "Add a photo or PDF to create a review workspace."}</span></div>}
        </div>
        <div className="cp-upload-controls"><label className="cp-button primary"><Camera size={16} /> Take photo<input type="file" accept="image/*" capture="environment" onChange={onFile} /></label><label className="cp-button quiet"><Upload size={16} /> Choose file<input type="file" accept="image/*,.pdf,application/pdf" onChange={onFile} /></label><select aria-label="Document type" value={kind} onChange={(event) => setKind(event.target.value)}><option>Prescription</option><option>Medicine label</option><option>Lab report</option><option>Discharge summary</option><option>Other record</option></select></div>
        <div className="cp-step-row"><span className="active">1</span><div><strong>Choose</strong><small>Photo or PDF</small></div><i /><span className="active">2</span><div><strong>Review</strong><small>Verify the notes</small></div><i /><span>3</span><div><strong>Save</strong><small>Keep a copy</small></div></div>
      </Panel>
      <Panel title="Review extracted fields" eyebrow="ILLUSTRATIVE PREVIEW" className="cp-extraction-panel">
        <Notice tone="warm">This demo does not perform OCR. The sample fields below are illustrative and are not read from your file. Check the original document before saving or acting on any detail.</Notice>
        <div className="cp-extraction-list">{EXTRACTED_SAMPLE.map((item, index) => <label className="cp-extraction-row" key={item.name}><input type="checkbox" checked={selected[index]} onChange={() => setSelected((current) => current.map((value, i) => i === index ? !value : value))} /><span className="cp-extraction-icon"><Pill size={17} /></span><span><strong>{item.name} <small>{item.strength}</small></strong><em>{item.schedule} · {item.instructions}</em></span><BadgeCheck size={17} /></label>)}</div>
        <label className="cp-scan-confirm"><input type="checkbox" checked={confirmedDemo} onChange={(event) => setConfirmedDemo(event.target.checked)} /><span><strong>Confirm demo notes</strong><small>I understand these sample values were not read from my file. Save them only if I want these example entries in my CAREPATH list.</small></span></label>
        <div className="cp-extraction-actions"><button className="cp-button primary" onClick={addSelected} disabled={!selected.some(Boolean) || !confirmedDemo}><Plus size={16} /> Save selected notes</button><button className="cp-button quiet" onClick={() => { setSelected([true, true, true]); setSaved(false); setConfirmedDemo(false); }}>Reset preview</button></div>
        {saved && <Notice tone="good">Review notes and the document reference are saved on this device. Open My Medicines to review your list.</Notice>}
        <button className="cp-text-link" onClick={onOpenMedicines}>Open My Medicines <ArrowRight size={15} /></button>
      </Panel>
    </div>
    <Panel title="Recent documents" eyebrow={`${documents.length} SAVED`}>
      {documents.length ? <div className="cp-document-list">{documents.slice(0, 5).map((document) => <DocumentRow key={document.id} document={document} />)}</div> : <EmptyState icon={<FilePlus2 />} title="Your document shelf is ready" text="Saved document references and their review notes will appear here." />}
    </Panel>
  </>;
}

function DocumentRow({ document }: { document: DocumentRecord }) { return <div className="cp-document-row"><span className="cp-file-icon"><FileCheck2 size={19} /></span><span className="cp-document-name"><strong>{document.name}</strong><small>{document.kind} · {dateLabel(document.date)}</small>{document.fields.length > 0 && <em>{document.fields.join(" · ")}</em>}</span><span className="cp-status-tag warm">{document.status}</span></div>; }

function MedicationChanges({ medicines, onOpenMedicines, onNavigate }: Shared) {
  type Snapshot = { savedAt: string; entries: Record<string, Medicine> };
  const normalizeSnapshot = (): Snapshot => {
    const raw = readStored<unknown>("carepath_medicine_baseline", {});
    if (raw && typeof raw === "object" && "entries" in raw && typeof raw.entries === "object" && raw.entries) return raw as Snapshot;
    if (raw && typeof raw === "object") {
      const entries = Object.fromEntries(Object.entries(raw).flatMap(([id, value]) => {
        if (typeof value !== "string") return [];
        const [name, strength = "", form = "", schedule = "", instructions = ""] = value.split(" · ");
        return [[id, { id, name, strength, form, schedule, instructions } as Medicine]];
      }));
      return { savedAt: "", entries };
    }
    return { savedAt: "", entries: {} };
  };
  const [baseline, setBaseline] = useState<Snapshot>(normalizeSnapshot);
  const [confirmed, setConfirmed] = useState<string[]>(() => readStored<string[]>("carepath_medicine_confirmations", []));
  const current = useMemo(() => Object.fromEntries(medicines.map((medicine) => [medicine.id, medicine])), [medicines]);
  const baselineExists = Object.keys(baseline.entries).length > 0;
  const added = medicines.filter((medicine) => baselineExists && !baseline.entries[medicine.id]);
  const newlyRecorded = medicines.filter(() => !baselineExists);
  const changed = medicines.filter((medicine) => {
    const previous = baseline.entries[medicine.id];
    return previous && JSON.stringify(previous) !== JSON.stringify(medicine);
  });
  const removed = Object.entries(baseline.entries).filter(([id]) => !current[id]).map(([, medicine]) => medicine);
  const confirmationKey = (medicine: Medicine) => `${medicine.id}:${JSON.stringify(medicine)}`;
  const needsConfirmation = medicines.filter((medicine) => !confirmed.includes(confirmationKey(medicine)));
  const changedFields = (medicine: Medicine) => {
    const previous = baseline.entries[medicine.id];
    if (!previous) return "New entry. Check the medicine name, strength, and instructions against the current source.";
    const fields = (["name", "strength", "form", "schedule", "instructions", "remainingUnits", "unitsPerDay", "expiryDate"] as const)
      .filter((key) => previous[key] !== medicine[key]).map((key) => key === "schedule" ? "time" : key === "remainingUnits" ? "stock count" : key === "unitsPerDay" ? "usage estimate" : key === "expiryDate" ? "expiry date" : key);
    return fields.length ? `Changed in your record: ${fields.join(", ")}. Compare with the package or prescription.` : "Present in your saved list. Confirm it against the current package or prescription.";
  };
  const saveSnapshot = () => {
    const next: Snapshot = { savedAt: new Date().toISOString(), entries: current };
    saveStored("carepath_medicine_baseline", next);
    setBaseline(next);
  };
  const markConfirmed = (medicine: Medicine) => {
    const next = [...new Set([...confirmed, confirmationKey(medicine)])];
    setConfirmed(next);
    saveStored("carepath_medicine_confirmations", next);
  };
  const differenceCount = added.length + newlyRecorded.length + changed.length + removed.length;
  return <>
    <PageHeader eyebrow="MEDICATION RECONCILIATION" title="What Changed?" description="See entries added, changed, removed, and waiting for you to verify. This compares your own notes; it cannot decide whether a change is safe." icon={<ClipboardList size={24} />} action={<button className="cp-button primary" onClick={saveSnapshot}><BadgeCheck size={16} /> Save current snapshot</button>} />
    <Notice tone="warm"><strong>Review with a professional when medicines change.</strong> CAREPATH can show differences in your own entries, but it cannot tell you whether a change is safe, intended, or complete.</Notice>
    <div className="cp-reconcile-stats"><div><strong>{added.length}</strong><span>Added</span></div><div><strong>{changed.length}</strong><span>Changed</span></div><div><strong>{removed.length}</strong><span>Removed</span></div><div><strong>{newlyRecorded.length}</strong><span>Newly recorded</span></div><div><strong>{needsConfirmation.length}</strong><span>Needs confirmation</span></div></div>
    <div className="cp-two-column"><Panel title="Compare your lists" eyebrow={baselineExists ? `LAST SNAPSHOT ${baseline.savedAt ? dateLabel(baseline.savedAt.slice(0, 10)) : "SAVED"}` : "SAVE A STARTING SNAPSHOT AFTER CHECKING YOUR SOURCE"}>
      {differenceCount ? <div className="cp-alert-list">
        {added.map((item) => <div className="cp-alert-item" key={`added-${item.id}`}><span><Plus size={17} /></span><div><strong>Added since snapshot: {item.name}</strong><p>{item.strength} · {item.form} — check against the current source.</p></div><span className="cp-status-tag warm">Confirm</span></div>)}
        {newlyRecorded.map((item) => <div className="cp-alert-item" key={`new-${item.id}`}><span><Pill size={17} /></span><div><strong>Newly recorded: {item.name}</strong><p>{item.strength} · {item.form} — this first view has no earlier snapshot to compare.</p></div><span className="cp-status-tag warm">Confirm</span></div>)}
        {changed.map((item) => <div className="cp-alert-item" key={`changed-${item.id}`}><span><CircleAlert size={17} /></span><div><strong>Changed: {item.name}</strong><p>{changedFields(item)}</p></div><span className="cp-status-tag warm">Review</span></div>)}
        {removed.map((item) => <div className="cp-alert-item" key={`removed-${item.id}`}><span><CircleAlert size={17} /></span><div><strong>Removed from current list: {item.name}</strong><p>Check whether this was intentional with your current list or care professional.</p></div><span className="cp-status-tag warm">Review</span></div>)}
      </div> : <EmptyState icon={<CheckCircle2 />} title="No list differences recorded" text={baselineExists ? "Your current list matches the saved comparison." : "Add or confirm your medicine entries, then save a starting snapshot to compare future changes."} />}
      <div className="cp-inline-actions"><button className="cp-button quiet" onClick={onOpenMedicines}><Pill size={16} /> Open medicine list</button><button className="cp-button quiet" onClick={() => onNavigate("Visit Prep")}><Stethoscope size={16} /> Add to visit brief</button></div>
    </Panel><Panel title="Needs confirmation" eyebrow={`${needsConfirmation.length} ENTRY${needsConfirmation.length === 1 ? "" : "IES"} TO CHECK`}>
      <p className="cp-muted-copy">CAREPATH does not verify a medicine source or calculate interaction confidence. Confirm each entry using the package, prescription, pharmacist, or prescriber. The check mark only records that you reviewed it.</p>
      {needsConfirmation.length ? <div className="cp-confirmation-list">{needsConfirmation.map((item) => <div key={item.id}><span><strong>{item.name}</strong><small>{item.strength} · {item.form}</small><small>{changedFields(item)}</small></span><button className="cp-button quiet" onClick={() => markConfirmed(item)}><Check size={14} /> Checked against source</button></div>)}</div> : <EmptyState icon={<CheckCircle2 />} title="No entries waiting for your check" text="A personal confirmation is recorded for each saved entry." />}
      <div className="cp-inline-actions"><button className="cp-button quiet" onClick={() => onNavigate("Safety Check")}><ShieldCheck size={15} /> Open safety review</button></div>
    </Panel></div>
  </>;
}

function MedicinePassport({ medicines, onOpenMedicines, onNavigate }: Shared) {
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState("Overview");
  const medicine = medicines[selected] ?? medicines[0];
  const tabs = ["Overview", "How I use it", "Source & notes"];
  return <>
    <PageHeader eyebrow="YOUR PERSONAL REFERENCE" title="Medicine Passport" description="A compact, shareable view of the medicine details you have recorded." icon={<FileCheck2 size={24} />} action={<button className="cp-button primary" onClick={() => window.print()}><ArrowDownToLine size={16} /> Print passport</button>} />
    {medicines.length === 0 ? <EmptyState icon={<Pill />} title="Add a medicine to begin" text="Your passport is built from the details you save in My Medicines." action={<button className="cp-button primary" onClick={onOpenMedicines}>Open My Medicines</button>} /> : <div className="cp-passport-grid">
      <Panel title="My medicines" eyebrow={`${medicines.length} IN YOUR PASSPORT`} className="cp-passport-list"><div className="cp-passport-options">{medicines.map((item, index) => <button key={item.id} className={index === selected ? "selected" : ""} onClick={() => setSelected(index)}><span className="cp-passport-pill"><Pill size={17} /></span><span><strong>{item.name}</strong><small>{item.strength} · {item.form}</small></span><ChevronRight size={16} /></button>)}</div><button className="cp-button quiet cp-full-button" onClick={onOpenMedicines}><Plus size={16} /> Manage medicine list</button></Panel>
      {medicine && <Panel title={`${medicine.name} ${medicine.strength}`} eyebrow="PERSONAL MEDICINE PASSPORT" className="cp-passport-detail"><div className="cp-source-banner"><BadgeCheck size={17} /><span><strong>{["1", "2", "3", "4"].includes(medicine.id) ? "Illustrative sample entry" : "Recorded by you"}</strong><small>Compare with the package or prescription each time.</small></span></div><div className="cp-passport-tabs">{tabs.map((item) => <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}</button>)}</div>{tab === "Overview" && <div className="cp-detail-grid"><Detail label="Medicine name" value={medicine.name} /><Detail label="Strength as recorded" value={medicine.strength} /><Detail label="Form" value={medicine.form} /><Detail label="Usual time saved" value={medicine.schedule || "Not recorded"} /><Detail label="Personal instruction" value={medicine.instructions || "Not recorded"} /><Detail label="Information source" value="Your saved CAREPATH entry" /></div>}{tab === "How I use it" && <div className="cp-passport-prose"><Notice>CAREPATH stores your notes; it does not set a dose or schedule. Follow the current instructions supplied by your clinician or pharmacist.</Notice><Detail label="Your schedule note" value={medicine.schedule || "Not recorded"} /><Detail label="Your instructions" value={medicine.instructions || "Not recorded"} /><button className="cp-button quiet" onClick={onOpenMedicines}>Edit my saved details</button></div>}{tab === "Source & notes" && <div className="cp-passport-prose"><p>This entry was saved to this device. CAREPATH has not independently verified its product, strength, or prescribing instructions.</p><button className="cp-button quiet" onClick={() => onNavigate("Scan & Upload")}><ScanLine size={16} /> Add a document reference</button></div>}<Notice tone="warm">This is a personal record, not a substitute for the package label or professional advice.</Notice></Panel>}
    </div>}
  </>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="cp-detail-cell"><span>{label}</span><strong>{value}</strong></div>; }

function SafetyReview({ medicines, profile, onOpenMedicines, onNavigate }: Shared) {
  const duplicates = medicines.filter((item, index) => medicines.findIndex((other) => other.name.trim().toLowerCase() === item.name.trim().toLowerCase()) !== index);
  const missingInfo = medicines.filter((item) => !item.instructions.trim() || !item.schedule.trim());
  const checks = [
    { title: "Medicine details recorded", detail: medicines.length ? `${medicines.length} personal entries are saved.` : "No medicine entries are saved yet.", status: medicines.length ? "Recorded" : "Add details", tone: medicines.length ? "good" : "warm", icon: <Pill size={18} /> },
    { title: "Allergy information", detail: profile.allergies.trim() ? "Allergy notes are present in your profile. Verify they are current." : "No allergy information is recorded. This does not mean there are no allergies.", status: profile.allergies.trim() ? "Review notes" : "Needs information", tone: "warm", icon: <Heart size={18} /> },
    { title: "Repeated names", detail: duplicates.length ? `Repeated names in your saved list: ${duplicates.map((item) => item.name).join(", ")}. Check the entries with a pharmacist.` : "No exact repeated medicine names found. This does not check duplicate active ingredients.", status: duplicates.length ? "Review list" : "Name check only", tone: duplicates.length ? "warm" : "info", icon: <ListChecks size={18} /> },
    { title: "Duplicate ingredients", detail: "Not assessed. CAREPATH does not collect or verify active ingredients, so different product names cannot be safely compared here.", status: "Not checked", tone: "info", icon: <Info size={18} /> },
    { title: "Instructions & schedule", detail: missingInfo.length ? `${missingInfo.length} entry${missingInfo.length === 1 ? "" : "ies"} need schedule or instruction notes.` : "Saved schedule and instruction fields are present; confirm against the original.", status: missingInfo.length ? "Review entries" : "Confirm source", tone: missingInfo.length ? "warm" : "info", icon: <Clock3 size={18} /> },
    { title: "Interactions & suitability", detail: "Not assessed by this offline demo. Ask a pharmacist or clinician to review your full list, allergies, and health history.", status: "Professional review", tone: "info", icon: <Stethoscope size={18} /> },
    { title: "Source confidence", detail: "No source document is verified against these entries. A scan preview, if used, is illustrative demo text and is not OCR.", status: "Not verified", tone: "info", icon: <FileCheck2 size={18} /> },
  ];
  return <>
    <PageHeader eyebrow="MEDICATION ORGANIZER" title="Safety Check" description="Review what is recorded, spot missing details, and prepare a complete list for a pharmacist or clinician." icon={<ShieldCheck size={24} />} action={<button className="cp-button primary" onClick={onOpenMedicines}><Pill size={16} /> Review medicine list</button>} />
    <Notice tone="warm"><strong>This is a record-completeness review, not a clinical interaction checker.</strong> CAREPATH uses no clinical warning thresholds and does not determine whether a medicine is safe, diagnose a problem, or recommend treatment. For urgent symptoms or suspected reactions, contact a healthcare professional or local emergency services as appropriate.</Notice>
    <div className="cp-safety-banner"><div className="cp-safety-badge"><ShieldAlert size={21} /></div><div><span className="cp-eyebrow">PERSONAL LIST REVIEW</span><h2>{medicines.length ? "Make sure your record is complete" : "Start with your current medicine list"}</h2><p>Review each item against the package and include prescriptions, over-the-counter medicines, vitamins, and allergies.</p></div><button className="cp-button dark" onClick={onNavigate.bind(null, "Care Circle")}>Update health profile <ArrowRight size={15} /></button></div>
    <div className="cp-safety-list">{checks.map((item) => <div className="cp-safety-check" key={item.title}><div className="cp-check-icon">{item.icon}</div><div className="cp-check-copy"><strong>{item.title}</strong><p>{item.detail}</p></div><span className={`cp-status-tag ${item.tone}`}>{item.status}</span></div>)}</div>
    <div className="cp-inline-actions"><button className="cp-button quiet" onClick={() => onNavigate("Visit Prep")}><Stethoscope size={16} /> Add this to my visit brief</button><button className="cp-button quiet" onClick={() => onNavigate("Emergency Help")}><HeartPulse size={16} /> Emergency information</button></div>
  </>;
}

function HealthTracker({ readings, onOpenMonitor, onNavigate }: Shared) {
  const latestByMetric = new Map<string, HealthReading>();
  readings.forEach((reading) => {
    const previous = latestByMetric.get(reading.metric);
    if (!previous || `${reading.date} ${reading.time}` > `${previous.date} ${previous.time}`) latestByMetric.set(reading.metric, reading);
  });
  const metrics = [
    { name: "Blood Pressure", unit: "mmHg", icon: <HeartPulse />, tone: "teal" },
    { name: "Blood Glucose", unit: "mg/dL", icon: <Activity />, tone: "amber" },
    { name: "Pulse", unit: "bpm", icon: <Heart />, tone: "blue" },
    { name: "SpO₂", unit: "%", icon: <Activity />, tone: "violet" },
    { name: "Temperature", unit: "°C", icon: <Activity />, tone: "rose" },
    { name: "Weight", unit: "kg", icon: <Activity />, tone: "green" },
    { name: "Steps", unit: "steps", icon: <Activity />, tone: "blue" },
  ];
  const counts = metrics.map((item) => readings.filter((reading) => reading.metric === item.name).length);
  const hasOnlyExamples = readings.length > 0 && readings.every((reading) => reading.id.startsWith("demo-"));
  return <>
    <PageHeader eyebrow="YOUR MEASUREMENTS" title="Health Tracker" description="Record readings with context and review how your saved values change over time." icon={<HeartPulse size={24} />} action={<button className="cp-button primary" onClick={onOpenMonitor}><Plus size={16} /> Add a reading</button>} />
    {hasOnlyExamples && <Notice>Example values are included so you can explore the tracker. Add your own readings to replace these examples.</Notice>}
    <div className="cp-metric-grid">{metrics.map((metric, index) => { const current = latestByMetric.get(metric.name); return <button className={`cp-metric-tile ${metric.tone}`} key={metric.name} onClick={onOpenMonitor}><span className="cp-metric-icon">{metric.icon}</span><span className="cp-metric-label">{metric.name}</span><strong>{current ? `${current.value}${current.secondValue === undefined ? "" : ` / ${current.secondValue}`}` : "—"}<small>{current?.unit || metric.unit}</small></strong><em>{current ? `${current.id.startsWith("demo-") ? "Example · " : ""}${dateLabel(current.date)} · ${current.time}` : "No saved reading"}</em><span className="cp-mini-bars" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ height: `${18 + ((i * 17 + counts[index] * 9) % 37)}px` }} />)}</span></button>; })}</div>
    <div className="cp-two-column"><Panel title="Recent readings" eyebrow={`${readings.length} TOTAL`}><div className="cp-reading-list">{readings.length ? readings.slice().sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)).slice(0, 6).map((reading) => <div className="cp-reading-line" key={reading.id}><span className="cp-reading-dot" /><span><strong>{reading.metric}</strong><small>{dateLabel(reading.date)} · {reading.time} · {reading.id.startsWith("demo-") ? "Sample" : "Entered by you"}{reading.note ? ` · ${reading.note}` : ""}</small></span><b>{reading.value}{reading.secondValue !== undefined ? ` / ${reading.secondValue}` : ""} <small>{reading.unit}</small></b></div>) : <EmptyState icon={<Activity />} title="Your tracker is ready" text="Add a reading with its date and context to begin building a useful record." />}</div></Panel><Panel title="Bring context to a reading" eyebrow="A USEFUL HABIT"><div className="cp-coach-card"><div className="cp-coach-icon"><Sparkles size={20} /></div><div><strong>Capture how and when</strong><p>Record the time, what was happening, and any symptoms or notes. Consistent context makes records easier to discuss at an appointment.</p></div></div><Notice>Values are for personal tracking. CAREPATH does not interpret measurements or replace medical advice.</Notice><button className="cp-text-link" onClick={() => onNavigate("Health Timeline")}>View health timeline <ArrowRight size={15} /></button></Panel></div>
  </>;
}

function Timeline({ readings, documents, medEvents, onNavigate }: Shared) {
  const labResults = readStored<ReportResult[]>("carepath_lab_results", []);
  const symptomNotes = readStored<SymptomEntry[]>("carepath_symptom_notes", []);
  const entries = [
    ...readings.map((item) => ({ id: `reading-${item.id}`, date: item.date, time: item.time, title: item.metric, text: `${item.value}${item.secondValue !== undefined ? ` / ${item.secondValue}` : ""} ${item.unit}${item.note ? ` · ${item.note}` : ""}`, icon: <Activity size={16} />, kind: item.id.startsWith("demo-") ? "Example health reading" : "Health reading" })),
    ...labResults.map((item) => ({ id: item.id, date: item.date, time: "12:00", title: item.test, text: `${item.value} ${item.unit}`, icon: <FileCheck2 size={16} />, kind: "Lab result · entered by you" })),
    ...documents.map((item) => ({ id: item.id, date: item.date, time: "12:00", title: item.name, text: `${item.kind} · ${item.status}`, icon: <FileCheck2 size={16} />, kind: "Document" })),
    ...medEvents.map((item) => ({ id: item.id, date: item.date, time: item.time, title: item.medicine, text: `Dose marked ${item.status.toLowerCase()}`, icon: <Pill size={16} />, kind: "Medicine note" })),
    ...symptomNotes.map((item) => ({ id: item.id, date: item.date, time: item.time, title: item.symptom, text: [item.person, item.duration, item.measurement && `${item.measurement} ${item.measurementUnit}`.trim(), item.notes].filter(Boolean).join(" · "), icon: <Activity size={16} />, kind: "Symptom note · recorded by you" })),
  ].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  return <>
    <PageHeader eyebrow="CONNECTED HISTORY" title="Health Timeline" description="See the health details you have saved together, in date order." icon={<CalendarDays size={24} />} action={<button className="cp-button quiet" onClick={() => onNavigate("Health Calendar")}><CalendarDays size={16} /> Open calendar</button>} />
    <div className="cp-timeline-summary"><div><span className="cp-summary-number">{readings.length}</span><span>Health readings</span></div><div><span className="cp-summary-number">{labResults.length}</span><span>Report values</span></div><div><span className="cp-summary-number">{documents.length}</span><span>Documents saved</span></div><div><span className="cp-summary-number">{medEvents.length}</span><span>Medicine notes</span></div><div><span className="cp-summary-number">{symptomNotes.length}</span><span>Symptom notes</span></div><div><span className="cp-summary-number">{new Set(entries.map((entry) => entry.date)).size}</span><span>Days with records</span></div></div>
    <Panel title="Your saved events" eyebrow="MOST RECENT FIRST"><div className="cp-timeline">{entries.length ? entries.map((entry, index) => <div className="cp-timeline-entry" key={entry.id}><div className="cp-timeline-rail"><span>{entry.icon}</span>{index < entries.length - 1 && <i />}</div><div className="cp-timeline-content"><div><span className="cp-eyebrow">{entry.kind} · {dateLabel(entry.date)}</span><h3>{entry.title}</h3><p>{entry.text}</p></div><time>{entry.time}</time></div></div>) : <EmptyState icon={<Clock3 />} title="Your timeline will grow with you" text="Add a health reading, save a document, record a medicine event, or make a symptom note to create your first entry." />}</div></Panel>
    <div className="cp-inline-actions"><button className="cp-button quiet" onClick={() => onNavigate("Monitor")}><Plus size={16} /> Add health reading</button><button className="cp-button quiet" onClick={() => onNavigate("Scan & Upload")}><ScanLine size={16} /> Add document</button></div>
  </>;
}

function HealthCalendar({ readings, documents, medEvents }: Shared) {
  const labResults = readStored<ReportResult[]>("carepath_lab_results", []);
  const symptomNotes = readStored<SymptomEntry[]>("carepath_symptom_notes", []);
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const today = todayISO();
  const eventDates = new Set([...readings.map((item) => item.date), ...labResults.map((item) => item.date), ...documents.map((item) => item.date), ...medEvents.map((item) => item.date), ...symptomNotes.map((item) => item.date)]);
  const eventsOnSelectedMonth = [...eventDates].filter((date) => date.startsWith(`${year}-${String(monthIndex + 1).padStart(2, "0")}`)).length;
  return <>
    <PageHeader eyebrow="A CLEARER LOOK AT YOUR MONTH" title="Health Calendar" description="Find the days where you saved readings, symptom notes, medicine notes, or a document." icon={<CalendarDays size={24} />} />
    <div className="cp-calendar-layout"><Panel title={month.toLocaleDateString(undefined, { month: "long", year: "numeric" })} eyebrow={`${eventsOnSelectedMonth} DAYS WITH SAVED DETAILS`}><div className="cp-calendar-head"><button className="cp-icon-button" aria-label="Previous month" onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}><ChevronLeft size={17} /></button><strong>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong><button className="cp-icon-button" aria-label="Next month" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}><ChevronRight size={17} /></button></div><div className="cp-calendar-grid">{"SMTWTFS".split("").map((day, index) => <span className="weekday" key={`${day}-${index}`}>{day}</span>)}{Array.from({ length: firstDay }, (_, i) => <span className="calendar-blank" key={`blank-${i}`} />)}{Array.from({ length: days }, (_, i) => { const date = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`; return <div className={`calendar-day ${date === today ? "today" : ""} ${eventDates.has(date) ? "has-event" : ""}`} key={date}><span>{i + 1}</span>{eventDates.has(date) && <i />}</div>; })}</div><div className="cp-calendar-legend"><span><i /> Saved health details</span><span><i className="today-dot" /> Today</span></div></Panel><Panel title="Make the calendar useful" eyebrow="YOUR RECORDS"><div className="cp-calendar-note"><CalendarDays size={22} /><p>Calendar markers come from your saved readings, symptom notes, document references, and medicine notes. CAREPATH does not create appointments or send reminders.</p></div><div className="cp-calendar-totals"><span><strong>{readings.length}</strong> readings</span><span><strong>{documents.length}</strong> documents</span><span><strong>{medEvents.length}</strong> medicine notes</span><span><strong>{symptomNotes.length}</strong> symptom notes</span></div></Panel></div>
  </>;
}

function HealthMap({ medicines, readings, documents, profile, onNavigate }: Shared) {
  const [area, setArea] = useState(profile.locationHint || "");
  const [coords, setCoords] = useState("");
  const [mapNotice, setMapNotice] = useState("");
  const mapItems = [
    { title: "Medicines", count: medicines.length, text: "Your saved medication notes", icon: <Pill />, route: "Medicine Passport", tone: "mint" },
    { title: "Vitals & readings", count: readings.length, text: "Measurements with date and context", icon: <HeartPulse />, route: "Health Tracker", tone: "blue" },
    { title: "Documents", count: documents.length, text: "Reports and document references", icon: <FileCheck2 />, route: "Tests & Reports", tone: "violet" },
    { title: "Care profile", count: profile.allergies || profile.conditions ? 1 : 0, text: "Allergy and health background notes", icon: <Heart />, route: "Care Circle", tone: "rose" },
  ];
  const mapSearch = (place: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place} near ${coords || area}`)}`;
  const openMaps = (place: string) => {
    if (!coords && !area.trim()) { setMapNotice("Enter a city or area, or choose Use my location first."); return; }
    saveStored("carepath_profile", { ...profile, locationHint: area.trim() });
    window.open(mapSearch(place), "_blank", "noopener,noreferrer");
  };
  const useLocation = () => {
    setMapNotice("");
    if (!navigator.geolocation) { setMapNotice("Location is not supported here. Enter a city or area instead."); return; }
    navigator.geolocation.getCurrentPosition((position) => {
      setCoords(`${position.coords.latitude},${position.coords.longitude}`);
      setMapNotice("Location is ready for this search. Tap a Maps button below to send it to Google Maps.");
    }, () => setMapNotice("Location was not available. You can still search by typing a city or area."), { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  };
  return <>
    <PageHeader eyebrow="ONE VIEW OF YOUR CARE" title="Health Map" description="Explore the information connected to your personal health record." icon={<MapPin size={24} />} />
    <div className="cp-map-overview"><div className="cp-body-map"><div className="cp-body-glow" /><div className="cp-body-head" /><div className="cp-body-torso"><HeartPulse size={28} /></div><div className="cp-body-arm left" /><div className="cp-body-arm right" /><div className="cp-body-leg left" /><div className="cp-body-leg right" /><span className="cp-map-node node-one"><Activity size={15} /></span><span className="cp-map-node node-two"><Pill size={15} /></span><span className="cp-map-node node-three"><Heart size={15} /></span></div><div className="cp-map-intro"><span className="cp-eyebrow">YOUR PERSONAL HEALTH MAP</span><h2>Everything you choose to keep, connected.</h2><p>CAREPATH brings your saved details into one place, so you can find and share the information that matters to you.</p><button className="cp-button primary" onClick={() => onNavigate("Visit Prep")}>Build a visit brief <ArrowRight size={15} /></button></div></div>
    <div className="cp-map-cards">{mapItems.map((item) => <button className={`cp-map-card ${item.tone}`} key={item.title} onClick={() => onNavigate(item.route)}><span className="cp-map-card-icon">{item.icon}</span><span><strong>{item.title}</strong><small>{item.text}</small></span><b>{item.count}<small>saved</small></b><ChevronRight size={17} /></button>)}</div>
    <div className="cp-two-column cp-services-grid"><Panel title="Find a medicine place" eyebrow="MAP SEARCH · YOU CHOOSE WHEN TO SHARE LOCATION"><p className="cp-muted-copy">Search a saved area or ask this device for your location. Your location is used only after you tap a Google Maps search button; CAREPATH does not save coordinates. Map results do not confirm stock, opening hours, or medicine quality.</p><form className="cp-location-form" onSubmit={(event) => { event.preventDefault(); setCoords(""); saveStored("carepath_profile", { ...profile, locationHint: area.trim() }); setMapNotice(area.trim() ? `Search area saved on this device: ${area.trim()}` : "Enter a city or area to search."); }}><label htmlFor="cp-pharmacy-area">City or area</label><div><input id="cp-pharmacy-area" value={area} onChange={(event) => { setArea(event.target.value); setCoords(""); }} placeholder="For example, Pune or Andheri West" /><button className="cp-button quiet" type="submit">Save area</button></div></form><button className="cp-button quiet cp-location-button" onClick={useLocation}><LocateFixed size={16} /> Use my current location</button>{mapNotice && <p className="cp-ai-status" role="status">{mapNotice}</p>}<div className="cp-map-search-actions"><button className="cp-button primary" onClick={() => openMaps("pharmacy") }><MapPinned size={16} /> Search pharmacies</button><button className="cp-button quiet" onClick={() => openMaps("medical store") }><MapPin size={16} /> Search medical stores</button><button className="cp-button quiet" onClick={() => openMaps("hospital") }><HeartPulse size={16} /> Search hospitals</button></div><small className="cp-map-privacy">Google Maps opens in a new tab with the location or area in your search. You can cancel and use an area search instead.</small></Panel><Panel title="Reach your people" eyebrow="CALL OR MESSAGE FROM YOUR DEVICE"><div className="cp-care-contact-list">{profile.clinicianPhone ? <div><span className="cp-care-contact-icon"><Stethoscope size={17} /></span><span><strong>{profile.clinician || "Doctor or clinic"}</strong><small>{profile.clinicianPhone}</small></span><a href={`tel:${profile.clinicianPhone.replace(/[^\d+*#]/g, "")}`} aria-label={`Call ${profile.clinician || "doctor or clinic"}`}><Phone size={16} /></a><a href={`sms:${profile.clinicianPhone.replace(/[^\d+*#]/g, "")}`} aria-label="Message doctor or clinic"><MessageSquareText size={16} /></a></div> : null}{profile.pharmacyPhone ? <div><span className="cp-care-contact-icon"><Pill size={17} /></span><span><strong>{profile.pharmacy || "My pharmacy"}</strong><small>{profile.pharmacyPhone}</small></span><a href={`tel:${profile.pharmacyPhone.replace(/[^\d+*#]/g, "")}`} aria-label={`Call ${profile.pharmacy || "pharmacy"}`}><Phone size={16} /></a><a href={`sms:${profile.pharmacyPhone.replace(/[^\d+*#]/g, "")}`} aria-label="Message pharmacy"><MessageSquareText size={16} /></a></div> : null}{profile.emergencyPhone ? <div><span className="cp-care-contact-icon"><Users size={17} /></span><span><strong>{profile.emergencyName || "Trusted contact"}</strong><small>{profile.emergencyRelation || "Personal contact"} · {profile.emergencyPhone}</small></span><a href={`tel:${profile.emergencyPhone.replace(/[^\d+*#]/g, "")}`} aria-label={`Call ${profile.emergencyName || "trusted contact"}`}><Phone size={16} /></a><a href={`sms:${profile.emergencyPhone.replace(/[^\d+*#]/g, "")}`} aria-label="Message trusted contact"><MessageSquareText size={16} /></a></div> : null}{!profile.clinicianPhone && !profile.pharmacyPhone && !profile.emergencyPhone && <div className="cp-care-contact-empty"><p>Add a doctor, pharmacy, or trusted contact in Care Circle. CAREPATH opens calls and messages in your device's apps; it does not send anything automatically.</p><button className="cp-button quiet" onClick={() => onNavigate("Care Circle")}>Set up my contacts <ArrowRight size={14} /></button></div>}</div><button className="cp-text-link" onClick={() => onNavigate("Care Circle")}>Edit contact details <ArrowRight size={14} /></button></Panel></div>
  </>;
}

function Reports({ documents, onNavigate }: Shared) {
  const [explainer, setExplainer] = useState("Lab report");
  const [results, setResults] = useState<ReportResult[]>(() => readStored<ReportResult[]>("carepath_lab_results", []));
  const [test, setTest] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [date, setDate] = useState(todayISO());
  const tests = [...new Set(results.map((item) => item.test))];
  const saveResult = (event: FormEvent) => {
    event.preventDefault();
    if (!test.trim() || !unit.trim() || !value.trim() || !Number.isFinite(Number(value)) || !date) return;
    const next = [{ id: `lab-${Date.now()}`, test: test.trim(), value: Number(value), unit: unit.trim(), date }, ...results];
    if (!saveStored("carepath_lab_results", next)) return;
    setResults(next);
    setValue("");
    window.dispatchEvent(new Event("carepath:refresh"));
  };
  const removeResult = (id: string) => {
    const next = results.filter((item) => item.id !== id);
    if (!saveStored("carepath_lab_results", next)) return;
    setResults(next);
    window.dispatchEvent(new Event("carepath:refresh"));
  };
  return <>
    <PageHeader eyebrow="TESTS, REPORTS & RECORDS" title="My Reports" description="Keep document references beside the details you may want to discuss with your care team." icon={<FileCheck2 size={24} />} action={<button className="cp-button primary" onClick={() => onNavigate("Scan & Upload")}><Upload size={16} /> Add a document</button>} />
    <Notice>Document references stay in this browser. CAREPATH does not send them to a clinic or interpret test results.</Notice>
    <Panel title="Document shelf" eyebrow={`${documents.length} SAVED`}>
      {documents.length ? <div className="cp-document-list">{documents.map((document) => <DocumentRow key={document.id} document={document} />)}</div> : <EmptyState icon={<FilePlus2 />} title="A single place for your documents" text="Save the kind, date, and review notes for prescriptions, medicine labels, lab reports, and other records." action={<button className="cp-button primary" onClick={() => onNavigate("Scan & Upload")}><ScanLine size={16} /> Open Scan & Understand</button>} />}
    </Panel>
    <div className="cp-two-column"><Panel title="Explain my report safely" eyebrow="NO AUTOMATIC INTERPRETATION"><p className="cp-muted-copy">Choose the kind of document to get a plain-language checklist for reviewing it. CAREPATH does not read results, interpret reference ranges, or tell you what to do.</p><div className="cp-ai-mode-switch"><button className={explainer === "Lab report" ? "selected" : ""} onClick={() => setExplainer("Lab report")}>Lab report</button><button className={explainer === "Imaging report" ? "selected" : ""} onClick={() => setExplainer("Imaging report")}>Imaging report</button><button className={explainer === "Discharge note" ? "selected" : ""} onClick={() => setExplainer("Discharge note")}>Discharge note</button></div><div className="cp-report-explainer"><strong>{explainer}</strong><p>Look for the date, the test or study name, the reported result, and any reference range or impression written by the reporting service. Keep the original report and ask your clinician to explain anything unexpected or unclear.</p><button className="cp-button quiet" onClick={() => onNavigate("Visit Prep")}><MessageCircle size={15} /> Turn this into a visit question</button></div><a className="cp-text-link" href="https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/" target="_blank" rel="noreferrer">MedlinePlus: understand lab results <ArrowRight size={14} /></a></Panel><Panel title="Example trend" eyebrow="SAMPLE VALUES · NOT A REAL TEST"><p className="cp-muted-copy">These made-up example units only preview how dates and values can appear. They are not a health measurement, target, or result.</p><div className="cp-lab-sample-trend" aria-label="Illustrative example values: 12, 15, and 13 example units"><div><span>Example A · 3 weeks ago</span><strong>12 <small>example units</small></strong><i style={{ height: "38%" }} /></div><div><span>Example B · 2 weeks ago</span><strong>15 <small>example units</small></strong><i style={{ height: "74%" }} /></div><div><span>Example C · 1 week ago</span><strong>13 <small>example units</small></strong><i style={{ height: "54%" }} /></div></div><small className="cp-private-note"><Info size={14} /> No normal range or trend interpretation is shown.</small></Panel></div>
    <Panel title="Record a result from my report" eyebrow="SAVED ONLY IN THIS BROWSER"><p className="cp-muted-copy">Copy the test name, value, units, and date exactly as printed. This helps you organize a trend; it does not interpret the result.</p><form className="cp-lab-entry-form" onSubmit={saveResult}><label>Test name<input required value={test} onChange={(event) => setTest(event.target.value)} placeholder="As printed on the report" /></label><label>Value<input required type="number" step="any" value={value} onChange={(event) => setValue(event.target.value)} placeholder="For numeric results" /></label><label>Units<input required value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="Copy report units" /></label><label>Date<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><button className="cp-button primary" type="submit"><Plus size={15} /> Save result</button></form>
      {results.length > 0 ? <div className="cp-lab-result-list"><div className="cp-lab-result-head"><strong>My saved results</strong><label>Show test<select value={tests.includes(test) ? test : tests[0]} onChange={(event) => setTest(event.target.value)}>{tests.map((item) => <option key={item}>{item}</option>)}</select></label></div>{results.filter((item) => item.test === (tests.includes(test) ? test : tests[0])).sort((a, b) => b.date.localeCompare(a.date)).map((item) => <div className="cp-lab-result-row" key={item.id}><span><strong>{item.test}</strong><small>{dateLabel(item.date)} · Entered by you</small></span><b>{item.value} <small>{item.unit}</small></b><button className="cp-icon-button" aria-label={`Delete ${item.test} result from ${item.date}`} onClick={() => removeResult(item.id)}><Trash2 size={15} /></button></div>)}</div> : <EmptyState icon={<Activity />} title="No personal results saved" text="Add a value from your report when you want to keep a simple date-by-date record." />}
      <small className="cp-private-note"><ShieldCheck size={14} /> Keep the original report. Share these notes only after reviewing the details.</small></Panel>
    <Panel title="A simple review habit" eyebrow="BEFORE YOU SHARE"><div className="cp-review-tips"><Tip number="01" title="Check the date" text="Make sure the document is current and belongs to the right person." /><Tip number="02" title="Keep the original" text="Use the original report or prescription for clinical decisions." /><Tip number="03" title="Ask what is unclear" text="Add questions to your visit brief rather than guessing what a result means." /></div></Panel>
  </>;
}

function Tip({ number, title, text }: { number: string; title: string; text: string }) { return <div className="cp-tip"><span>{number}</span><div><strong>{title}</strong><p>{text}</p></div></div>; }

function VisitPrep({ medicines, readings, documents, profile }: Shared) {
  const defaultItems = ["Current medicine list and packages", "Allergies and sensitivities", "Recent readings and when they were taken", "Reports or discharge notes", "Questions and concerns to discuss"];
  const [checked, setChecked] = useState<boolean[]>(() => readStored<boolean[]>("carepath_visit_checklist", defaultItems.map(() => false)));
  const [questions, setQuestions] = useState<string[]>(() => readStored<string[]>("carepath_visit_questions", []));
  const [question, setQuestion] = useState("");
  const toggle = (index: number) => setChecked((current) => { const next = current.map((value, i) => i === index ? !value : value); saveStored("carepath_visit_checklist", next); return next; });
  const addQuestion = (event: FormEvent) => { event.preventDefault(); if (!question.trim()) return; const next = [...questions, question.trim()]; setQuestions(next); saveStored("carepath_visit_questions", next); setQuestion(""); };
  const labResults = readStored<ReportResult[]>("carepath_lab_results", []);
  const symptomNotes = readStored<SymptomEntry[]>("carepath_symptom_notes", []);
  const summaryItems = [medicines.length ? `${medicines.length} medicine entries saved` : "No medicine entries saved", readings.length ? `${readings.length} health readings saved` : "No health readings saved", labResults.length ? `${labResults.length} report values recorded by you` : "No report values saved", documents.length ? `${documents.length} document references saved` : "No documents saved", symptomNotes.length ? `${symptomNotes.length} symptom notes saved` : "No symptom notes saved", profile.allergies ? `Allergy notes: ${profile.allergies}` : "Allergy information not recorded"];
  const exportBrief = () => { const payload = { exportedAt: new Date().toISOString(), purpose: "CAREPATH demo visit brief", profile, medicines, readings, labResults, documents, symptomNotes, questions, checklist: defaultItems.map((item, index) => ({ item, ready: Boolean(checked[index]) })) }; const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = `carepath-visit-brief-${todayISO()}.json`; link.click(); URL.revokeObjectURL(url); };
  return <>
    <PageHeader eyebrow="A MORE PREPARED CONVERSATION" title="Doctor Visit Prep" description="Collect the details you want to bring and the questions you want to remember." icon={<Stethoscope size={24} />} action={<div className="cp-page-action-group"><button className="cp-button quiet" onClick={exportBrief}><ArrowDownToLine size={16} /> Export brief</button><button className="cp-button primary" onClick={() => window.print()}><Printer size={16} /> Print visit brief</button></div>} />
    <div className="cp-visit-grid"><Panel title="My visit checklist" eyebrow={`${checked.filter(Boolean).length} OF ${checked.length} READY`}><div className="cp-checklist">{defaultItems.map((item, index) => <label className={`cp-checklist-item ${checked[index] ? "checked" : ""}`} key={item}><input type="checkbox" checked={checked[index] ?? false} onChange={() => toggle(index)} /><span className="cp-checkbox"><Check size={14} /></span><span>{item}</span></label>)}</div><form className="cp-add-question" onSubmit={addQuestion}><label htmlFor="visit-question">A question I want to ask</label><div><input id="visit-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Write a question to bring along…" /><button className="cp-button primary" type="submit"><Plus size={15} /> Add</button></div></form>{questions.length > 0 && <div className="cp-question-list">{questions.map((item, index) => <div key={`${item}-${index}`}><MessageCircle size={15} /><span>{item}</span><button aria-label={`Remove question ${index + 1}`} onClick={() => { const next = questions.filter((_, i) => i !== index); setQuestions(next); saveStored("carepath_visit_questions", next); }}><Trash2 size={14} /></button></div>)}</div>}</Panel>
    <div className="cp-visit-aside"><Panel title="My saved snapshot" eyebrow="FOR MY REFERENCE"><div className="cp-visit-summary">{summaryItems.map((item) => <div key={item}><CheckCircle2 size={16} /><span>{item}</span></div>)}</div><Notice tone="warm">Confirm your medicines and allergies against current source information before sharing.</Notice><span className="cp-private-note"><ShieldCheck size={14} /> Your information stays on this device.</span></Panel><Panel title="My clinician"><div className="cp-clinician-card"><div className="cp-clinician-avatar"><Stethoscope size={20} /></div><div><strong>{profile.clinician || "Clinician not added"}</strong><small>{profile.clinician ? "Saved in your care profile" : "Add a name in Settings if helpful"}</small></div></div></Panel></div></div>
  </>;
}

function CareCircle({ profile, medicines, readings, documents, bump }: Shared) {
  const labResults = readStored<ReportResult[]>("carepath_lab_results", []);
  const symptomNotes = readStored<SymptomEntry[]>("carepath_symptom_notes", []);
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [shareChoices, setShareChoices] = useState<string[]>(() => readStored<string[]>("carepath_care_circle_permissions", []));
  const [shareNotice, setShareNotice] = useState("");
  const shareOptions = [
    { key: "medicines", label: "Medicine list", description: "Saved names, strengths, and schedule notes" },
    { key: "profile", label: "Allergies and health context", description: "Only allergy and condition notes" },
    { key: "readings", label: "Health readings", description: "Saved values, dates, and source labels" },
    { key: "labResults", label: "Lab result notes", description: "Values and dates you copied from a report" },
    { key: "documents", label: "Document references", description: "Names, type, date, and review status" },
    { key: "symptomNotes", label: "Symptom notes", description: "Your symptom notes and dates; review before sharing" },
  ];
  const toggleShareChoice = (key: string) => {
    const next = shareChoices.includes(key) ? shareChoices.filter((item) => item !== key) : [...shareChoices, key];
    setShareChoices(next);
    saveStored("carepath_care_circle_permissions", next);
  };
  const exportSharedCopy = () => {
    const payload: Record<string, unknown> = { preparedAt: new Date().toISOString(), note: "CAREPATH prepared this local copy from the sections you selected. Review it before sharing; nothing was sent automatically.", includedSections: shareChoices };
    if (shareChoices.includes("medicines")) payload.medicines = medicines;
    if (shareChoices.includes("profile")) payload.healthNotes = { allergies: form.allergies, conditions: form.conditions };
    if (shareChoices.includes("readings")) payload.readings = readings;
    if (shareChoices.includes("labResults")) payload.labResults = labResults;
    if (shareChoices.includes("documents")) payload.documents = documents;
    if (shareChoices.includes("symptomNotes")) payload.symptomNotes = symptomNotes;
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `carepath-care-circle-${todayISO()}.json`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setShareNotice("Your selected copy is ready on this device. Check it before sharing.");
  };
  useEffect(() => setForm(profile), [profile]);
  const update = (field: keyof Profile, value: string) => { setForm((current) => ({ ...current, [field]: value })); setSaved(false); };
  const save = (event: FormEvent) => { event.preventDefault(); saveStored("carepath_profile", form); setSaved(true); bump(); window.dispatchEvent(new Event("carepath:refresh")); };
  return <>
    <PageHeader eyebrow="PEOPLE & PREFERENCES" title="Care Circle" description="Keep your background notes and trusted contact information close at hand." icon={<Users size={24} />} />
    <div className="cp-profile-layout"><Panel title="My health profile" eyebrow="OPTIONAL PERSONAL DETAILS"><form className="cp-profile-form" onSubmit={save}><label>Preferred name<input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Name to show in CAREPATH" /></label><label>Age<input inputMode="numeric" value={form.age} onChange={(event) => update("age", event.target.value)} placeholder="Optional" /></label><label>Blood type<input value={form.bloodType === "Not provided" ? "" : form.bloodType} onChange={(event) => update("bloodType", event.target.value)} placeholder="Only if known" /></label><label className="span-two">Allergies or sensitivities<textarea rows={3} value={form.allergies} onChange={(event) => update("allergies", event.target.value)} placeholder="Include only information you know; verify with your care team." /></label><label className="span-two">Health conditions or context<textarea rows={3} value={form.conditions} onChange={(event) => update("conditions", event.target.value)} placeholder="Optional notes to help prepare for a visit." /></label><label>Doctor, oncology team, or clinic<input value={form.clinician} onChange={(event) => update("clinician", event.target.value)} placeholder="Optional" /></label><label>Doctor or clinic phone<input type="tel" value={form.clinicianPhone} onChange={(event) => update("clinicianPhone", event.target.value)} placeholder="Include country code if useful" /></label><label>Preferred pharmacy<input value={form.pharmacy} onChange={(event) => update("pharmacy", event.target.value)} placeholder="Optional pharmacy name" /></label><label>Pharmacy phone<input type="tel" value={form.pharmacyPhone} onChange={(event) => update("pharmacyPhone", event.target.value)} placeholder="For a stock or refill question" /></label><label className="span-two">Area or city for nearby searches<input value={form.locationHint} onChange={(event) => update("locationHint", event.target.value)} placeholder="Optional; helps find a pharmacy without sharing device location" /></label><button className="cp-button primary" type="submit">Save my profile</button>{saved && <span className="cp-save-confirm"><CheckCircle2 size={15} /> Saved on this device</span>}</form>
      <div className="cp-contact-actions"><strong>Reach your care team</strong><span>These buttons open your phone's calling or messaging app.</span><div>{form.clinicianPhone.trim() ? <><a className="cp-button quiet" href={`tel:${form.clinicianPhone.replace(/[^\d+*#]/g, "")}`}><Phone size={15} /> Call {form.clinician || "doctor"}</a><a className="cp-button quiet" href={`sms:${form.clinicianPhone.replace(/[^\d+*#]/g, "")}`}><MessageSquareText size={15} /> Message</a></> : <button className="cp-button quiet" onClick={() => document.querySelector<HTMLInputElement>("input[type='tel']")?.focus()}>Add a phone number</button>}</div></div>
      </Panel>
      <div className="cp-visit-aside"><Panel title="Trusted contact" eyebrow="FOR YOUR EMERGENCY CARD"><form className="cp-profile-form contact" onSubmit={save}><label>Contact name<input value={form.emergencyName} onChange={(event) => update("emergencyName", event.target.value)} placeholder="Name" /></label><label>Relationship<input value={form.emergencyRelation} onChange={(event) => update("emergencyRelation", event.target.value)} placeholder="For example, partner" /></label><label className="span-two">Phone<input type="tel" value={form.emergencyPhone} onChange={(event) => update("emergencyPhone", event.target.value)} placeholder="Include country code if useful" /></label><button className="cp-button primary" type="submit">Save contact</button></form>{form.emergencyPhone.trim() && <div className="cp-contact-actions compact"><div><a className="cp-button quiet" href={`tel:${form.emergencyPhone.replace(/[^\d+*#]/g, "")}`}><Phone size={15} /> Call</a><a className="cp-button quiet" href={`sms:${form.emergencyPhone.replace(/[^\d+*#]/g, "")}`}><MessageSquareText size={15} /> Message</a></div></div>}<Notice>Only add details you are comfortable storing in this browser.</Notice></Panel><Panel title="What gets shared?"><p className="cp-muted-copy">CAREPATH keeps these details on this device. It does not send alerts or share your health information with a contact automatically. Your phone's messaging or calling app receives the number only after you choose a button.</p></Panel>
        <Panel title="Care Circle permissions" eyebrow="YOU CHOOSE WHAT TO INCLUDE"><p className="cp-muted-copy">Select sections to prepare a separate shareable copy. These choices do not give anyone access to your device or send anything automatically.</p><div className="cp-share-permissions">{shareOptions.map((option) => <label key={option.key}><input type="checkbox" checked={shareChoices.includes(option.key)} onChange={() => toggleShareChoice(option.key)} /><span><strong>{option.label}</strong><small>{option.description}</small></span></label>)}</div><button className="cp-button primary" disabled={!shareChoices.length} onClick={exportSharedCopy}><ArrowDownToLine size={16} /> Prepare selected copy</button>{shareNotice && <p className="cp-save-confirm" role="status"><CheckCircle2 size={15} /> {shareNotice}</p>}</Panel>
      </div></div>
  </>;
}

function SafetyAlerts({ medicines, profile, medEvents, onScheduleReview, onNavigate }: Shared) {
  const [medicineId, setMedicineId] = useState(medicines[0]?.id ?? "");
  const [showReviewTime, setShowReviewTime] = useState(false);
  const [reviewAt, setReviewAt] = useState(() => {
    const later = new Date(Date.now() + 60 * 60 * 1000);
    later.setMinutes(Math.ceil(later.getMinutes() / 5) * 5, 0, 0);
    return new Date(later.getTime() - later.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  });
  const selectedMedicine = medicines.find((item) => item.id === medicineId);
  const alerts = [
    ...(!profile.allergies.trim() ? [{ title: "Allergy information is not recorded", detail: "No allergy information is saved. Confirm what belongs in your profile with a care professional.", icon: <Heart size={17} /> }] : []),
    ...medicines.filter((medicine) => !medicine.schedule || !medicine.instructions).map((medicine) => ({ title: `Review saved details for ${medicine.name}`, detail: "A schedule or personal instruction note is missing from this entry.", icon: <Pill size={17} /> })),
    ...(medEvents.length ? [{ title: "Dose notes are personal reminders", detail: `${medEvents.length} event${medEvents.length === 1 ? "" : "s"} recorded. Follow your current prescription instructions; this app does not issue reminders.`, icon: <AlarmClock size={17} /> }] : []),
  ];
  const saveDoseOutcome = (status: MedicationEvent["status"]) => {
    if (!selectedMedicine) return;
    const now = new Date();
    const event: MedicationEvent = {
      id: `dose-note-${Date.now()}`,
      medicine: `${selectedMedicine.name} ${selectedMedicine.strength}`.trim(),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: todayISO(),
      status,
    };
    const next = [event, ...readStored<MedicationEvent[]>("carepath_medication_log", [])];
    if (!saveStored("carepath_medication_log", next)) return;
    window.dispatchEvent(new Event("carepath:refresh"));
  };
  const scheduleReview = () => {
    if (!selectedMedicine || !reviewAt || new Date(reviewAt).getTime() <= Date.now()) return;
    saveDoseOutcome("Remind Later");
    onScheduleReview(`${selectedMedicine.name} · review written guidance`, reviewAt);
    setShowReviewTime(false);
  };
  return <>
    <PageHeader eyebrow="INFORMATION TO REVIEW" title="Safety Alerts" description="This space flags missing information in your own record; it does not predict risk or detect medical emergencies." icon={<CircleAlert size={24} />} />
    <Notice tone="warm">CAREPATH does not monitor you, send alerts to others, or check clinical interactions. For an emergency, contact local emergency services.</Notice>
    <Panel title={alerts.length ? "Items to review" : "Your record is up to date"} eyebrow={`${alerts.length} PERSONAL RECORD ${alerts.length === 1 ? "NOTE" : "NOTES"}`}>
      {alerts.length ? <div className="cp-alert-list">{alerts.map((item) => <div className="cp-alert-item" key={item.title}><span>{item.icon}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div><span className="cp-status-tag warm">Review</span></div>)}</div> : <EmptyState icon={<CheckCircle2 />} title="No missing notes in this view" text="This only reflects whether profile fields and personal schedule notes are present. It is not a clinical safety assessment." />}
      <div className="cp-inline-actions"><button className="cp-button quiet" onClick={() => onNavigate("Care Circle")}>Review profile</button><button className="cp-button quiet" onClick={() => onNavigate("Safety Check")}>Open Safety Check</button></div>
    </Panel>
    <Panel title="I Missed a Dose" eyebrow="RECORD WHAT HAPPENED · NO DOSE ADVICE">
      <p className="cp-muted-copy">Choose a medicine and save what happened. These buttons only make a personal note. They do not tell you what to take or change.</p>
      {medicines.length ? <>
        <label className="cp-missed-select">Medicine<select value={medicineId} onChange={(event) => setMedicineId(event.target.value)}>{medicines.map((item) => <option key={item.id} value={item.id}>{item.name} {item.strength}</option>)}</select></label>
        <div className="cp-missed-choice-grid" role="group" aria-label="Record the dose status">
          <button onClick={() => saveDoseOutcome("Taken")}><CheckCircle2 size={18} /><strong>Taken</strong><span>I already took it</span></button>
          <button onClick={() => saveDoseOutcome("Skipped")}><CircleAlert size={18} /><strong>Skipped</strong><span>I did not take it</span></button>
          <button onClick={() => { setShowReviewTime(true); }}><AlarmClock size={18} /><strong>Remind Later</strong><span>Review the written guidance</span></button>
          <button onClick={() => saveDoseOutcome("Not Sure")}><Info size={18} /><strong>Not Sure</strong><span>I need help checking</span></button>
        </div>
        {showReviewTime && <div className="cp-review-reminder-form"><label>When should CAREPATH remind you to review this?<input type="datetime-local" min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)} value={reviewAt} onChange={(event) => setReviewAt(event.target.value)} /></label><button className="cp-button primary" onClick={scheduleReview} disabled={!reviewAt || new Date(reviewAt).getTime() <= Date.now()}><AlarmClock size={15} /> Save review reminder</button><small>This reminder is only to check the written instructions or contact a pharmacist. It never means “take the dose later.”</small></div>}
      </> : <EmptyState icon={<Pill />} title="Add your medicine list first" text="A medicine name is needed to save a dose note." action={<button className="cp-button primary" onClick={() => onNavigate("My Medicines")}>Add a medicine</button>} />}
      <div className="cp-missed-guidance"><strong>If you are unsure</strong><p>Check the patient leaflet or current prescription. If it does not clearly explain what to do, ask a pharmacist or prescriber. CAREPATH cannot know the medicine or timing and will not suggest an extra dose.</p><a href="https://medlineplus.gov/ency/patientinstructions/000613.htm" target="_blank" rel="noreferrer">MedlinePlus: managing medicines at home <ArrowRight size={13} /></a></div>
      <div className="cp-inline-actions"><button className="cp-button quiet" onClick={() => onNavigate("Visit Prep")}><MessageCircle size={15} /> Add a question for my visit</button></div>
    </Panel>
    <Panel title="Recent medicine notes" eyebrow={`${medEvents.length} SAVED ON THIS DEVICE`}>
      {medEvents.length ? <div className="cp-dose-history">{medEvents.slice(0, 8).map((event) => <div key={event.id}><span className={`cp-dose-status ${event.status.toLowerCase().replace(/\s/g, "-")}`}>{event.status}</span><strong>{event.medicine}</strong><small>{dateLabel(event.date)} · {event.time}</small></div>)}</div> : <EmptyState icon={<AlarmClock />} title="No dose notes yet" text="When you choose an outcome above, your note will appear here." />}
    </Panel>
  </>;
}

function Emergency({ medicines, profile, onNavigate }: Shared) {
  const [copied, setCopied] = useState(false);
  const id = readStored<string>("carepath_emergency_id", "CP-7X4K-29QM");
  const copy = async () => { try { await navigator.clipboard.writeText(id); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); } };
  return <>
    <PageHeader eyebrow="QUICK ACCESS WHEN IT MATTERS" title="Emergency & CAREPATH ID" description="A personal information card for reference. CAREPATH does not contact emergency services or transmit your information." icon={<HeartPulse size={24} />} action={<button className="cp-button primary" onClick={() => window.print()}><Printer size={16} /> Print emergency card</button>} />
    <div className="cp-emergency-grid"><section className="cp-emergency-call"><div className="cp-emergency-icon"><HeartPulse size={28} /></div><span className="cp-eyebrow">IF SOMEONE IS IN IMMEDIATE DANGER</span><h2>Contact local emergency services now.</h2><p>Do not wait for CAREPATH. If you are in India, dial 112. Otherwise, use the emergency number for your location.</p><a className="cp-emergency-phone" href="tel:112"><span><span className="cp-live-dot" /> India emergency helpline</span><strong>112 <ArrowRight size={18} /></strong></a><small>Calling availability depends on your phone, network and location.</small></section><Panel title="My CAREPATH ID" eyebrow="PERSONAL REFERENCE" className="cp-id-panel"><div className="cp-id-card"><div className="cp-id-mark"><HeartPulse size={19} /></div><span>CAREPATH ID</span><strong>{id}</strong><small>{profile.name}</small></div><button className="cp-button quiet cp-full-button" onClick={copy}><Copy size={15} /> {copied ? "Copied" : "Copy ID"}</button><p className="cp-muted-copy">This is a reference code only. It does not open a medical record or share details.</p></Panel></div>
    <div className="cp-two-column"><Panel title="Emergency information" eyebrow="YOUR SAVED NOTES"><div className="cp-emergency-facts"><Detail label="Name" value={profile.name} /><Detail label="Age" value={profile.age || "Not provided"} /><Detail label="Blood type" value={profile.bloodType} /><Detail label="Allergies / sensitivities" value={profile.allergies || "Not recorded"} /><Detail label="Health context" value={profile.conditions || "Not recorded"} /></div><button className="cp-text-link" onClick={() => onNavigate("Care Circle")}>Edit health profile <ArrowRight size={15} /></button></Panel><Panel title="My medicines" eyebrow={`${medicines.length} SAVED`}><div className="cp-compact-meds">{medicines.length ? medicines.slice(0, 5).map((item) => <div key={item.id}><Pill size={15} /><span><strong>{item.name}</strong><small>{item.strength} · {item.schedule}</small></span></div>) : <p>No medicine list saved.</p>}</div><button className="cp-text-link" onClick={() => onNavigate("Medicine Passport")}>View medicine passport <ArrowRight size={15} /></button></Panel></div>
    <Notice tone="warm">Keep an up-to-date emergency card with you. This browser-based demo is not a medical alert service.</Notice>
  </>;
}

function Learn({ onNavigate }: Shared) {
  const [done, setDone] = useState<Record<string, boolean>>(() => readStored<Record<string, boolean>>(`carepath_daily_care_${todayISO()}`, {}));
  const topics = [
    { number: "01", title: "Blood pressure over time", badge: "HYPERTENSION", color: "teal", text: "Build a routine around the plan your care team gave you. Record measurements with date, time, and context; bring the monitor or its instructions when you review the pattern. Take prescribed medicines as directed and ask before changing them. Movement, food choices, and tobacco support can also be part of long-term care.", route: "Health Tracker", action: "Open blood pressure tracker", source: "WHO: Hypertension", url: "https://www.who.int/news-room/fact-sheets/detail/hypertension" },
    { number: "02", title: "Diabetes day to day", badge: "DIABETES", color: "amber", text: "Keep your own diabetes plan easy to find: medicine instructions, meals, activity, monitoring guidance, and what to do if you feel unwell. Monitoring frequency and targets are personal; use the plan from your diabetes team. This app can organize readings and questions, not set targets or change insulin or other treatment.", route: "Health Tracker", action: "Log a reading", source: "WHO: Diabetes", url: "https://www.who.int/news-room/fact-sheets/detail/diabetes" },
    { number: "03", title: "Living with cancer and treatment", badge: "CANCER SUPPORT", color: "rose", text: "Keep your oncology team's contact, current treatment list, and written after-hours instructions together. During cancer treatment, infection can become serious; follow your team's personal fever plan and contact them promptly for fever or infection signs. Ask before taking a fever medicine because it may hide a symptom. Do not use this app to decide whether to delay treatment.", route: "Care Circle", action: "Save oncology contact", source: "NCI: Infection during cancer treatment", url: "https://www.cancer.gov/about-cancer/treatment/side-effects/infection" },
    { number: "04", title: "A steady medicine routine", badge: "REGULAR MEDICINES", color: "blue", text: "Use the current package or prescription as the source for each medicine's name, strength, time, and instructions. Keep a refill note, include non-prescription products and supplements in your list, and carry it when care changes. If a dose is missed or a label is unclear, ask a pharmacist or prescriber rather than doubling or guessing.", route: "Medicine Passport", action: "Review my medicine list", source: "WHO: Self-care for health and well-being", url: "https://www.who.int/news-room/fact-sheets/detail/self-care-health-interventions/" },
    { number: "05", title: "Short-lived cold or fever symptoms", badge: "TEMPORARY ILLNESS", color: "violet", text: "For an otherwise mild common cold, basic self-care such as rest and fluids may be enough while symptoms improve. You do not need to turn every mild cold into an appointment. Get personalized advice sooner if you have a long-term condition, a weakened immune system, worsening or unusual symptoms, breathing difficulty, chest pain, or concern. If you are receiving cancer treatment, use your oncology team's fever instructions first.", route: "ASK CAREPATH", action: "Find trusted guidance", source: "NHS: Common cold", url: "https://www.nhs.uk/conditions/common-cold/" },
  ];
  const actions = ["Review medicine times using my own current instructions", "Record a BP or glucose reading if it is part of my care plan", "Write down one question, refill need, or symptom to remember"];
  const toggle = (key: string) => setDone((current) => { const next = { ...current, [key]: !current[key] }; saveStored(`carepath_daily_care_${todayISO()}`, next); return next; });
  return <>
    <PageHeader eyebrow="LONG-TERM CARE, MADE EASIER TO ORGANIZE" title="My Everyday Health Guide" description="Put routines, trusted learning, and your own care team details together. Use the app between planned check-ins; it cannot replace an urgent response or make treatment decisions." icon={<BookOpen size={24} />} action={<button className="cp-button primary" onClick={() => onNavigate("ASK CAREPATH")}><Search size={16} /> Search a health topic</button>} />
    <Notice tone="good"><strong>Not every minor, short-lived cold needs a clinic visit.</strong> Use practical self-care when appropriate, and know when your personal condition or symptoms call for help. Regular care for long-term conditions still matters; follow the schedule and action plan agreed with your team.</Notice>
    <div className="cp-care-routine-layout"><Panel title="A small plan for today" eyebrow="OPTIONAL · SAVED ON THIS DEVICE"><p className="cp-muted-copy">Choose the reminders that fit your own plan. These checkboxes do not change prescriptions or decide what measurements you need.</p><div className="cp-care-checklist">{actions.map((action, index) => { const key = `${index}-${action}`; return <label className={done[key] ? "checked" : ""} key={key}><input type="checkbox" checked={Boolean(done[key])} onChange={() => toggle(key)} /><span className="cp-checkbox"><Check size={14} /></span><span>{action}</span></label>; })}</div><small className="cp-private-note"><ShieldCheck size={14} /> Your checklist is stored in this browser. Clear browser data to remove it.</small></Panel><Panel title="Your one-tap workspaces" eyebrow="NO NEED TO SEARCH AROUND"><div className="cp-care-shortcuts"><button onClick={() => onNavigate("My Medicines")}><Pill size={18} /><span><strong>Medicine routine</strong><small>List, passport, and reminders</small></span><ArrowRight size={15} /></button><button onClick={() => onNavigate("Health Tracker")}><HeartPulse size={18} /><span><strong>BP, glucose & readings</strong><small>Record and see your own trends</small></span><ArrowRight size={15} /></button><button onClick={() => onNavigate("Care Circle")}><Phone size={18} /><span><strong>People who support me</strong><small>Doctor, pharmacy, and trusted contact</small></span><ArrowRight size={15} /></button></div></Panel></div>
    <section className="cp-condition-guides"><div className="cp-section-heading"><div><span className="cp-eyebrow">PLAIN-LANGUAGE STARTING POINTS</span><h2>Guidance for the whole journey</h2></div><span>Open each official source for full details</span></div><div className="cp-condition-grid">{topics.map((topic) => <article className={`cp-condition-card ${topic.color}`} key={topic.title}><div className="cp-condition-top"><span>{topic.badge}</span><b>{topic.number}</b></div><h3>{topic.title}</h3><p>{topic.text}</p><div className="cp-condition-actions"><button className="cp-button quiet" onClick={() => onNavigate(topic.route)}>{topic.action}<ArrowRight size={14} /></button><a href={topic.url} target="_blank" rel="noreferrer">{topic.source}<ArrowRight size={13} /></a></div></article>)}</div></section>
    <div className="cp-learning-actions"><button className="cp-button quiet" onClick={() => onNavigate("Health Map")}><MapPin size={16} /> Find nearby medicine places</button><button className="cp-button quiet" onClick={() => onNavigate("Visit Prep")}><Stethoscope size={16} /> Build a visit brief when useful</button><button className="cp-button quiet" onClick={() => onNavigate("Care Circle")}><MessageSquareText size={16} /> Call or message my care team</button></div>
    <Notice>These linked sources are general education. Guidance can vary by country and by your treatment. CAREPATH cannot prescribe medicines or determine that it is safe for you to skip or delay needed care.</Notice>
  </>;
}

function SettingsPage({ profile, bump, medicines, readings, documents, onNavigate }: Shared) {
  const [notice, setNotice] = useState("");
  const labResults = readStored<ReportResult[]>("carepath_lab_results", []);
  const symptomNotes = readStored<SymptomEntry[]>("carepath_symptom_notes", []);
  const exportData = () => {
    const localRecord: Record<string, unknown> = {};
    try {
      Object.keys(localStorage).filter((key) => key.startsWith("carepath_")).sort().forEach((key) => {
        const raw = localStorage.getItem(key);
        if (raw === null) return;
        try { localRecord[key] = JSON.parse(raw); } catch { localRecord[key] = raw; }
      });
    } catch { setNotice("This browser could not read the local CAREPATH record for export."); return; }
    const payload = { exportedAt: new Date().toISOString(), purpose: "Personal CAREPATH browser record backup", storage: "This export includes the CAREPATH data keys saved in this browser, including records, preferences, and reminders.", records: localRecord };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `carepath-record-${todayISO()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Your record export was prepared by this browser.");
  };
  const deleteLocalRecord = () => {
    if (!window.confirm("Delete CAREPATH notes saved in this browser? This cannot be undone here. Keep an export first if you may need it.")) return;
    Object.keys(localStorage).filter((key) => key.startsWith("carepath_")).forEach((key) => localStorage.removeItem(key));
    setNotice("Your CAREPATH notes were deleted from this browser.");
    bump();
    window.dispatchEvent(new Event("carepath:refresh"));
  };
  const restoreDemo = () => {
    const id = `CP-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    saveStored("carepath_emergency_id", id);
    if (!localStorage.getItem("carepath_profile")) saveStored("carepath_profile", { ...DEFAULT_PROFILE, name: "Demo User" });
    setNotice("Your personal CAREPATH reference is ready. Add your own details when you are comfortable.");
    bump();
    window.dispatchEvent(new Event("carepath:refresh"));
  };
  return <>
    <PageHeader eyebrow="YOU ARE IN CONTROL" title="Settings & Privacy" description="Manage your local record, profile, and how your information is stored." icon={<ShieldCheck size={24} />} />
    <div className="cp-settings-grid"><Panel title="Your data on this device" eyebrow="LOCAL-FIRST"><div className="cp-privacy-summary"><span className="cp-privacy-icon"><ShieldCheck size={22} /></span><div><strong>CAREPATH stores your notes in this browser</strong><p>Medicines, readings, symptom notes, visit preparation, report values, and profile details use this device’s local storage. They are not synced to a server by this demo.</p></div></div><div className="cp-data-counts"><span><strong>{medicines.length}</strong> medicines</span><span><strong>{readings.length}</strong> readings</span><span><strong>{labResults.length}</strong> report values</span><span><strong>{documents.length}</strong> document references</span><span><strong>{symptomNotes.length}</strong> symptom notes</span></div><div className="cp-settings-actions"><button className="cp-button primary" onClick={exportData}><ArrowDownToLine size={16} /> Export my record</button><button className="cp-button quiet" onClick={restoreDemo}><Sparkles size={15} /> Set up CAREPATH ID</button><button className="cp-button danger" onClick={deleteLocalRecord}><Trash2 size={15} /> Delete local record</button></div>{notice && <Notice tone="good">{notice}</Notice>}</Panel><Panel title="Profile & emergency details" eyebrow="OPTIONAL"><p className="cp-muted-copy">{profile.allergies || profile.emergencyName ? "Your profile includes saved personal details." : "You have not added personal allergy or trusted contact notes yet."}</p><button className="cp-button quiet" onClick={() => onNavigate("Care Circle")}>Open Care Circle profile</button></Panel></div>
    <Notice tone="warm">Deleting browser data or using another browser may remove or separate this record. Keep your clinical records in the original source system too.</Notice>
  </>;
}

function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) { return <div className="cp-empty"><span>{icon}</span><h3>{title}</h3><p>{text}</p>{action}</div>; }

