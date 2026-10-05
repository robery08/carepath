import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import {
  Activity,
  AlarmClock,
  ArrowDownToLine,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Brain,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  MapPin,
  MessageCircle,
  Pill,
  Plus,
  Printer,
  ScanLine,
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
};

type DocumentRecord = {
  id: string;
  name: string;
  kind: string;
  date: string;
  status: string;
  fields: string[];
};

type MedicationEvent = {
  id: string;
  medicine: string;
  time: string;
  date: string;
  status: "Taken" | "Skipped";
};

type Props = {
  active: string;
  medicineCount: number;
  onOpenMedicines: () => void;
  onOpenMonitor: () => void;
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
};

const EXTRACTED_SAMPLE = [
  { name: "Paracetamol", strength: "500 mg", form: "Tablet", schedule: "8:00 PM", instructions: "After food" },
  { name: "Amlodipine", strength: "5 mg", form: "Tablet", schedule: "8:00 AM", instructions: "Morning" },
  { name: "Atorvastatin", strength: "10 mg", form: "Tablet", schedule: "10:00 PM", instructions: "Night" },
];

const DEFAULT_MEDICINES: Medicine[] = [
  { id: "1", name: "Paracetamol", strength: "500 mg", form: "Tablet", schedule: "8:00 PM", instructions: "After food" },
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
    return true;
  } catch {
    return false;
  }
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "CP";
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

