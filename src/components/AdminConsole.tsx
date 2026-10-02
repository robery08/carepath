import { useMemo, useState } from "react";
import {
  Archive,
  ArrowDownToLine,
  ArrowRight,
  BookOpenCheck,
  Check,
  Clock3,
  FilePlus2,
  History,
  Info,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import {
  getCareContent,
  getCareContentHistory,
  saveCareContent,
  saveCareContentHistory,
  type CareContent,
  type CareContentChange,
  type CareContentKind,
} from "../careContent";

type Fields = Pick<CareContent, "kind" | "title" | "keywords" | "purposeEn" | "purposeKn" | "summaryEn" | "summaryKn" | "pointsEn" | "pointsKn" | "sourceName" | "sourceUrl">;

const blank: Fields = {
  kind: "medicine",
  title: "",
  keywords: [],
  purposeEn: "",
  purposeKn: "",
  summaryEn: "",
  summaryKn: "",
  pointsEn: [],
  pointsKn: [],
  sourceName: "",
  sourceUrl: "",
};

const dateTime = (value: string) => new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
const nowIso = () => new Date().toISOString();
const localId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function AdminConsole() {
  const [items, setItems] = useState<CareContent[]>(getCareContent);
  const [history, setHistory] = useState<CareContentChange[]>(getCareContentHistory);
  const [form, setForm] = useState<Fields>(blank);
  const [editingId, setEditingId] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const visibleItems = useMemo(() => items.filter((item) => filter === "all" || item.status === filter).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [items, filter]);
  const publishedCount = items.filter((item) => item.status === "published").length;
  const draftCount = items.filter((item) => item.status === "draft").length;

  const setField = <K extends keyof Fields>(key: K, value: Fields[K]) => setForm((current) => ({ ...current, [key]: value }));
  const resetForm = () => { setForm(blank); setEditingId(""); setReviewed(false); setShowForm(false); };
  const logChange = (action: CareContentChange["action"], item: CareContent, nextItems: CareContent[]) => {
    const event: CareContentChange = {
      id: localId("change"),
      action,
      contentTitle: item.title,
      revision: item.revision,
      at: nowIso(),
      actor: "Admin preview · this browser",
      snapshot: nextItems.filter((entry) => entry.status === "published"),
    };
    const nextHistory = [event, ...history].slice(0, 50);
    const contentSaved = saveCareContent(nextItems);
    const historySaved = saveCareContentHistory(nextHistory);
    if (!contentSaved) { setMessage("Could not save this change. Check browser storage space and try again."); return false; }
    setItems(nextItems);
    setHistory(nextHistory);
    setMessage(historySaved ? `${item.title} ${action === "published" ? "published on this device" : action === "updated" ? "updated" : action === "archived" ? "archived" : "restored"}.` : "Content saved, but the local change history could not be saved.");
    return true;
  };

  const collectForm = (): Fields => ({
    ...form,
    title: form.title.trim(),
    keywords: form.keywords.map((word) => word.trim()).filter(Boolean),
    purposeEn: form.purposeEn.trim(),
    purposeKn: form.purposeKn.trim(),
    summaryEn: form.summaryEn.trim(),
    summaryKn: form.summaryKn.trim(),
    pointsEn: form.pointsEn.map((point) => point.trim()).filter(Boolean),
    pointsKn: form.pointsKn.map((point) => point.trim()).filter(Boolean),
    sourceName: form.sourceName.trim(),
    sourceUrl: form.sourceUrl.trim(),
  });

  const saveDraft = (publish: boolean) => {
    const value = collectForm();
    if (!value.title || !value.summaryEn || value.pointsEn.length < 2 || !value.sourceName || !value.sourceUrl) {
      setMessage("Add a title, plain-language summary, at least two information points, and a source before saving.");
      return;
    }
    let parsedSource: URL;
    try { parsedSource = new URL(value.sourceUrl); } catch { setMessage("Enter a complete source link beginning with https://."); return; }
    if (parsedSource.protocol !== "https:") { setMessage("Only secure https:// source links can be saved."); return; }
    if (publish && !reviewed) { setMessage("Review the source and safety statements before publishing."); return; }
    const now = nowIso();
    const existing = items.find((item) => item.id === editingId);
    const nextItem: CareContent = {
      ...value,
      id: existing?.id || localId("guide"),
      status: publish ? "published" : "draft",
      revision: (existing?.revision || 0) + (publish ? 1 : 0),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    const nextItems = existing ? items.map((item) => item.id === existing.id ? nextItem : item) : [nextItem, ...items];
    const action: CareContentChange["action"] = publish ? (existing?.status === "published" ? "updated" : "published") : "updated";
    if (logChange(action, nextItem, nextItems)) resetForm();
  };

  const editItem = (item: CareContent) => {
    setEditingId(item.id);
    setReviewed(false);
    setForm({ ...item, keywords: [...item.keywords], pointsEn: [...item.pointsEn], pointsKn: [...item.pointsKn] });
    setShowForm(true);
    setMessage(item.status === "published" ? "Editing moves this item to draft until you review and publish it again." : "Editing a draft does not make it visible in Ask CARE CONNECTED.");
  };

  const archiveItem = (item: CareContent) => {
    if (!window.confirm(`Archive “${item.title}”? It will no longer appear in Ask CARE CONNECTED.`)) return;
    const archived = { ...item, status: "archived" as const, updatedAt: nowIso() };
    logChange("archived", archived, items.map((entry) => entry.id === item.id ? archived : entry));
  };

  const restoreChange = (event: CareContentChange) => {
    if (!window.confirm(`Restore the published content as it appeared on ${dateTime(event.at)}? Current drafts will remain available.`)) return;
    const restored = new Map(event.snapshot.map((item) => [item.id, { ...item, status: "published" as const }]));
    const nextItems = items.map((item) => restored.get(item.id) || (item.status === "published" ? { ...item, status: "archived" as const, updatedAt: nowIso() } : item));
    for (const [id, item] of restored) if (!nextItems.some((entry) => entry.id === id)) nextItems.unshift(item);
    const historyEvent: CareContentChange = {
      id: localId("change"),
      action: "rollback",
      contentTitle: event.contentTitle,
      revision: event.revision,
      at: nowIso(),
      actor: "Admin preview · this browser",
      snapshot: [...restored.values()],
    };
    const nextHistory = [historyEvent, ...history].slice(0, 50);
    if (!saveCareContent(nextItems)) { setMessage("Could not restore the selected snapshot."); return; }
    saveCareContentHistory(nextHistory);
    setItems(nextItems);
    setHistory(nextHistory);
    setMessage("The selected published content was restored on this device.");
  };

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), scope: "Local CARE CONNECTED content drafts and audit preview", content: items, changes: history }, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `carepath-content-history-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(href);
    setMessage("Local drafts and change history exported. This file is not an account audit record.");
  };

  return <div className="cp-admin-page">
    <header className="cp-admin-hero"><span className="cp-admin-mark"><ShieldCheck size={24} /></span><div><span className="cp-eyebrow">CONTENT ADMIN · PREVIEW</span><h1>CARE CONNECTED Content Studio</h1><p>Prepare clear, source-linked learning cards and review the changes saved in this browser.</p></div><button className="cp-button light" onClick={() => { setForm(blank); setEditingId(""); setShowForm(true); }}><FilePlus2 size={16} /> New content</button></header>

    <div className="cp-admin-security-note" role="note"><ShieldAlert size={20} /><div><strong>This is a local prototype, not a secure admin account.</strong><p>There is no login or server here. Drafts, publications, and history are saved only in this browser; other users and the GitHub website will not receive them. Do not add patient details. A protected team admin and shared publishing need a backend, verified sign-in, and server-side audit storage.</p></div></div>

    <div className="cp-admin-metrics"><article><span><BookOpenCheck size={18} /></span><strong>{publishedCount}</strong><small>Published on this device</small></article><article><span><FilePlus2 size={18} /></span><strong>{draftCount}</strong><small>Drafts awaiting review</small></article><article><span><History size={18} /></span><strong>{history.length}</strong><small>Local change records</small></article><button className="cp-button quiet" onClick={exportHistory}><ArrowDownToLine size={16} /> Export history</button></div>

    {message && <p className="cp-admin-status" role="status"><Check size={16} />{message}</p>}

    {showForm && <section className="cp-admin-editor" aria-labelledby="cp-admin-editor-title"><div className="cp-admin-section-heading"><div><span className="cp-eyebrow">CONTENT WORKFLOW</span><h2 id="cp-admin-editor-title">{editingId ? "Edit a learning card" : "Create a learning card"}</h2></div><button className="cp-button quiet" onClick={resetForm}>Close editor</button></div>
      {editingId && items.find((item) => item.id === editingId)?.status === "published" && <p className="cp-admin-edit-note"><Clock3 size={15} /> Saving this edit as a draft temporarily removes the older version from Ask CARE CONNECTED until you review and publish.</p>}
      <div className="cp-admin-form-grid">
        <label>Content type<select value={form.kind} onChange={(event) => setField("kind", event.target.value as CareContentKind)}><option value="medicine">Medicine information</option><option value="condition">Condition guide</option><option value="self-care">Self-care / home comfort</option></select></label>
        <label>Topic or generic medicine name<input value={form.title} onChange={(event) => setField("title", event.target.value)} placeholder="Example: Metformin" maxLength={90} /></label>
        <label className="span-two">Search words, separated with commas<input value={form.keywords.join(", ")} onChange={(event) => setField("keywords", event.target.value.split(","))} placeholder="Example: type 2 diabetes, blood sugar" /></label>
        <label>General purpose in English<textarea value={form.purposeEn} onChange={(event) => setField("purposeEn", event.target.value)} rows={2} maxLength={240} placeholder="What is this topic or medicine generally used for?" /></label>
        <label>General purpose in Kannada (optional)<textarea value={form.purposeKn} onChange={(event) => setField("purposeKn", event.target.value)} rows={2} maxLength={240} placeholder="ಸಾಮಾನ್ಯ ಬಳಕೆಯನ್ನು ಸರಳವಾಗಿ ಬರೆಯಿರಿ" /></label>
        <label>Short explanation in English<textarea value={form.summaryEn} onChange={(event) => setField("summaryEn", event.target.value)} rows={3} maxLength={500} placeholder="Use simple words. Explain that the exact use depends on the person and product." /></label>
        <label>Short explanation in Kannada<textarea value={form.summaryKn} onChange={(event) => setField("summaryKn", event.target.value)} rows={3} maxLength={500} placeholder="ಸರಳ ಕನ್ನಡದಲ್ಲಿ ಚಿಕ್ಕ ವಿವರಣೆ" /></label>
        <label>Key points in English <small>One short point per line · at least two</small><textarea value={form.pointsEn.join("\n")} onChange={(event) => setField("pointsEn", event.target.value.split("\n"))} rows={5} maxLength={1600} placeholder={"What users should understand\nWhat they should check in the official source\nWhen to ask a pharmacist or clinician"} /></label>
        <label>Key points in Kannada (optional)<small>ಒಂದು ಸಾಲಿಗೆ ಒಂದು ಅಂಶ</small><textarea value={form.pointsKn.join("\n")} onChange={(event) => setField("pointsKn", event.target.value.split("\n"))} rows={5} maxLength={1600} placeholder={"ಸರಳ ಅಂಶ 1\nಸರಳ ಅಂಶ 2"} /></label>
        <label>Source name<input value={form.sourceName} onChange={(event) => setField("sourceName", event.target.value)} placeholder="Example: NIH MedlinePlus" /></label>
        <label>Secure source link<input type="url" value={form.sourceUrl} onChange={(event) => setField("sourceUrl", event.target.value)} placeholder="https://…" /></label>
      </div>
      <div className="cp-admin-review-box"><strong>Before publishing</strong><label><input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} /> I checked the linked source and wording; this is general education, has no dose or personal treatment instructions, and contains no user health record.</label><p>CARE CONNECTED will display this card as educational information. An admin checkbox does not independently verify a claim.</p></div>
      <div className="cp-admin-form-actions"><button className="cp-button quiet" onClick={() => saveDraft(false)}><FilePlus2 size={15} /> Save draft</button><button className="cp-button primary" onClick={() => saveDraft(true)} disabled={!reviewed}><BookOpenCheck size={15} /> Publish on this device</button></div>
    </section>}

    <section className="cp-admin-list-section"><div className="cp-admin-section-heading"><div><span className="cp-eyebrow">CONTENT LIBRARY</span><h2>Guides and updates</h2></div><select aria-label="Filter content" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">All status</option><option value="draft">Drafts</option><option value="published">Published here</option><option value="archived">Archived</option></select></div>
      {visibleItems.length ? <div className="cp-admin-content-list">{visibleItems.map((item) => <article key={item.id} className="cp-admin-content-card"><div className="cp-admin-card-top"><span className={`cp-admin-status ${item.status}`}>{item.status}</span><small>REV {item.revision} · UPDATED {dateTime(item.updatedAt)}</small></div><h3>{item.title}</h3><p>{item.purposeEn || item.summaryEn}</p><a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.sourceName}<ArrowRight size={13} /></a><div className="cp-admin-card-actions"><button className="cp-button quiet" onClick={() => editItem(item)}>Edit / review</button>{item.status !== "archived" && <button className="cp-button quiet" onClick={() => archiveItem(item)}><Archive size={14} /> Archive</button>}</div></article>)}</div> : <div className="cp-admin-empty"><span><BookOpenCheck size={22} /></span><strong>No content in this view yet</strong><p>Start with a sourced medicine explanation, condition guide, or evidence-based comfort tip.</p><button className="cp-button primary" onClick={() => { setForm(blank); setShowForm(true); }}>Create first card <ArrowRight size={14} /></button></div>}
    </section>

    <section className="cp-admin-history"><button className="cp-admin-history-toggle" aria-expanded={showHistory} onClick={() => setShowHistory((value) => !value)}><span><History size={18} /> Local change history <small>{history.length} changes</small></span><span>{showHistory ? "Hide" : "Review"}</span></button>{showHistory && <div className="cp-admin-history-list">{history.length ? history.map((event) => <article key={event.id}><span className="cp-admin-history-icon"><History size={15} /></span><div><strong>{event.contentTitle}</strong><p>{event.action} · revision {event.revision} · {event.actor}</p><small>{dateTime(event.at)} · snapshot contains {event.snapshot.length} published cards</small></div><button className="cp-button quiet" onClick={() => restoreChange(event)}><RotateCcw size={14} /> Restore this version</button></article>) : <p className="cp-muted-copy">Published, edited, archived, and rollback actions will appear here.</p>}</div>}</section>

    <div className="cp-admin-footnote"><Stethoscope size={16} /><span>Shared, multi-user administration requires a secure server. This preview helps shape the workflow; it is not a clinical content approval system.</span><button onClick={() => setMessage("No patient records are displayed in this content editor. Sign-in, roles, shared publishing, and audit logs need a backend.")}><Info size={14} /> Privacy note</button></div>
  </div>;
}
