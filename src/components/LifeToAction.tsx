import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Activity, ArrowDownToLine, ArrowRight, AudioLines, BookOpenCheck, CalendarDays, Camera,
  Check, CheckCircle2, CircleAlert, ClipboardList, FileText, FolderHeart, Link2, Mic,
  Plus, ScanLine, Search, ShieldCheck, Sparkles, Trash2, Upload, Volume2, X,
} from "lucide-react";
import { classifyInput, extractFacts, inspectRecords, buildConfirmedSummary } from "../lifeEngine.mjs";
import type { LifeFact } from "../lifeEngine.mjs";
import { readDocumentText } from "../documentReader";
import { deleteDocumentFile, getDocumentFile, saveDocumentFile } from "../documentFiles";
import { getVoiceLanguage, speakText } from "../voice";

type CaptureKind = "note" | "question" | "measurement" | "appointment" | "document";
type InboxItem = {
  id: string;
  title: string;
  kind: string;
  requestedKind: CaptureKind;
  text: string;
  createdAt: string;
  date?: string;
  sourceLabel: string;
  sourceName?: string;
  sourceId?: string;
  status: "review" | "confirmed" | "dismissed";
  journeyId?: string;
  sample?: boolean;
};
type JourneyTask = { id: string; text: string; done: boolean };
type Journey = { id: string; title: string; outcome: string; tasks: JourneyTask[]; createdAt: string; sample?: boolean };
type SpeechRecognitionResult = Event & { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRecognitionLike = { lang: string; interimResults: boolean; onresult: ((event: SpeechRecognitionResult) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };
type SpeechWindow = Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };

const RECORDS_KEY = "carepath_life_records_v1";
const JOURNEYS_KEY = "carepath_life_journeys_v1";
const RESOLVED_KEY = "carepath_life_reviewed_conflicts_v1";
const SAMPLE_JOURNEY_ID = "sample-follow-up-journey";
const DEMO_ITEMS: Array<{ id: string; title: string; kind: CaptureKind; source: string; text: string }> = [
  { id: "sample-lab-a", title: "Training lab note · copy A", kind: "document", source: "Synthetic sample text · not a real report", text: "SYNTHETIC TRAINING SAMPLE — fasting glucose: 126 mg/dL. Sample collection date: 2026-10-01. This is invented demonstration data, not clinical evidence." },
  { id: "sample-lab-b", title: "Training lab note · copy B", kind: "document", source: "Synthetic sample text · not a real report", text: "SYNTHETIC TRAINING SAMPLE — fasting glucose: 132 mg/dL. Sample collection date: 2026-10-01. This is invented demonstration data, not clinical evidence." },
  { id: "sample-visit", title: "Training visit note", kind: "appointment", source: "Synthetic sample note · not a real visit", text: "SYNTHETIC TRAINING SAMPLE — appointment follow-up with the clinic on 14 Oct 2026. Questions: Which result belongs in my record? What information should I bring? This is invented demonstration data." },
  { id: "sample-lab-copy", title: "Training lab note · duplicate copy", kind: "document", source: "Synthetic duplicate · not a real report", text: "SYNTHETIC TRAINING SAMPLE — fasting glucose: 126 mg/dL. Sample collection date: 2026-10-01. This is invented demonstration data, not clinical evidence." },
];

function readLocal<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function storeLocal<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); localStorage.setItem("carepath_last_local_save", new Date().toISOString()); return true; } catch { return false; }
}
function shortDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url);
}