export default function CarePathModules({ active, medicineCount, onOpenMedicines, onOpenMonitor, onNavigate }: Props) {
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

  const shared = { medicines, readings, documents, profile, medEvents, bump, onOpenMedicines, onOpenMonitor, onNavigate };

  return (
    <div className="cp-module">
      {active === "AI Hub" && <AIHub {...shared} />}
      {active === "My Medicines" && <MedicinePassport {...shared} />}
      {active === "Scan & Upload" && <Scanner {...shared} />}
      {active === "Medicine Passport" && <MedicinePassport {...shared} />}
      {active === "Safety Check" && <SafetyReview {...shared} />}
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
  onNavigate: (section: string) => void;
};

function AIHub({ medicines, readings, documents, profile, onNavigate }: Shared) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => readStored<Array<{ role: "user" | "assistant"; text: string; time: string }>>("carepath_ai_conversation", []));
  const answerFor = (question: string) => {
    const q = question.toLowerCase();
    const exampleList = medicines.length > 0 && medicines.every((item) => ["1", "2", "3", "4"].includes(item.id));
    if (/dose|dosage|interaction|safe to take|should i take|side effect/.test(q)) {
      return "I can help organize information, but I can’t determine a safe dose, diagnose a condition, or confirm whether medicines interact. Check the prescription label and ask a pharmacist or clinician before changing anything. If you may be having a severe reaction, use Emergency Help now.";
    }
    if (/medicine|medication|prescription/.test(q)) {
      return medicines.length
        ? `${exampleList ? "The example CAREPATH list shows" : "Your CAREPATH list has"} ${medicines.length} medicine${medicines.length === 1 ? "" : "s"}: ${medicines.slice(0, 4).map((item) => `${item.name} ${item.strength}`).join(", ")}. These are saved notes, not verified prescribing instructions. Open My Medicines to review the details.`
        : "There are no saved medicines yet. Add them from the package or prescription, then compare every detail with the original instructions.";
    }
    if (/visit|doctor|appointment|question/.test(q)) {
      return `Your visit brief can include ${medicines.length} saved medicines, ${readings.length} health readings and ${documents.length} documents. Open Visit Prep to choose what to bring and add questions for your clinician.`;
    }
    if (/reading|trend|health data|blood pressure|glucose/.test(q)) {
      return readings.length
        ? `You have ${readings.length} saved health readings. CAREPATH can help you organize dates and values for a conversation with your care team; it does not interpret them as a diagnosis.`
        : "No personal readings are saved yet. Open Health Tracker to record values with their date, time and context.";
    }
    if (/allerg/.test(q)) return profile.allergies.trim() ? `Your profile lists: ${profile.allergies}. Please verify this list with your care team and keep the original record available.` : "No allergies are recorded in your profile yet. Add known allergies in Settings, or confirm with a clinician whether there are any to record.";
    return "I can summarize information you have saved in CAREPATH and help you prepare questions for a clinician. Try asking about your saved medicines, a health reading, allergies, or visit preparation. I don’t diagnose or recommend treatment.";
  };
  const send = (event?: FormEvent) => {
    event?.preventDefault();
    const question = input.trim();
    if (!question) return;
    const next = [...messages, { role: "user" as const, text: question, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, { role: "assistant" as const, text: answerFor(question), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }].slice(-24);
    setMessages(next);
    saveStored("carepath_ai_conversation", next);
    setInput("");
  };
  return <>
    <PageHeader eyebrow="YOUR PRIVATE ORGANIZER" title="CarePath AI Hub" description="Get plain-language help organizing your saved health information and preparing for care." icon={<Brain size={24} />} action={<span className="cp-local-pill"><span /> Works on this device</span>} />
    <div className="cp-ai-layout">
      <Panel title="Ask about your saved information" eyebrow="CAREPATH ASSIST">
        <div className="cp-chat-thread" aria-live="polite">
          {messages.length === 0 ? <div className="cp-chat-welcome"><div className="cp-ai-orb"><Sparkles size={27} /></div><h3>What would make today easier?</h3><p>Ask about your saved medicine list, readings, allergies, or a clinician visit.</p><div className="cp-prompt-grid">{["Summarize my medicine list", "Help me prepare for a visit", "What health readings have I saved?"].map((prompt) => <button key={prompt} onClick={() => { setInput(prompt); }}>{prompt}<ArrowRight size={15} /></button>)}</div></div> : messages.map((message, index) => <div className={`cp-message ${message.role}`} key={`${message.time}-${index}`}><div className="cp-message-avatar">{message.role === "assistant" ? <Sparkles size={15} /> : initials(profile.name)}</div><div><p>{message.text}</p><small>{message.time}</small></div></div>)}
        </div>
        <form className="cp-chat-composer" onSubmit={send}><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="Ask about your saved CAREPATH information…" rows={2} /><button type="submit" aria-label="Send message"><Send size={18} /></button></form>
        <p className="cp-composer-hint"><Info size={13} /> For organization and education only. This assistant does not diagnose or recommend treatment.</p>
      </Panel>
      <aside className="cp-ai-aside"><Panel title="Your CAREPATH snapshot"><div className="cp-snapshot-list"><Snapshot icon={<Pill />} label="Medicines" value={`${medicines.length} saved`} /><Snapshot icon={<Activity />} label="Health readings" value={`${readings.length} recorded`} /><Snapshot icon={<FileCheck2 />} label="Documents" value={`${documents.length} saved`} /><Snapshot icon={<Heart />} label="Allergy notes" value={profile.allergies.trim() ? "On file" : "Not added"} /></div></Panel><Panel title="Go to a workspace"><div className="cp-link-list"><button onClick={() => onNavigate("Medicine Passport")}>Medicine passport <ArrowRight size={15} /></button><button onClick={() => onNavigate("Visit Prep")}>Prepare for a visit <ArrowRight size={15} /></button><button onClick={() => onNavigate("Safety Check")}>Review your saved details <ArrowRight size={15} /></button></div></Panel></aside>
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
  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setSaved(false);
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
        <div className="cp-extraction-actions"><button className="cp-button primary" onClick={addSelected} disabled={!selected.some(Boolean)}><Plus size={16} /> Save selected notes</button><button className="cp-button quiet" onClick={() => { setSelected([true, true, true]); setSaved(false); }}>Reset preview</button></div>
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
    { title: "Repeated names", detail: duplicates.length ? `Check repeated entries: ${duplicates.map((item) => item.name).join(", ")}.` : "No exact repeated medicine names found in the saved list.", status: duplicates.length ? "Review list" : "List check only", tone: duplicates.length ? "warm" : "good", icon: <ListChecks size={18} /> },
    { title: "Instructions & schedule", detail: missingInfo.length ? `${missingInfo.length} entry${missingInfo.length === 1 ? "" : "ies"} need schedule or instruction notes.` : "Saved schedule and instruction fields are present; confirm against the original.", status: missingInfo.length ? "Review entries" : "Confirm source", tone: missingInfo.length ? "warm" : "info", icon: <Clock3 size={18} /> },
    { title: "Interactions & suitability", detail: "Not assessed by this offline demo. Ask a pharmacist or clinician to review your full list, allergies, and health history.", status: "Professional review", tone: "info", icon: <Stethoscope size={18} /> },
  ];
  return <>
    <PageHeader eyebrow="MEDICATION ORGANIZER" title="Safety Check" description="Review what is recorded, spot missing details, and prepare a complete list for a pharmacist or clinician." icon={<ShieldCheck size={24} />} action={<button className="cp-button primary" onClick={onOpenMedicines}><Pill size={16} /> Review medicine list</button>} />
    <Notice tone="warm"><strong>This is not a clinical interaction checker.</strong> CAREPATH does not determine whether a medicine is safe, diagnose a problem, or recommend treatment. For urgent symptoms or suspected reactions, seek professional help.</Notice>
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
  ];
  const counts = metrics.map((item) => readings.filter((reading) => reading.metric === item.name).length);
  const hasOnlyExamples = readings.length > 0 && readings.every((reading) => reading.id.startsWith("demo-"));
  return <>
    <PageHeader eyebrow="YOUR MEASUREMENTS" title="Health Tracker" description="Record readings with context and review how your saved values change over time." icon={<HeartPulse size={24} />} action={<button className="cp-button primary" onClick={onOpenMonitor}><Plus size={16} /> Add a reading</button>} />
    {hasOnlyExamples && <Notice>Example values are included so you can explore the tracker. Add your own readings to replace these examples.</Notice>}
    <div className="cp-metric-grid">{metrics.map((metric, index) => { const current = latestByMetric.get(metric.name); return <button className={`cp-metric-tile ${metric.tone}`} key={metric.name} onClick={onOpenMonitor}><span className="cp-metric-icon">{metric.icon}</span><span className="cp-metric-label">{metric.name}</span><strong>{current ? `${current.value}${current.secondValue === undefined ? "" : ` / ${current.secondValue}`}` : "—"}<small>{current?.unit || metric.unit}</small></strong><em>{current ? `${current.id.startsWith("demo-") ? "Example · " : ""}${dateLabel(current.date)} · ${current.time}` : "No saved reading"}</em><span className="cp-mini-bars" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ height: `${18 + ((i * 17 + counts[index] * 9) % 37)}px` }} />)}</span></button>; })}</div>
    <div className="cp-two-column"><Panel title="Recent readings" eyebrow={`${readings.length} TOTAL`}><div className="cp-reading-list">{readings.length ? readings.slice().sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)).slice(0, 6).map((reading) => <div className="cp-reading-line" key={reading.id}><span className="cp-reading-dot" /><span><strong>{reading.metric}</strong><small>{dateLabel(reading.date)} · {reading.time}{reading.note ? ` · ${reading.note}` : ""}</small></span><b>{reading.value}{reading.secondValue !== undefined ? ` / ${reading.secondValue}` : ""} <small>{reading.unit}</small></b></div>) : <EmptyState icon={<Activity />} title="Your tracker is ready" text="Add a reading with its date and context to begin building a useful record." />}</div></Panel><Panel title="Bring context to a reading" eyebrow="A USEFUL HABIT"><div className="cp-coach-card"><div className="cp-coach-icon"><Sparkles size={20} /></div><div><strong>Capture how and when</strong><p>Record the time, what was happening, and any symptoms or notes. Consistent context makes records easier to discuss at an appointment.</p></div></div><Notice>Values are for personal tracking. CAREPATH does not interpret measurements or replace medical advice.</Notice><button className="cp-text-link" onClick={() => onNavigate("Health Timeline")}>View health timeline <ArrowRight size={15} /></button></Panel></div>
  </>;
}

function Timeline({ readings, documents, medEvents, onNavigate }: Shared) {
  const entries = [
    ...readings.map((item) => ({ id: `reading-${item.id}`, date: item.date, time: item.time, title: item.metric, text: `${item.value}${item.secondValue !== undefined ? ` / ${item.secondValue}` : ""} ${item.unit}${item.note ? ` · ${item.note}` : ""}`, icon: <Activity size={16} />, kind: item.id.startsWith("demo-") ? "Example health reading" : "Health reading" })),
    ...documents.map((item) => ({ id: item.id, date: item.date, time: "12:00", title: item.name, text: `${item.kind} · ${item.status}`, icon: <FileCheck2 size={16} />, kind: "Document" })),
    ...medEvents.map((item) => ({ id: item.id, date: item.date, time: item.time, title: item.medicine, text: `Dose marked ${item.status.toLowerCase()}`, icon: <Pill size={16} />, kind: "Medicine note" })),
  ].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  return <>
    <PageHeader eyebrow="CONNECTED HISTORY" title="Health Timeline" description="See the health details you have saved together, in date order." icon={<CalendarDays size={24} />} action={<button className="cp-button quiet" onClick={() => onNavigate("Health Calendar")}><CalendarDays size={16} /> Open calendar</button>} />
    <div className="cp-timeline-summary"><div><span className="cp-summary-number">{readings.length}</span><span>Health readings</span></div><div><span className="cp-summary-number">{documents.length}</span><span>Documents saved</span></div><div><span className="cp-summary-number">{medEvents.length}</span><span>Medicine notes</span></div><div><span className="cp-summary-number">{new Set(entries.map((entry) => entry.date)).size}</span><span>Days with records</span></div></div>
    <Panel title="Your saved events" eyebrow="MOST RECENT FIRST"><div className="cp-timeline">{entries.length ? entries.map((entry, index) => <div className="cp-timeline-entry" key={entry.id}><div className="cp-timeline-rail"><span>{entry.icon}</span>{index < entries.length - 1 && <i />}</div><div className="cp-timeline-content"><div><span className="cp-eyebrow">{entry.kind} · {dateLabel(entry.date)}</span><h3>{entry.title}</h3><p>{entry.text}</p></div><time>{entry.time}</time></div></div>) : <EmptyState icon={<Clock3 />} title="Your timeline will grow with you" text="Add a health reading, save a document, or record a medicine event to create your first entry." />}</div></Panel>
    <div className="cp-inline-actions"><button className="cp-button quiet" onClick={() => onNavigate("Monitor")}><Plus size={16} /> Add health reading</button><button className="cp-button quiet" onClick={() => onNavigate("Scan & Upload")}><ScanLine size={16} /> Add document</button></div>
  </>;
}