export default function LifeToAction({ onNavigate, onAskQuestion }: { onNavigate: (section: string) => void; onAskQuestion: (question: string) => void }) {
  const [items, setItems] = useState<InboxItem[]>(() => readLocal(RECORDS_KEY, []));
  const [journeys, setJourneys] = useState<Journey[]>(() => readLocal(JOURNEYS_KEY, []));
  const [reviewedConflicts, setReviewedConflicts] = useState<string[]>(() => readLocal(RESOLVED_KEY, []));
  const [tab, setTab] = useState<"capture" | "journeys" | "story" | "resolve">("capture");
  const [journeyId, setJourneyId] = useState(() => readLocal<Journey[]>(JOURNEYS_KEY, [])[0]?.id || "");
  const [kind, setKind] = useState<CaptureKind>("note");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState("");
  const [readStatus, setReadStatus] = useState("");
  const [reading, setReading] = useState(false);
  const [notice, setNotice] = useState("");
  const [journeyTitle, setJourneyTitle] = useState("");
  const [journeyOutcome, setJourneyOutcome] = useState("");
  const [taskDraft, setTaskDraft] = useState("");
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);
  const [activeJourneyId, setActiveJourneyId] = useState("");

  const activeJourney = journeys.find((journey) => journey.id === activeJourneyId) || journeys[0];
  const selectedJourneyId = journeyId;
  const analyzedItems = useMemo(() => items.filter((item) => item.status !== "dismissed").map((item) => ({ id: item.id, text: item.text })), [items]);
  const analysis = useMemo(() => inspectRecords(analyzedItems), [analyzedItems]);
  const visibleItems = items.filter((item) => item.status !== "dismissed" && (!query.trim() || `${item.title} ${item.text} ${item.kind}`.toLowerCase().includes(query.trim().toLowerCase())));
  const currentItems = selectedJourneyId ? items.filter((item) => item.journeyId === selectedJourneyId && item.status !== "dismissed") : items.filter((item) => item.status !== "dismissed");
  const confirmedItems = currentItems.filter((item) => item.status === "confirmed");
  const reviewItems = currentItems.filter((item) => item.status === "review");
  const currentConflicts = analysis.conflicts.filter((conflict) => conflict.ids.every((id) => currentItems.some((item) => item.id === id)));
  const unresolvedConflicts = currentConflicts.filter((conflict) => !reviewedConflicts.includes(conflict.ids.slice().sort().join("::")));
  const suggestedLinks = analysis.suggestions.filter((suggestion) => {
    const [left, right] = suggestion.ids.map((id) => items.find((item) => item.id === id));
    return Boolean(left && right && left.status !== "dismissed" && right.status !== "dismissed" && (!left.journeyId || !right.journeyId) && left.journeyId !== right.journeyId);
  });
  const missingCount = currentItems.filter((item) => !extractFacts(item.text).some((fact) => fact.kind === "date")).length;
  const journeyProgress = activeJourney ? activeJourney.tasks.filter((task) => task.done).length : 0;
  const sampleActive = items.some((item) => item.sample && item.status !== "dismissed");

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 4800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const persistItems = (next: InboxItem[]) => { setItems(next); storeLocal(RECORDS_KEY, next); };
  const persistJourneys = (next: Journey[]) => { setJourneys(next); storeLocal(JOURNEYS_KEY, next); };
  const markConfirmed = (itemId: string) => {
    const next = items.map((item) => item.id === itemId ? { ...item, status: "confirmed" as const } : item);
    persistItems(next); setNotice("Confirmed in your personal story. The original source remains linked.");
  };
  const saveItemEdit = async (itemId: string, nextTitle: string, nextText: string): Promise<boolean> => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item || !nextText.trim()) { setNotice("Keep at least one line of text so the item remains understandable."); return false; }
    if (item.sourceId) {
      try {
        const stored = await getDocumentFile(item.sourceId);
        if (stored) await saveDocumentFile({ ...stored, extractedText: nextText, reviewNote: `${stored.reviewNote}\nText corrected by the user.` });
      } catch { setNotice("Your correction will be kept with the item. The original file stays unchanged; its separate extraction copy could not be updated."); }
    }
    const sourceFacts = extractFacts(nextText);
    const next = items.map((entry) => entry.id === itemId ? { ...entry, title: nextTitle.trim() || "Personal record", text: nextText.trim(), kind: classifyInput(nextText, entry.requestedKind), date: sourceFacts.find((fact) => fact.kind === "date")?.value, status: "review" as const } : entry);
    if (!storeLocal(RECORDS_KEY, next)) { setNotice("This browser could not save the correction. Check available device storage."); return false; }
    setItems(next); setNotice("Correction saved. The source is retained and the extracted details were recalculated. Confirm again to add the edited item to your story."); return true;
  };
  const setFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]; event.target.value = "";
    if (!selected) return;
    if (!(selected.type.startsWith("image/") || selected.type === "application/pdf" || selected.name.toLowerCase().endsWith(".pdf"))) { setNotice("Choose an image or PDF. Other file types are not supported here."); return; }
    if (selected.size > 15 * 1024 * 1024) { setNotice("Choose a file smaller than 15 MB to keep this device responsive."); return; }
    setFile(selected); setKind("document"); setTitle(selected.name); setFileText(""); setText(""); setReadStatus("File selected. Choose Read text on this device to review extracted words."); setNotice("");
  };
  const readFile = async () => {
    if (!file || reading) return;
    setReading(true); setReadStatus("Preparing local reader…");
    try {
      const result = await readDocumentText(file, getVoiceLanguage(), (message) => setReadStatus(message));
      setFileText(result.text); setText(result.text); setReadStatus(result.text ? `Text extracted on this device from ${result.pagesRead}${result.pagesRead === 1 ? " page" : " pages"}. Review every field against the original before saving.` : "No text was found. You can type a note about the file and still save its original.");
    } catch (error) { setReadStatus(error instanceof Error ? error.message : "Could not read the file on this device."); }
    finally { setReading(false); }
  };
  const startVoiceCapture = () => {
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) { setNotice("Voice capture is unavailable in this browser. Type a note or use the existing voice controls above."); return; }
    const recognition = new Recognition(); recognition.lang = getVoiceLanguage() === "kn" ? "kn-IN" : "en-IN"; recognition.interimResults = false;
    recognition.onresult = (event) => { const transcript = event.results[0]?.[0]?.transcript?.trim(); if (transcript) setText((current) => current ? `${current}\n${transcript}` : transcript); };
    recognition.onerror = () => { setListening(false); setNotice("Voice recognition stopped. You can type instead."); };
    recognition.onend = () => setListening(false);
    try { setListening(true); recognition.start(); } catch { setListening(false); setNotice("Voice recognition could not start. Type your note instead."); }
  };
  const saveCapture = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = (kind === "document" ? text || fileText : text).trim();
    if (!content && !file) { setNotice("Add a note, question, measurement, appointment, or supported file first."); return; }
    const now = new Date().toISOString();
    const id = `life-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let sourceId: string | undefined;
    if (file) {
      sourceId = id;
      try {
        await saveDocumentFile({ id, name: file.name, mimeType: file.type || "application/pdf", size: file.size, createdAt: now, file, extractedText: content, reviewNote: "Captured in My Journeys; extraction requires user review." });
      } catch (error) { setNotice(error instanceof Error ? error.message : "The original file could not be saved locally. No item was added."); return; }
    }
    const item: InboxItem = {
      id, title: title.trim() || (kind === "question" ? "Question" : kind === "appointment" ? "Appointment note" : kind === "measurement" ? "Measurement note" : file?.name || "Personal note"),
      kind: classifyInput(content, kind), requestedKind: kind, text: content || `Original file saved: ${file?.name || "file"}. No readable text was extracted.`,
      createdAt: now, date: extractFacts(content).find((fact) => fact.kind === "date")?.value, sourceLabel: file ? "File + user-reviewed extraction · saved on this device" : "Entered by you · saved on this device", sourceName: file?.name,
      sourceId, status: "review", journeyId: selectedJourneyId || undefined,
    };
    const next = [item, ...items];
    if (!storeLocal(RECORDS_KEY, next)) { if (sourceId) await deleteDocumentFile(sourceId).catch(() => undefined); setNotice("This browser could not save the item. Check available device storage."); return; }
    setItems(next); setTitle(""); setText(""); setFileText(""); setFile(null); setReadStatus(""); setKind("note"); setNotice("Added to your review inbox. Nothing is confirmed until you check it."); setTab("capture");
  };
  const createJourney = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!journeyTitle.trim()) return;
    const journey: Journey = { id: `journey-${Date.now()}`, title: journeyTitle.trim(), outcome: journeyOutcome.trim(), tasks: [], createdAt: new Date().toISOString() };
    const next = [journey, ...journeys]; persistJourneys(next); setActiveJourneyId(journey.id); setJourneyId(journey.id); setJourneyTitle(""); setJourneyOutcome(""); setNotice("Journey created. Add only the tasks that you choose.");
  };
  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const targetId = activeJourney?.id; if (!taskDraft.trim() || !targetId) return;
    const next = journeys.map((journey) => journey.id === targetId ? { ...journey, tasks: [...journey.tasks, { id: `task-${Date.now()}`, text: taskDraft.trim(), done: false }] } : journey);
    persistJourneys(next); setTaskDraft(""); setNotice("Your task was added. CARE CONNECTED does not create medical requirements or deadlines.");
  };
  const toggleTask = (journeyIdToUpdate: string, taskId: string) => persistJourneys(journeys.map((journey) => journey.id === journeyIdToUpdate ? { ...journey, tasks: journey.tasks.map((task) => task.id === taskId ? { ...task, done: !task.done } : task) } : journey));
  const startDemo = () => {
    const journey: Journey = { id: SAMPLE_JOURNEY_ID, title: "Sample follow-up journey", outcome: "Practice reviewing a source-linked sample story.", tasks: [{ id: "sample-task-1", text: "Review the synthetic values against their original sample notes", done: false }, { id: "sample-task-2", text: "Prepare a handover from confirmed sample items", done: false }], createdAt: new Date().toISOString(), sample: true };
    const demo: InboxItem[] = DEMO_ITEMS.map((entry, index) => ({ id: entry.id, title: entry.title, kind: classifyInput(entry.text, entry.kind), requestedKind: entry.kind, text: entry.text, createdAt: new Date(Date.now() - index * 60_000).toISOString(), date: extractFacts(entry.text).find((fact) => fact.kind === "date")?.value, sourceLabel: entry.source, status: "review", journeyId: SAMPLE_JOURNEY_ID, sample: true }));
    const nextJourneys = [journey, ...journeys.filter((item) => item.id !== SAMPLE_JOURNEY_ID)];
    const nextItems = [...demo, ...items.filter((item) => !item.sample)];
    persistJourneys(nextJourneys); persistItems(nextItems); setActiveJourneyId(SAMPLE_JOURNEY_ID); setJourneyId(SAMPLE_JOURNEY_ID); setReviewedConflicts([]); storeLocal(RESOLVED_KEY, []); setTab("resolve"); setNotice("Synthetic workflow loaded. Review, confirm, inspect the seeded conflict, then create a sample handover.");
  };
  const removeDemo = () => {
    const nextItems = items.filter((item) => !item.sample); const nextJourneys = journeys.filter((journey) => !journey.sample);
    persistItems(nextItems); persistJourneys(nextJourneys); setReviewedConflicts([]); storeLocal(RESOLVED_KEY, []); setActiveJourneyId(""); setJourneyId(""); setTab("capture"); setNotice("Synthetic demonstration removed. Your personal items were kept.");
  };
  const reviewConflict = (ids: string[]) => {
    const key = ids.slice().sort().join("::"); const next = [...reviewedConflicts, key]; setReviewedConflicts(next); storeLocal(RESOLVED_KEY, next); setNotice("Marked reviewed. Both source values remain visible; no value was replaced or medically verified.");
  };
  const connectSuggestedItems = (ids: string[]) => {
    if (!selectedJourneyId) { setTab("journeys"); setNotice("Choose or create a journey first. The suggested link has not been applied."); return; }
    const target = journeys.find((journey) => journey.id === selectedJourneyId);
    if (!target || ids.some((id) => { const item = items.find((entry) => entry.id === id); return item?.journeyId && item.journeyId !== selectedJourneyId; })) { setNotice("Choose the journey that should group these items. Existing journey links were left unchanged."); setTab("journeys"); return; }
    persistItems(items.map((item) => ids.includes(item.id) ? { ...item, journeyId: selectedJourneyId } : item));
    setNotice(`Connected the suggested items to “${target.title}”. Their original text and sources remain unchanged.`);
  };
  const openOriginal = async (item: InboxItem) => {
    if (!item.sourceId) return;
    try { const saved = await getDocumentFile(item.sourceId); if (!saved) { setNotice("The file is no longer available in this browser. Its extracted text is still shown for review."); return; } const url = URL.createObjectURL(saved.file); window.open(url, "_blank", "noopener,noreferrer"); window.setTimeout(() => URL.revokeObjectURL(url), 60_000); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not open the saved original."); }
  };
  const handover = `${selectedJourneyId ? activeJourney?.title || "Selected journey" : "My CARE CONNECTED story"}\nIntended outcome: ${selectedJourneyId ? activeJourney?.outcome || "Not specified" : "Summary of all confirmed items currently shown"}\n\nConfirmed items\n${buildConfirmedSummary(currentItems)}\n\nUser-defined tasks\n${selectedJourneyId && activeJourney?.tasks.length ? activeJourney.tasks.map((task) => `${task.done ? "[x]" : "[ ]"} ${task.text}`).join("\n") : selectedJourneyId ? "No tasks added." : journeys.flatMap((journey) => journey.tasks.map((task) => `${task.done ? "[x]" : "[ ]"} ${task.text} · ${journey.title}`)).join("\n") || "No tasks added."}\n\nUnresolved items\n${reviewItems.length} item(s) still need review. ${unresolvedConflicts.length} potential conflict(s) not marked reviewed.\n\nSource and privacy note: Prepared locally from the records currently shown. Confirmed means reviewed by the user; it does not mean clinically verified.`;
  const speak = (value: string) => { try { speakText(value, { language: getVoiceLanguage() }); } catch { setNotice("Read aloud is unavailable in this browser."); } };

  return <div className="cp-module cp-life-page">
    <header className="cp-page-header"><div className="cp-page-title-icon"><FolderHeart size={25} /></div><div className="cp-page-copy"><span className="cp-eyebrow">CARE CONNECTED · LIFE-TO-ACTION</span><h1>My Journeys</h1><p>Bring scattered notes and records together. Review the evidence, decide what belongs in your story, and prepare a clear next step.</p></div><div className="cp-page-action"><button className="cp-button quiet" onClick={() => setTab("capture")}><Plus size={16} /> Capture anything</button></div></header>
    <section className="cp-life-hero"><div className="cp-life-hero-copy"><span className="cp-life-kicker"><Sparkles size={14} /> YOUR INFORMATION, CONNECTED</span><h2>From “I have all these things” to “I know what to do next.”</h2><p>Keep the original source attached. CARE CONNECTED organizes what you bring in; you confirm every fact before it enters your personal story.</p><div className="cp-life-hero-actions"><button className="cp-button cp-life-primary" onClick={() => setTab("capture")}><Plus size={16} /> Capture a note or file</button><button className="cp-button cp-life-secondary" onClick={() => setTab("journeys")}><FolderHeart size={16} /> Open my journeys</button></div></div><div className="cp-life-orbit" aria-hidden="true"><span className="cp-life-orbit-center"><Link2 size={28} /></span><i className="node-a"><FileText size={15} /></i><i className="node-b"><Activity size={15} /></i><i className="node-c"><CalendarDays size={15} /></i></div><div className="cp-life-privacy"><ShieldCheck size={15} /> Saved on this device · not sent to AI</div></section>
    <div className="cp-life-stats"><div><span>INBOX TO REVIEW</span><strong>{reviewItems.length}</strong><small>Items waiting for your check</small></div><div><span>CONFIRMED STORY</span><strong>{confirmedItems.length}</strong><small>Source-linked records</small></div><div><span>NEEDS ATTENTION</span><strong>{unresolvedConflicts.length + missingCount}</strong><small>{unresolvedConflicts.length} potential conflicts · {missingCount} without a date</small></div><div><span>JOURNEY TASKS</span><strong>{activeJourney?.tasks.length ? `${journeyProgress}/${activeJourney.tasks.length}` : "—"}</strong><small>User-defined · no medical deadlines</small></div></div>
    <nav className="cp-life-tabs" aria-label="My Journeys workspace">{([ ["capture", "Capture & inbox", <Upload key="capture-icon" size={16} />], ["journeys", "My journeys", <FolderHeart key="journeys-icon" size={16} />], ["story", "My story", <Activity key="story-icon" size={16} />], ["resolve", "Resolve & review", <CircleAlert key="resolve-icon" size={16} />] ] as const).map(([value, label, icon]) => <button key={value} className={tab === value ? "selected" : ""} aria-current={tab === value ? "page" : undefined} onClick={() => setTab(value)}>{icon}<span>{label}</span>{value === "capture" && reviewItems.length > 0 && <b>{reviewItems.length}</b>}{value === "resolve" && unresolvedConflicts.length > 0 && <b>{unresolvedConflicts.length}</b>}</button>)}</nav>

    {tab === "capture" && <section className="cp-life-layout"><div className="cp-life-main"><article className="cp-panel cp-life-capture"><div className="cp-panel-heading"><div><span className="cp-eyebrow">ONE PLACE FOR THE DETAILS</span><h2>Capture anything</h2></div><span className="cp-life-feature-icon"><ScanLine size={19} /></span></div><p className="cp-life-intro">Add a question, voice note, measurement, appointment, or a photo/PDF. Supported files are read in your browser only.</p>
      <form onSubmit={saveCapture} className="cp-life-form"><div className="cp-life-input-grid"><label>What are you adding?<select value={kind} onChange={(event) => setKind(event.target.value as CaptureKind)}><option value="note">A personal note</option><option value="question">A question</option><option value="measurement">A measurement</option><option value="appointment">An appointment or visit</option><option value="document">A photo or PDF</option></select></label><label>Connect to a journey<select value={selectedJourneyId} onChange={(event) => setJourneyId(event.target.value)}><option value="">Keep in my inbox for now</option>{journeys.filter((journey) => !journey.sample).map((journey) => <option key={journey.id} value={journey.id}>{journey.title}</option>)}</select></label></div>
        <label>Short title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={90} placeholder={kind === "question" ? "What would you like to understand?" : kind === "appointment" ? "For example: clinic visit on…" : "A short name to find this later"} /></label>
        <div className="cp-life-capture-tools"><label className="cp-button quiet cp-life-file-button"><Camera size={16} /> Take photo<input type="file" accept="image/*" capture="environment" onChange={setFileSelection} /></label><label className="cp-button quiet cp-life-file-button"><Upload size={16} /> Choose image or PDF<input type="file" accept="image/*,.pdf,application/pdf" onChange={setFileSelection} /></label><button className="cp-button quiet" type="button" onClick={startVoiceCapture} disabled={listening}><Mic size={16} />{listening ? "Listening…" : "Speak a note"}</button><span>Voice availability depends on your browser.</span></div>
        {file && <div className="cp-life-selected-file"><FileText size={16} /><span><strong>{file.name}</strong><small>{Math.max(1, Math.ceil(file.size / 1024))} KB · local file</small></span><button type="button" aria-label="Remove selected file" onClick={() => { setFile(null); setFileText(""); setText(""); setTitle(""); setReadStatus(""); }}><X size={16} /></button><button type="button" className="cp-button primary" onClick={() => void readFile()} disabled={reading}><ScanLine size={15} />{reading ? "Reading…" : "Read text on this device"}</button></div>}
        {readStatus && <p className="cp-life-status" role="status">{readStatus}</p>}
        <label>Your words or reviewed text<textarea value={text} onChange={(event) => setText(event.target.value)} rows={5} maxLength={6000} placeholder="Say it in your own words. For example: ‘I want to ask about the date on this report.’" /></label>
        {text.trim() && <div className="cp-life-fact-preview"><strong><BookOpenCheck size={15} /> Details the organizer can recognize</strong>{extractFacts(text).length ? <ul>{extractFacts(text).map((fact, index) => <li key={`${fact.label}-${index}`}><span>{fact.label}</span><b>{fact.value}</b><small>Review needed · from your words</small></li>)}</ul> : <p>No dates, measurement values, or medicine names were recognized. The full text remains available for your review; nothing is inferred.</p>}</div>}
        <div className="cp-life-form-footer"><span><ShieldCheck size={15} /> Nothing is confirmed or shared automatically.</span><button className="cp-button cp-life-primary" type="submit"><Plus size={16} /> Add to review inbox</button></div>
      </form>
      <div className="cp-life-read-note"><Volume2 size={16} /><div><strong>Need the screen read aloud?</strong><span>Use the app’s “Read this to me” control above, or tap Listen on any item.</span></div><button className="cp-button quiet" onClick={() => speak("Capture anything. Add a personal note, question, measurement, appointment, photo, or PDF. Review every item before adding it to your story.")}><AudioLines size={15} /> Listen</button></div>
    </article><article className="cp-panel cp-life-inbox"><div className="cp-panel-heading"><div><span className="cp-eyebrow">UNIFIED INBOX · ON THIS DEVICE</span><h2>Arrived and ready to review</h2></div><label className="cp-life-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search inbox" aria-label="Search inbox" /></label></div>
      {visibleItems.length ? <div className="cp-life-inbox-list">{visibleItems.map((item) => <InboxCard key={item.id} item={item} facts={analysis.factsById[item.id] || []} conflicts={currentConflicts.filter((conflict) => conflict.ids.includes(item.id)).length} journeys={journeys} onConnect={(targetId) => persistItems(items.map((entry) => entry.id === item.id ? { ...entry, journeyId: targetId || undefined } : entry))} onSaveEdit={(nextTitle, nextText) => saveItemEdit(item.id, nextTitle, nextText)} onConfirm={() => markConfirmed(item.id)} onDismiss={() => persistItems(items.map((entry) => entry.id === item.id ? { ...entry, status: "dismissed" } : entry))} onOpen={() => void openOriginal(item)} onListen={() => speak(`${item.title}. ${item.text}`)} onStory={() => { setJourneyId(item.journeyId || ""); setActiveJourneyId(item.journeyId || ""); setTab("story"); }} />)}</div> : <div className="cp-life-empty"><span><Upload size={22} /></span><strong>Your inbox is ready</strong><p>Add a note or document, or run the synthetic walkthrough to see how review and source links work.</p><button className="cp-button quiet" onClick={startDemo}><Sparkles size={15} /> Try the synthetic walkthrough</button></div>}
    </article></div>
      <aside className="cp-life-side"><article className="cp-panel cp-life-side-card"><span className="cp-eyebrow">START WITH A WORKING EXAMPLE</span><h2>See messy details become a useful story.</h2><p>The walkthrough uses invented records. It runs the same date/value extractor, duplicate check, conflict check, confirmation flow, and handover builder used by your own entries.</p><button className="cp-button cp-life-primary cp-full-button" onClick={startDemo}><Sparkles size={16} /> {sampleActive ? "Restart synthetic walkthrough" : "Start synthetic walkthrough"}</button>{sampleActive && <button className="cp-text-link" onClick={removeDemo}><Trash2 size={14} /> Remove synthetic data</button>}<small className="cp-life-sample-label">Clearly marked as sample · never presented as your health record</small></article>
      <article className="cp-panel cp-life-trust"><div className="cp-life-trust-icon"><ShieldCheck size={19} /></div><h3>What this workspace can verify</h3><ul><li><Check size={14} /> What you typed or selected</li><li><Check size={14} /> Which local file supports an item</li><li><Check size={14} /> Literal dates and values found in text</li></ul><p>It cannot verify a medical fact, decide which conflicting result is correct, or create treatment guidance. Text extraction can make mistakes.</p><button className="cp-text-link" onClick={() => onNavigate("ASK CARE CONNECTED")}>Ask a general question <ArrowRight size={14} /></button></article>
      <article className="cp-panel cp-life-next"><span className="cp-eyebrow">YOUR NEXT STEP</span><h3>{reviewItems.length ? "Review one item" : activeJourney ? "Continue your journey" : "Create a journey when useful"}</h3><p>{reviewItems.length ? "Check the source, correct any errors, then confirm what you want to keep." : activeJourney ? "Add one task you choose, or prepare a handover from confirmed items." : "A journey groups information around an outcome you choose."}</p><button className="cp-button quiet" onClick={() => setTab(reviewItems.length ? "capture" : "journeys")}>{reviewItems.length ? "Go to review inbox" : "Open journeys"}<ArrowRight size={14} /></button></article></aside></section>}

    {tab === "journeys" && <section className="cp-life-layout"><div className="cp-life-main"><article className="cp-panel"><div className="cp-panel-heading"><div><span className="cp-eyebrow">USER-DEFINED · YOUR OUTCOME</span><h2>Create a journey</h2></div><span className="cp-life-feature-icon"><FolderHeart size={19} /></span></div><p className="cp-life-intro">Name what you want to organize. Add tasks in your own words; CARE CONNECTED will not add clinical requirements or deadlines.</p><form className="cp-life-form" onSubmit={createJourney}><label>Journey name<input value={journeyTitle} onChange={(event) => setJourneyTitle(event.target.value)} placeholder="For example: prepare for my next visit" maxLength={90} required /></label><label>What would a useful outcome look like?<textarea value={journeyOutcome} onChange={(event) => setJourneyOutcome(event.target.value)} placeholder="For example: bring my questions and the records I want to discuss" rows={3} maxLength={500} /></label><button className="cp-button cp-life-primary" type="submit"><Plus size={16} /> Create my journey</button></form></article>
      {activeJourney && <article className="cp-panel cp-life-active-journey"><JourneyDetail journey={activeJourney} items={items.filter((item) => item.journeyId === activeJourney.id && item.status !== "dismissed")} onToggleTask={toggleTask} onAddTask={addTask} taskDraft={taskDraft} setTaskDraft={setTaskDraft} /></article>}
      <article className="cp-panel"><div className="cp-panel-heading"><div><span className="cp-eyebrow">GROUPS YOU CREATED</span><h2>Your journeys</h2></div><span className="cp-life-count">{journeys.length}</span></div>{journeys.length ? <div className="cp-life-journey-list">{journeys.map((journey) => <button key={journey.id} className={`cp-life-journey-choice ${activeJourney?.id === journey.id ? "selected" : ""}`} onClick={() => { setActiveJourneyId(journey.id); setJourneyId(journey.id); }}><span><FolderHeart size={17} /></span><span><strong>{journey.title}{journey.sample && <em> · SYNTHETIC</em>}</strong><small>{journey.outcome || "No intended outcome added"}</small><small>{items.filter((item) => item.journeyId === journey.id && item.status === "confirmed").length} confirmed · {items.filter((item) => item.journeyId === journey.id && item.status === "review").length} to review</small></span><ArrowRight size={16} /></button>)}</div> : <div className="cp-life-empty"><span><FolderHeart size={22} /></span><strong>No journeys yet</strong><p>Create one around something you want to prepare, organize, or understand.</p><button className="cp-button quiet" onClick={startDemo}><Sparkles size={15} /> Try sample journey</button></div>}</article></div><aside className="cp-life-side"><article className="cp-panel cp-life-side-card"><span className="cp-eyebrow">JOURNEY COMPLETION</span><h2>Clear progress, yours to define.</h2><p>Each journey can show completed user-created tasks, items that still need confirmation, and possible conflicts that remain visible.</p><div className="cp-life-progress"><span style={{ width: `${activeJourney?.tasks.length ? Math.round(journeyProgress / activeJourney.tasks.length * 100) : 0}%` }} /></div><small>{activeJourney?.tasks.length ? `${journeyProgress} of ${activeJourney.tasks.length} tasks completed` : "No task or deadline is required."}</small></article><article className="cp-panel cp-life-trust"><span className="cp-eyebrow">CONNECTED, WITH YOUR PERMISSION</span><h3>Items do not connect themselves.</h3><p>Choose a journey for each capture, or keep it in your inbox and connect it later. This keeps suggested relationships under your control.</p></article></aside></section>}

    {tab === "story" && <section className="cp-life-story-layout"><div className="cp-life-story-head"><div><span className="cp-eyebrow">CONFIRMED ITEMS · SOURCE-LINKED</span><h2>{selectedJourneyId ? activeJourney?.title || "Selected journey" : "My health story"}</h2><p>{selectedJourneyId ? activeJourney?.outcome || "A chronological view of items you reviewed and chose to keep." : "All confirmed items across your journeys and inbox, kept with their sources."}</p></div><div><label className="cp-life-story-filter"><span>Show</span><select aria-label="Filter story by journey" value={selectedJourneyId} onChange={(event) => { const nextId = event.target.value; setJourneyId(nextId); setActiveJourneyId(nextId); }}><option value="">All confirmed items</option>{journeys.map((journey) => <option key={journey.id} value={journey.id}>{journey.title}</option>)}</select></label><button className="cp-button quiet" onClick={() => speak(buildConfirmedSummary(currentItems))}><Volume2 size={15} /> Listen to summary</button><button className="cp-button cp-life-primary" onClick={() => downloadText("care-connected-handover.txt", handover)} disabled={!confirmedItems.length}><ArrowDownToLine size={15} /> Prepare handover</button></div></div>
      {confirmedItems.length > 0 && <article className="cp-life-ask-records"><div><ShieldCheck size={16} /><span><strong>Want help organizing these details?</strong><small>Prepare a question with this journey’s confirmed text. Review and edit it before the AI send consent step; nothing is sent from this page.</small></span></div><button className="cp-button quiet" onClick={() => onAskQuestion(`Please help me organize and summarize these user-confirmed personal records for a conversation with my healthcare professional. Do not diagnose or recommend treatment. Point out any uncertainty and identify which source each detail came from.\n\n${buildConfirmedSummary(confirmedItems)}`)}><Sparkles size={15} /> Prepare a question</button></article>}
      {!confirmedItems.length ? <div className="cp-life-empty cp-life-story-empty"><span><Activity size={22} /></span><strong>Your story begins with a confirmation</strong><p>Review an inbox item and choose “Confirm for my story.” Unreviewed details never appear here as confirmed facts.</p><button className="cp-button cp-life-primary" onClick={() => setTab("capture")}>Review inbox <ArrowRight size={15} /></button></div> : <div className="cp-life-story-grid"><div className="cp-life-timeline">{confirmedItems.slice().sort((a, b) => (a.date || a.createdAt).localeCompare(b.date || b.createdAt)).map((item) => <article key={item.id} className="cp-life-timeline-item"><span className="cp-life-timeline-dot"><CheckCircle2 size={16} /></span><div className="cp-life-timeline-date">{item.date ? shortDate(item.date) : shortDate(item.createdAt)} · {item.kind}</div><section><div className="cp-life-record-title"><h3>{item.title}</h3>{item.sample && <span>DEMO SAMPLE</span>}</div><p>{item.text}</p><div className="cp-life-evidence"><Link2 size={14} /><span><strong>Source:</strong> {item.sourceName || item.sourceLabel}</span>{item.sourceId && <button onClick={() => void openOriginal(item)}>Open original <ArrowRight size={13} /></button>}</div>{(analysis.factsById[item.id] || []).map((fact, index) => <span className="cp-life-fact-chip" key={`${fact.label}-${index}`}>{fact.label}: {fact.value}</span>)}</section></article>)}</div><aside className="cp-life-handover"><span className="cp-life-feature-icon"><ClipboardList size={18} /></span><span className="cp-eyebrow">GENERATED FROM CONFIRMED ITEMS ONLY</span><h3>Handover preview</h3><pre>{buildConfirmedSummary(confirmedItems)}</pre><p>Source labels are included. “Confirmed” means you reviewed the entry; it is not medical verification.</p><button className="cp-button cp-life-primary cp-full-button" onClick={() => downloadText("care-connected-handover.txt", handover)}><ArrowDownToLine size={15} /> Download text handover</button><button className="cp-button quiet cp-full-button" onClick={() => onNavigate("Visit Prep")}><CalendarDays size={15} /> Open visit prep</button></aside></div>}
    </section>}

    {tab === "resolve" && <section className="cp-life-resolve-layout"><article className="cp-panel"><div className="cp-panel-heading"><div><span className="cp-eyebrow">EVIDENCE BEFORE CONCLUSIONS</span><h2>Potential conflicts</h2></div><span className="cp-life-count">{unresolvedConflicts.length}</span></div><p className="cp-life-intro">These are matching dates with different literal values found in saved text. They are prompts to inspect sources, not medical alerts or a decision about which value is right.</p>{unresolvedConflicts.length ? <div className="cp-life-conflict-list">{unresolvedConflicts.map((conflict, index) => { const first = items.find((item) => item.id === conflict.ids[0]); const second = items.find((item) => item.id === conflict.ids[1]); return <article className="cp-life-conflict" key={`${conflict.ids.join("-")}-${index}`}><div className="cp-life-conflict-head"><span><CircleAlert size={17} /> POTENTIAL VALUE CONFLICT</span><time>{shortDate(conflict.date)}</time></div><h3>{conflict.label}</h3><div className="cp-life-conflict-values">{[first, second].map((record) => record && <div key={record.id}><b>{(analysis.factsById[record.id] || []).find((fact) => fact.label === conflict.label)?.value}</b><span>{record.title}</span><small>{record.sourceLabel}</small><blockquote>{record.text}</blockquote><button className="cp-text-link" onClick={() => void openOriginal(record)} disabled={!record.sourceId}>{record.sourceId ? "Inspect original" : "Text source shown above"}<ArrowRight size={13} /></button></div>)}</div><div className="cp-life-conflict-actions"><p>Keep both values visible. If you have checked the source records, mark this comparison reviewed; the app will not choose a value or delete either source.</p><button className="cp-button quiet" onClick={() => reviewConflict(conflict.ids)}><Check size={15} /> I reviewed both sources</button></div></article>; })}</div> : <div className="cp-life-empty"><span><CheckCircle2 size={22} /></span><strong>{currentConflicts.length ? "All visible comparisons are marked reviewed" : "No potential conflicts found"}</strong><p>{currentConflicts.length ? "Both original values remain in your story. Review status is not clinical verification." : "The organizer checks only literal dates and values it recognizes. It cannot prove that records agree."}</p></div>}</article>
      <article className="cp-panel cp-life-suggestions"><div className="cp-panel-heading"><div><span className="cp-eyebrow">SUGGESTED LINKS · YOU DECIDE</span><h2>Entries that may belong together</h2></div><span className="cp-life-count">{suggestedLinks.length}</span></div><p className="cp-life-intro">The organizer found shared dates in items that are not in the same journey. A matching date is only a clue; inspect the sources before grouping them.</p>{suggestedLinks.length ? <div className="cp-life-suggestion-list">{suggestedLinks.map((suggestion) => { const [left, right] = suggestion.ids.map((id) => items.find((item) => item.id === id)); if (!left || !right) return null; const canConnect = Boolean(selectedJourneyId && [left, right].every((item) => !item.journeyId || item.journeyId === selectedJourneyId)); return <div key={suggestion.ids.join("::")}><span className="cp-life-suggestion-mark"><Link2 size={15} /></span><div><strong>{left.title} <i>↔</i> {right.title}</strong><small>{suggestion.reason}</small><small>{left.sourceLabel} · {right.sourceLabel}</small></div>{canConnect ? <button className="cp-button quiet" onClick={() => connectSuggestedItems(suggestion.ids)}>Connect to {activeJourney?.title || "this journey"}</button> : <button className="cp-button quiet" onClick={() => setTab("journeys")}>Choose a journey <ArrowRight size={13} /></button>}</div>; })}</div> : <p className="cp-life-all-clear"><CheckCircle2 size={16} /> No cross-journey date links suggested. If items are related, you can connect them from their inbox cards.</p>}</article>
      <article className="cp-panel"><div className="cp-panel-heading"><div><span className="cp-eyebrow">CHECK BEFORE CONNECTING</span><h2>Items needing more detail</h2></div><span className="cp-life-count">{missingCount}</span></div><p className="cp-life-intro">No date was recognized in these entries. Add the missing detail in your own words if it matters to your journey.</p>{currentItems.filter((item) => !extractFacts(item.text).some((fact) => fact.kind === "date")).length ? <div className="cp-life-missing-list">{currentItems.filter((item) => !extractFacts(item.text).some((fact) => fact.kind === "date")).map((item) => <div key={item.id}><CircleAlert size={16} /><span><strong>{item.title}</strong><small>{item.status === "review" ? "Needs your review" : "No date found in the entered text"}</small><p>{item.text.slice(0, 170)}</p></span><button onClick={() => { setTab("capture"); }} aria-label="Return to capture and review"><ArrowRight size={15} /></button></div>)}</div> : <p className="cp-life-all-clear"><CheckCircle2 size={16} /> No undated entries in this journey.</p>}</article>
      <article className="cp-panel cp-life-duplicates"><div className="cp-panel-heading"><div><span className="cp-eyebrow">EXACT TEXT CHECK</span><h2>Possible duplicate copies</h2></div><span className="cp-life-count">{analysis.duplicates.filter((entry) => entry.ids.every((id) => currentItems.some((item) => item.id === id))).length}</span></div>{analysis.duplicates.filter((entry) => entry.ids.every((id) => currentItems.some((item) => item.id === id))).length ? analysis.duplicates.filter((entry) => entry.ids.every((id) => currentItems.some((item) => item.id === id))).map((entry) => <p key={entry.ids.join("-")}><FileText size={15} /> {entry.ids.map((id) => items.find((item) => item.id === id)?.title).filter(Boolean).join(" · ")} <small>Text matches exactly. Inspect both source labels before removing anything.</small></p>) : <p className="cp-life-all-clear"><CheckCircle2 size={16} /> No exact text duplicates detected.</p>}</article>
    </section>}
    {notice && <div className="cp-life-toast" role="status"><CheckCircle2 size={16} />{notice}<button aria-label="Dismiss" onClick={() => setNotice("")}><X size={15} /></button></div>}
  </div>;
}

function InboxCard({ item, facts, conflicts, journeys, onConnect, onSaveEdit, onConfirm, onDismiss, onOpen, onListen, onStory }: { item: InboxItem; facts: LifeFact[]; conflicts: number; journeys: Journey[]; onConnect: (journeyId: string) => void; onSaveEdit: (title: string, text: string) => Promise<boolean>; onConfirm: () => void; onDismiss: () => void; onOpen: () => void; onListen: () => void; onStory: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item.title);
  const [editedText, setEditedText] = useState(item.text);
  const [savingEdit, setSavingEdit] = useState(false);
  return <article className={`cp-life-inbox-item ${item.status === "confirmed" ? "confirmed" : ""}`}>
    <div className="cp-life-inbox-symbol">{item.requestedKind === "document" ? <FileText size={18} /> : item.requestedKind === "measurement" ? <Activity size={18} /> : item.requestedKind === "appointment" ? <CalendarDays size={18} /> : <ClipboardList size={18} />}</div>
    <div className="cp-life-inbox-content">
      <div className="cp-life-record-title"><h3>{item.title}</h3>{item.sample && <span>SYNTHETIC SAMPLE · NOT A REAL RECORD</span>}</div>
      <div className="cp-life-meta"><span>{item.kind}</span><span>{item.sourceLabel}</span><span>{shortDate(item.createdAt)}</span></div>
      {editing ? <div className="cp-life-edit-form"><label>Correct the title<input value={editedTitle} onChange={(event) => setEditedTitle(event.target.value)} maxLength={90} /></label><label>Correct the extracted or entered text<textarea value={editedText} onChange={(event) => setEditedText(event.target.value)} rows={5} maxLength={6000} /></label><p>Changes stay in this browser. The original file remains unchanged and linked. Extracted details will be recalculated when you save; review them again before confirming.</p><div><button className="cp-button quiet" onClick={() => { setEditing(false); setEditedTitle(item.title); setEditedText(item.text); }}>Cancel</button><button className="cp-button cp-life-primary" disabled={savingEdit || !editedText.trim()} onClick={() => { setSavingEdit(true); void onSaveEdit(editedTitle, editedText).then((saved) => { if (saved) setEditing(false); }).finally(() => setSavingEdit(false)); }}><Check size={14} /> {savingEdit ? "Saving…" : "Save correction"}</button></div></div> : <p className={expanded ? "" : "clamped"}>{item.text}</p>}
      {!editing && facts.length > 0 && <div className="cp-life-inbox-facts">{facts.map((fact, index) => <span key={`${fact.label}-${index}`}><b>{fact.label}:</b> {fact.value}</span>)}</div>}
      <div className="cp-life-item-status"><span className={item.status}>{item.status === "confirmed" ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}{item.status === "confirmed" ? "Confirmed by you" : "Needs your review"}</span>{conflicts > 0 && <span className="conflict"><CircleAlert size={14} /> Possible conflict</span>}{item.status === "confirmed" && item.journeyId && <button onClick={onStory}>View in story <ArrowRight size={13} /></button>}</div>
      {!editing && <div className="cp-life-item-actions"><label className="cp-life-connect"><Link2 size={13} /><select aria-label={`Connect ${item.title} to a journey`} value={item.journeyId || ""} onChange={(event) => onConnect(event.target.value)}><option value="">Keep in inbox</option>{journeys.map((journey) => <option value={journey.id} key={journey.id}>{journey.title}</option>)}</select></label><button className="cp-button quiet" onClick={() => setEditing(true)}>Edit & check</button><button className="cp-button quiet" onClick={() => setExpanded(!expanded)}>{expanded ? "Show less" : "Read full text"}</button>{item.sourceId && <button className="cp-button quiet" onClick={onOpen}><FileText size={14} /> Original file</button>}<button className="cp-button quiet" onClick={onListen}><Volume2 size={14} /> Listen</button>{item.status === "review" && <button className="cp-button cp-life-primary" onClick={onConfirm}><Check size={15} /> Confirm for my story</button>}<button className="cp-life-dismiss" onClick={onDismiss} aria-label={`Remove ${item.title} from inbox`}><Trash2 size={15} /></button></div>}
    </div>
  </article>;
}

function JourneyDetail({ journey, items, onToggleTask, onAddTask, taskDraft, setTaskDraft }: { journey: Journey; items: InboxItem[]; onToggleTask: (journeyId: string, taskId: string) => void; onAddTask: (event: FormEvent<HTMLFormElement>) => void; taskDraft: string; setTaskDraft: (value: string) => void }) {
  return <><div className="cp-panel-heading"><div><span className="cp-eyebrow">ACTIVE JOURNEY{journey.sample ? " · SYNTHETIC SAMPLE" : ""}</span><h2>{journey.title}</h2></div><CheckCircle2 size={19} /></div><p className="cp-life-intro"><strong>Intended outcome:</strong> {journey.outcome || "Not specified yet"}</p><div className="cp-life-journey-stats"><span><b>{items.filter((item) => item.status === "confirmed").length}</b> confirmed</span><span><b>{items.filter((item) => item.status === "review").length}</b> need review</span><span><b>{journey.tasks.filter((task) => task.done).length}/{journey.tasks.length}</b> tasks done</span></div><div className="cp-life-task-list">{journey.tasks.map((task) => <label key={task.id} className={task.done ? "done" : ""}><input type="checkbox" checked={task.done} onChange={() => onToggleTask(journey.id, task.id)} /><span className="cp-life-task-check"><Check size={13} /></span><span>{task.text}</span></label>)}</div><form className="cp-life-task-form" onSubmit={onAddTask}><input value={taskDraft} onChange={(event) => setTaskDraft(event.target.value)} placeholder="Add a task you want to do" aria-label="Add a user-defined task" maxLength={180} /><button className="cp-button quiet" type="submit"><Plus size={15} /> Add task</button></form><p className="cp-life-small-note">Tasks are user-created organizational notes. No treatment steps or medical deadlines are added.</p></>;
}