function HealthCalendar({ readings, documents, medEvents }: Shared) {
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const today = todayISO();
  const eventDates = new Set([...readings.map((item) => item.date), ...documents.map((item) => item.date), ...medEvents.map((item) => item.date)]);
  const eventsOnSelectedMonth = [...eventDates].filter((date) => date.startsWith(`${year}-${String(monthIndex + 1).padStart(2, "0")}`)).length;
  return <>
    <PageHeader eyebrow="A CLEARER LOOK AT YOUR MONTH" title="Health Calendar" description="Find the days where you saved readings, medicine notes, or a document." icon={<CalendarDays size={24} />} />
    <div className="cp-calendar-layout"><Panel title={month.toLocaleDateString(undefined, { month: "long", year: "numeric" })} eyebrow={`${eventsOnSelectedMonth} DAYS WITH SAVED DETAILS`}><div className="cp-calendar-head"><button className="cp-icon-button" aria-label="Previous month" onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}><ChevronLeft size={17} /></button><strong>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong><button className="cp-icon-button" aria-label="Next month" onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}><ChevronRight size={17} /></button></div><div className="cp-calendar-grid">{"SMTWTFS".split("").map((day, index) => <span className="weekday" key={`${day}-${index}`}>{day}</span>)}{Array.from({ length: firstDay }, (_, i) => <span className="calendar-blank" key={`blank-${i}`} />)}{Array.from({ length: days }, (_, i) => { const date = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`; return <div className={`calendar-day ${date === today ? "today" : ""} ${eventDates.has(date) ? "has-event" : ""}`} key={date}><span>{i + 1}</span>{eventDates.has(date) && <i />}</div>; })}</div><div className="cp-calendar-legend"><span><i /> Saved health details</span><span><i className="today-dot" /> Today</span></div></Panel><Panel title="Make the calendar useful" eyebrow="YOUR RECORDS"><div className="cp-calendar-note"><CalendarDays size={22} /><p>Calendar markers come from your saved readings, document references, and medicine notes. CAREPATH does not create appointments or send reminders.</p></div><div className="cp-calendar-totals"><span><strong>{readings.length}</strong> readings</span><span><strong>{documents.length}</strong> documents</span><span><strong>{medEvents.length}</strong> medicine notes</span></div></Panel></div>
  </>;
}

function HealthMap({ medicines, readings, documents, profile, onNavigate }: Shared) {
  const mapItems = [
    { title: "Medicines", count: medicines.length, text: "Your saved medication notes", icon: <Pill />, route: "Medicine Passport", tone: "mint" },
    { title: "Vitals & readings", count: readings.length, text: "Measurements with date and context", icon: <HeartPulse />, route: "Health Tracker", tone: "blue" },
    { title: "Documents", count: documents.length, text: "Reports and document references", icon: <FileCheck2 />, route: "Tests & Reports", tone: "violet" },
    { title: "Care profile", count: profile.allergies || profile.conditions ? 1 : 0, text: "Allergy and health background notes", icon: <Heart />, route: "Care Circle", tone: "rose" },
  ];
  return <>
    <PageHeader eyebrow="ONE VIEW OF YOUR CARE" title="Health Map" description="Explore the information connected to your personal health record." icon={<MapPin size={24} />} />
    <div className="cp-map-overview"><div className="cp-body-map"><div className="cp-body-glow" /><div className="cp-body-head" /><div className="cp-body-torso"><HeartPulse size={28} /></div><div className="cp-body-arm left" /><div className="cp-body-arm right" /><div className="cp-body-leg left" /><div className="cp-body-leg right" /><span className="cp-map-node node-one"><Activity size={15} /></span><span className="cp-map-node node-two"><Pill size={15} /></span><span className="cp-map-node node-three"><Heart size={15} /></span></div><div className="cp-map-intro"><span className="cp-eyebrow">YOUR PERSONAL HEALTH MAP</span><h2>Everything you choose to keep, connected.</h2><p>CAREPATH brings your saved details into one place, so you can find and share the information that matters to you.</p><button className="cp-button primary" onClick={() => onNavigate("Visit Prep")}>Build a visit brief <ArrowRight size={15} /></button></div></div>
    <div className="cp-map-cards">{mapItems.map((item) => <button className={`cp-map-card ${item.tone}`} key={item.title} onClick={() => onNavigate(item.route)}><span className="cp-map-card-icon">{item.icon}</span><span><strong>{item.title}</strong><small>{item.text}</small></span><b>{item.count}<small>saved</small></b><ChevronRight size={17} /></button>)}</div>
  </>;
}

function Reports({ documents, onNavigate }: Shared) {
  return <>
    <PageHeader eyebrow="TESTS, REPORTS & RECORDS" title="My Reports" description="Keep document references beside the details you may want to discuss with your care team." icon={<FileCheck2 size={24} />} action={<button className="cp-button primary" onClick={() => onNavigate("Scan & Upload")}><Upload size={16} /> Add a document</button>} />
    <Notice>Document references stay in this browser. CAREPATH does not send them to a clinic or interpret test results.</Notice>
    <Panel title="Document shelf" eyebrow={`${documents.length} SAVED`}>
      {documents.length ? <div className="cp-document-list">{documents.map((document) => <DocumentRow key={document.id} document={document} />)}</div> : <EmptyState icon={<FilePlus2 />} title="A single place for your documents" text="Save the kind, date, and review notes for prescriptions, medicine labels, lab reports, and other records." action={<button className="cp-button primary" onClick={() => onNavigate("Scan & Upload")}><ScanLine size={16} /> Open Scan & Understand</button>} />}
    </Panel>
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
  const summaryItems = [medicines.length ? `${medicines.length} medicine entries saved` : "No medicine entries saved", readings.length ? `${readings.length} health readings saved` : "No health readings saved", documents.length ? `${documents.length} document references saved` : "No documents saved", profile.allergies ? `Allergy notes: ${profile.allergies}` : "Allergy information not recorded"];
  return <>
    <PageHeader eyebrow="A MORE PREPARED CONVERSATION" title="Doctor Visit Prep" description="Collect the details you want to bring and the questions you want to remember." icon={<Stethoscope size={24} />} action={<button className="cp-button primary" onClick={() => window.print()}><Printer size={16} /> Print visit brief</button>} />
    <div className="cp-visit-grid"><Panel title="My visit checklist" eyebrow={`${checked.filter(Boolean).length} OF ${checked.length} READY`}><div className="cp-checklist">{defaultItems.map((item, index) => <label className={`cp-checklist-item ${checked[index] ? "checked" : ""}`} key={item}><input type="checkbox" checked={checked[index] ?? false} onChange={() => toggle(index)} /><span className="cp-checkbox"><Check size={14} /></span><span>{item}</span></label>)}</div><form className="cp-add-question" onSubmit={addQuestion}><label htmlFor="visit-question">A question I want to ask</label><div><input id="visit-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Write a question to bring along…" /><button className="cp-button primary" type="submit"><Plus size={15} /> Add</button></div></form>{questions.length > 0 && <div className="cp-question-list">{questions.map((item, index) => <div key={`${item}-${index}`}><MessageCircle size={15} /><span>{item}</span><button aria-label={`Remove question ${index + 1}`} onClick={() => { const next = questions.filter((_, i) => i !== index); setQuestions(next); saveStored("carepath_visit_questions", next); }}><Trash2 size={14} /></button></div>)}</div>}</Panel>
    <div className="cp-visit-aside"><Panel title="My saved snapshot" eyebrow="FOR MY REFERENCE"><div className="cp-visit-summary">{summaryItems.map((item) => <div key={item}><CheckCircle2 size={16} /><span>{item}</span></div>)}</div><Notice tone="warm">Confirm your medicines and allergies against current source information before sharing.</Notice><span className="cp-private-note"><ShieldCheck size={14} /> Your information stays on this device.</span></Panel><Panel title="My clinician"><div className="cp-clinician-card"><div className="cp-clinician-avatar"><Stethoscope size={20} /></div><div><strong>{profile.clinician || "Clinician not added"}</strong><small>{profile.clinician ? "Saved in your care profile" : "Add a name in Settings if helpful"}</small></div></div></Panel></div></div>
  </>;
}

function CareCircle({ profile, bump }: Shared) {
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);
  useEffect(() => setForm(profile), [profile]);
  const update = (field: keyof Profile, value: string) => { setForm((current) => ({ ...current, [field]: value })); setSaved(false); };
  const save = (event: FormEvent) => { event.preventDefault(); saveStored("carepath_profile", form); setSaved(true); bump(); window.dispatchEvent(new Event("carepath:refresh")); };
  return <>
    <PageHeader eyebrow="PEOPLE & PREFERENCES" title="Care Circle" description="Keep your background notes and trusted contact information close at hand." icon={<Users size={24} />} />
    <div className="cp-profile-layout"><Panel title="My health profile" eyebrow="OPTIONAL PERSONAL DETAILS"><form className="cp-profile-form" onSubmit={save}><label>Preferred name<input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Name to show in CAREPATH" /></label><label>Age<input inputMode="numeric" value={form.age} onChange={(event) => update("age", event.target.value)} placeholder="Optional" /></label><label>Blood type<input value={form.bloodType === "Not provided" ? "" : form.bloodType} onChange={(event) => update("bloodType", event.target.value)} placeholder="Only if known" /></label><label className="span-two">Allergies or sensitivities<textarea rows={3} value={form.allergies} onChange={(event) => update("allergies", event.target.value)} placeholder="Include only information you know; verify with your care team." /></label><label className="span-two">Health conditions or context<textarea rows={3} value={form.conditions} onChange={(event) => update("conditions", event.target.value)} placeholder="Optional notes to help prepare for a visit." /></label><label className="span-two">Doctor or clinic name<input value={form.clinician} onChange={(event) => update("clinician", event.target.value)} placeholder="Optional" /></label><button className="cp-button primary" type="submit">Save my profile</button>{saved && <span className="cp-save-confirm"><CheckCircle2 size={15} /> Saved on this device</span>}</form></Panel>
      <div className="cp-visit-aside"><Panel title="Trusted contact" eyebrow="FOR YOUR EMERGENCY CARD"><form className="cp-profile-form contact" onSubmit={save}><label>Contact name<input value={form.emergencyName} onChange={(event) => update("emergencyName", event.target.value)} placeholder="Name" /></label><label>Relationship<input value={form.emergencyRelation} onChange={(event) => update("emergencyRelation", event.target.value)} placeholder="For example, partner" /></label><label className="span-two">Phone<input type="tel" value={form.emergencyPhone} onChange={(event) => update("emergencyPhone", event.target.value)} placeholder="Include country code if useful" /></label><button className="cp-button primary" type="submit">Save contact</button></form><Notice>Only add details you are comfortable storing in this browser.</Notice></Panel><Panel title="What gets shared?"><p className="cp-muted-copy">CAREPATH keeps these details on this device. It does not send alerts or share your health information with a contact automatically.</p></Panel></div></div>
  </>;
}

function SafetyAlerts({ medicines, profile, medEvents, onNavigate }: Shared) {
  const alerts = [
    ...(!profile.allergies.trim() ? [{ title: "Allergy information is not recorded", detail: "No allergy information is saved. Confirm what belongs in your profile with a care professional.", icon: <Heart size={17} /> }] : []),
    ...medicines.filter((medicine) => !medicine.schedule || !medicine.instructions).map((medicine) => ({ title: `Review saved details for ${medicine.name}`, detail: "A schedule or personal instruction note is missing from this entry.", icon: <Pill size={17} /> })),
    ...(medEvents.length ? [{ title: "Dose notes are personal reminders", detail: `${medEvents.length} event${medEvents.length === 1 ? "" : "s"} recorded. Follow your current prescription instructions; this app does not issue reminders.`, icon: <AlarmClock size={17} /> }] : []),
  ];
  return <>
    <PageHeader eyebrow="INFORMATION TO REVIEW" title="Safety Alerts" description="This space flags missing information in your own record; it does not predict risk or detect medical emergencies." icon={<CircleAlert size={24} />} />
    <Notice tone="warm">CAREPATH does not monitor you, send alerts to others, or check clinical interactions. For an emergency, contact local emergency services.</Notice>
    <Panel title={alerts.length ? "Items to review" : "Your record is up to date"} eyebrow={`${alerts.length} PERSONAL RECORD ${alerts.length === 1 ? "NOTE" : "NOTES"}`}>
      {alerts.length ? <div className="cp-alert-list">{alerts.map((item) => <div className="cp-alert-item" key={item.title}><span>{item.icon}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div><span className="cp-status-tag warm">Review</span></div>)}</div> : <EmptyState icon={<CheckCircle2 />} title="No missing notes in this view" text="This only reflects whether profile fields and personal schedule notes are present. It is not a clinical safety assessment." />}
      <div className="cp-inline-actions"><button className="cp-button quiet" onClick={() => onNavigate("Care Circle")}>Review profile</button><button className="cp-button quiet" onClick={() => onNavigate("Safety Check")}>Open Safety Check</button></div>
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
  const topics = [
    { title: "Keep a medicine list you can trust", text: "Record names and strengths from the package or current prescription. Add over-the-counter products and supplements, and update the list after a care visit." },
    { title: "Capture health readings with context", text: "Note the date, time, device or method when relevant, and what was happening. Bring the original device instructions and your questions to a clinician." },
    { title: "Prepare a useful visit brief", text: "Bring your current medicine containers or list, allergies you know about, recent records, and the questions you want answered." },
    { title: "Know when to seek urgent help", text: "Do not rely on an app for an emergency. Contact your local emergency number or seek immediate in-person help for severe or rapidly worsening symptoms." },
  ];
  return <>
    <PageHeader eyebrow="SMALL STEPS, CLEARER CONVERSATIONS" title="Learn & Guides" description="Practical ways to keep your personal health information organized and ready to share." icon={<BookOpen size={24} />} />
    <div className="cp-guide-grid">{topics.map((topic, index) => <details className="cp-guide" key={topic.title} open={index === 0}><summary><span className="cp-guide-number">0{index + 1}</span><strong>{topic.title}</strong><ChevronDown size={17} /></summary><p>{topic.text}</p></details>)}</div>
    <div className="cp-learning-actions"><button className="cp-button quiet" onClick={() => onNavigate("Medicine Passport")}><Pill size={16} /> Review my medicine passport</button><button className="cp-button quiet" onClick={() => onNavigate("Visit Prep")}><Stethoscope size={16} /> Prepare for a visit</button></div>
    <Notice>These guides are general organiz size={16} /> Review my medicine passport</button><button className="cp-button quiet" onClick={() => onNavigate("Visit Prep")}><Stethoscope size={16} /> Prepare for a visit</button></div>
    <Notice>These guides are general organizational tips, not personalized medical advice.</Notice>
  </>;
}

function SettingsPage({ profile, bump, medicines, readings, documents, onNavigate }: Shared) {
  const [notice, setNotice] = useState("");
  const exportData = () => {
    const payload = { exportedAt: new Date().toISOString(), profile, medicines, readings, documents, medicationLog: readStored<MedicationEvent[]>("carepath_medication_log", []) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `carepath-record-${todayISO()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Your record export was prepared by this browser.");
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
    <div className="cp-settings-grid"><Panel title="Your data on this device" eyebrow="LOCAL-FIRST"><div className="cp-privacy-summary"><span className="cp-privacy-icon"><ShieldCheck size={22} /></span><div><strong>CAREPATH stores your notes in this browser</strong><p>Medicines, readings, visit preparation, and profile details use this device’s local storage. They are not synced to a server by this demo.</p></div></div><div className="cp-data-counts"><span><strong>{medicines.length}</strong> medicines</span><span><strong>{readings.length}</strong> readings</span><span><strong>{documents.length}</strong> document references</span></div><div className="cp-settings-actions"><button className="cp-button primary" onClick={exportData}><ArrowDownToLine size={16} /> Export my record</button><button className="cp-button quiet" onClick={restoreDemo}><Sparkles size={15} /> Set up CAREPATH ID</button></div>{notice && <Notice tone="good">{notice}</Notice>}</Panel><Panel title="Profile & emergency details" eyebrow="OPTIONAL"><p className="cp-muted-copy">{profile.allergies || profile.emergencyName ? "Your profile includes saved personal details." : "You have not added personal allergy or trusted contact notes yet."}</p><button className="cp-button quiet" onClick={() => onNavigate("Care Circle")}>Open Care Circle profile</button></Panel></div>
    <Notice tone="warm">Deleting browser data or using another browser may remove or separate this record. Keep your clinical records in the original source system too.</Notice>
  </>;
}

function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) { return <div className="cp-empty"><span>{icon}</span><h3>{title}</h3><p>{text}</p>{action}</div>; }
