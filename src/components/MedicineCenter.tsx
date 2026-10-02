import { useEffect, useState } from "react";
import {
  Clock3,
  Pill,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import MedlinePlusLookup from "./MedlinePlusLookup";
import { readExampleMedicineArchive, readPersonalMedicines, saveExampleMedicineArchive } from "../medicineStorage";
import type { VoiceLanguage } from "../voice";

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

type Props = {
  onClose: () => void;
  onCountChange: (count: number) => void;
  language: VoiceLanguage;
};

function toTimeInput(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return "";
  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[3]?.toUpperCase();
  if (meridiem) hours = (hours % 12) + (meridiem === "PM" ? 12 : 0);
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

export default function MedicineCenter({
  onClose,
  onCountChange,
  language,
}: Props) {
  const [medicines, setMedicines] = useState<Medicine[]>(() => readPersonalMedicines<Medicine>());
  const [exampleMedicines, setExampleMedicines] = useState<Medicine[]>(() => readExampleMedicineArchive<Medicine>());

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showMedicineLookup, setShowMedicineLookup] = useState(false);
  const [lookupTerm, setLookupTerm] = useState("");
  const [reviewingExampleId, setReviewingExampleId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    strength: "",
    form: "Tablet",
    schedule: "",
    instructions: "",
    reason: "",
    remainingUnits: "",
    unitsPerDay: "",
    expiryDate: "",
  });

  useEffect(() => {
    try {
      localStorage.setItem("carepath_medicines", JSON.stringify(medicines));
      localStorage.setItem("carepath_last_local_save", new Date().toISOString());
    } catch { /* Keep the session usable when browser storage is unavailable. */ }

    onCountChange(medicines.length);
  }, [medicines, onCountChange]);

  const resetForm = () => setForm({ name: "", strength: "", form: "Tablet", schedule: "", instructions: "", reason: "", remainingUnits: "", unitsPerDay: "", expiryDate: "" });
  const openNewMedicineForm = () => { resetForm(); setReviewingExampleId(null); setShowForm(true); };
  const closeMedicineForm = () => { setShowForm(false); setReviewingExampleId(null); resetForm(); };

  const addMedicine = () => {
    if (!form.name.trim() || !form.strength.trim()) {
      alert("Please enter the medicine name and strength.");
      return;
    }
    const remainingUnits = form.remainingUnits.trim() ? Number(form.remainingUnits) : undefined;
    const unitsPerDay = form.unitsPerDay.trim() ? Number(form.unitsPerDay) : undefined;
    if ((remainingUnits !== undefined && (!Number.isFinite(remainingUnits) || remainingUnits < 0))
      || (unitsPerDay !== undefined && (!Number.isFinite(unitsPerDay) || unitsPerDay <= 0))) {
      alert("Check the supply numbers. Units remaining must be zero or higher; units per day must be greater than zero.");
      return;
    }

    const newMedicine: Medicine = {
      id: Date.now().toString(),
      name: form.name.trim(),
      strength: form.strength.trim(),
      form: form.form,
      schedule: form.schedule || "Not specified",
      instructions: form.instructions || "Follow supplied instructions",
      reason: form.reason.trim() || undefined,
      remainingUnits,
      unitsPerDay,
      expiryDate: form.expiryDate || undefined,
      source: "user",
    };

    setMedicines((current) => [newMedicine, ...current]);

    resetForm();

    if (reviewingExampleId) {
      const remainingExamples = exampleMedicines.filter((item) => item.id !== reviewingExampleId);
      setExampleMedicines(remainingExamples);
      saveExampleMedicineArchive(remainingExamples);
      setReviewingExampleId(null);
    }
    setShowForm(false);
  };

  const reviewExample = (medicine: Medicine) => {
    setForm({
      name: medicine.name,
      strength: medicine.strength,
      form: medicine.form,
      schedule: toTimeInput(medicine.schedule),
      instructions: medicine.instructions,
      reason: medicine.reason || "",
      remainingUnits: medicine.remainingUnits === undefined ? "" : String(medicine.remainingUnits),
      unitsPerDay: medicine.unitsPerDay === undefined ? "" : String(medicine.unitsPerDay),
      expiryDate: medicine.expiryDate || "",
    });
    setReviewingExampleId(medicine.id);
    setShowForm(true);
  };

  const removeMedicine = (id: string) => {
    const medicine = medicines.find((item) => item.id === id);

    if (!medicine) return;

    const confirmed = window.confirm(
      `Remove ${medicine.name} from your CARE CONNECTED medicine list?`
    );

    if (confirmed) {
      setMedicines((current) =>
        current.filter((item) => item.id !== id)
      );
    }
  };

  const updateSupply = (id: string, field: "remainingUnits" | "unitsPerDay", value: string) => {
    const parsed = value === "" ? undefined : Number(value);
    if (parsed !== undefined && (!Number.isFinite(parsed) || parsed < 0)) return;
    setMedicines((current) => current.map((medicine) =>
      medicine.id === id ? { ...medicine, [field]: parsed } : medicine,
    ));
  };

  const filteredMedicines = medicines.filter((medicine) => {
    const query = search.toLowerCase();

    return (
      medicine.name.toLowerCase().includes(query) ||
      medicine.strength.toLowerCase().includes(query) ||
      medicine.form.toLowerCase().includes(query)
    );
  });

  return (
    <div className="medicine-overlay">
      <div className="medicine-center">
        <div className="medicine-center-header">
          <div className="medicine-title">
            <div className="medicine-title-icon">
              <Pill size={25} />
            </div>

            <div>
              <p>CARE CONNECTED</p>
              <h2>My Medicines</h2>
              <span>
                Keep your confirmed medicine information organized.
              </span>
            </div>
          </div>

          <button className="close-center" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="medicine-info-strip">
          <div><strong>Want to know what a medicine is generally used for?</strong><span>Search U.S. NIH MedlinePlus here. Only the medicine name is sent, and only after you agree.</span></div>
          <button type="button" className="medicine-info-toggle" aria-expanded={showMedicineLookup} aria-controls="medicine-info-lookup" onClick={() => { setLookupTerm(search.trim()); setShowMedicineLookup((open) => !open); }}>
            <Search size={16} /> {showMedicineLookup ? "Close lookup" : "Look up medicine info"}
          </button>
        </div>
        {showMedicineLookup && <div className="medicine-info-panel" id="medicine-info-lookup"><MedlinePlusLookup key={lookupTerm || "medicine-lookup"} question={lookupTerm ? `What is ${lookupTerm} used for?` : ""} initialTerm={lookupTerm} language={language === "kn" ? "kn" : "en"} /></div>}

        <div className="medicine-toolbar">
          <div className="medicine-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search medicines..."
            />
          </div>

          <button
            className="medicine-add-button"
            onClick={openNewMedicineForm}
          >
            <Plus size={18} />
            Add medicine
          </button>
        </div>

        {showForm && (
          <div className="medicine-form">
            <div className="form-header">
              <div>
                <p>{reviewingExampleId ? "Review an old example before adding it" : "Add a medicine"}</p>
                <span>
                  {reviewingExampleId ? "This was sample data. Check every field against your own current package or prescription. Save only if this medicine is yours." : "Enter the information from your package or supplied prescription instructions."}
                </span>
              </div>

              <button
                className="form-close"
                onClick={closeMedicineForm}
              >
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <label>
                Medicine name
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Example: Paracetamol"
                />
              </label>

              <label>
                Strength
                <input
                  value={form.strength}
                  onChange={(e) =>
                    setForm({ ...form, strength: e.target.value })
                  }
                  placeholder="Example: 500 mg"
                />
              </label>

              <label>
                Form
                <select
                  value={form.form}
                  onChange={(e) =>
                    setForm({ ...form, form: e.target.value })
                  }
                >
                  <option>Tablet</option>
                  <option>Capsule</option>
                  <option>Syrup</option>
                  <option>Cream</option>
                  <option>Drops</option>
                  <option>Injection</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Time
                <input
                  type="time"
                  value={form.schedule}
                  onChange={(e) =>
                    setForm({ ...form, schedule: e.target.value })
                  }
                />
              </label>

              <label className="wide-field">
                Supplied instructions
                <input
                  value={form.instructions}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      instructions: e.target.value,
                    })
                  }
                  placeholder="Example: After food"
                />
              </label>

              <label className="wide-field">
                Why did your care team prescribe it? (optional)
                <input
                  value={form.reason}
                  maxLength={160}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Use your clinician’s words or the written label"
                />
              </label>

              <label>
                Package expiry (optional)
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                />
              </label>

              <label>
                Units remaining (optional)
                <input type="number" min="0" step="1" inputMode="numeric" value={form.remainingUnits} onChange={(e) => setForm({ ...form, remainingUnits: e.target.value })} placeholder="Count from package" />
              </label>

              <label>
                Units per day (optional)
                <input type="number" min="0.01" step="any" inputMode="decimal" value={form.unitsPerDay} onChange={(e) => setForm({ ...form, unitsPerDay: e.target.value })} placeholder="Only from your label" />
              </label>
            </div>

            <div className="form-actions">
              <button
                className="secondary"
                onClick={closeMedicineForm}
              >
                Cancel
              </button>

              <button
                className="primary"
                onClick={addMedicine}
              >
                <Plus size={17} />
                Save medicine
              </button>
            </div>
          </div>
        )}

        {exampleMedicines.length > 0 && <section className="medicine-example-archive" aria-labelledby="medicine-example-archive-title">
          <div><h3 id="medicine-example-archive-title">Examples from an older version</h3><p>These were sample entries, so they have been moved out of your personal list. Their saved notes are kept on this device. Add one only after checking it against your current package or prescription.</p></div>
          {exampleMedicines.map((medicine) => <article key={medicine.id}><span><strong>{medicine.name} · {medicine.strength}</strong><small>Example only · review before adding to your personal list</small></span><button type="button" className="cp-button quiet" onClick={() => reviewExample(medicine)}>Review & add</button></article>)}
        </section>}

        <div className="medicine-list-header">
          <div>
            <strong>{filteredMedicines.length}</strong>
            <span> medicines shown</span>
          </div>

          <span className="privacy-note">
            Saved only on this browser · not synced to an account
          </span>
        </div>

        <div className="medicine-list">
          {filteredMedicines.map((medicine) => {
            const validSupply = typeof medicine.remainingUnits === "number"
              && typeof medicine.unitsPerDay === "number"
              && medicine.unitsPerDay > 0;
            const daysLeft = validSupply
              ? Math.floor(medicine.remainingUnits! / medicine.unitsPerDay!)
              : null;

            return <div className="medicine-row" key={medicine.id}>
              <div className="row-pill">
                <Pill size={21} />
              </div>

              <div className="medicine-row-info">
                <h3>{medicine.name}</h3>

                <p>
                  {medicine.strength} · {medicine.form}
                </p>

                <span>{medicine.instructions}</span>
                  {medicine.reason && <span className="medicine-reason"><strong>Reason recorded from your care team:</strong> {medicine.reason}</span>}

                <details className="medicine-supply">
                  <summary>Supply watch</summary>
                  <div className="medicine-supply-fields">
                    <label>
                      Units remaining
                      <input type="number" min="0" step="1" inputMode="numeric" value={medicine.remainingUnits ?? ""} onChange={(event) => updateSupply(medicine.id, "remainingUnits", event.target.value)} placeholder="Not set" />
                    </label>
                    <label>
                      Units per day
                      <input type="number" min="0.01" step="any" inputMode="decimal" value={medicine.unitsPerDay ?? ""} onChange={(event) => updateSupply(medicine.id, "unitsPerDay", event.target.value)} placeholder="From current label" />
                    </label>
                  </div>
                  {medicine.expiryDate && medicine.expiryDate < new Date().toISOString().slice(0, 10)
                    ? <p className="medicine-supply-estimate low">The expiry date entered is past. Do not use this as a clinical decision; check the package and ask a pharmacist about the next step.</p>
                    : medicine.expiryDate && medicine.expiryDate <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
                      ? <p className="medicine-supply-estimate low">The expiry date entered is within about 30 days. Check the package and plan a pharmacy question.</p>
                      : medicine.remainingUnits === 0
                    ? <p className="medicine-supply-estimate low">0 units entered. Check the package and arrange any next step with your pharmacy or care team.</p>
                    : daysLeft !== null
                      ? <p className={`medicine-supply-estimate${daysLeft <= 7 ? " low" : ""}`}>About {daysLeft} day{daysLeft === 1 ? "" : "s"} at the usage rate you entered. This is a rough count only.</p>
                      : <p className="medicine-supply-estimate">Enter both values from your current package or instructions to see a rough supply estimate.</p>}
                  <small>{medicine.expiryDate ? `Expiry recorded: ${medicine.expiryDate}. ` : ""}Optional on-device estimate. It does not set a dose or schedule. CARE CONNECTED cannot verify the entered count or your instructions.</small>
                </details>
              </div>

              <div className="medicine-time">
                <Clock3 size={15} />
                {medicine.schedule}
              </div>

              <button
                className="delete-medicine"
                onClick={() => removeMedicine(medicine.id)}
                title="Remove medicine"
              >
                <Trash2 size={17} />
              </button>
            </div>;
          })}

          {filteredMedicines.length === 0 && (
            <div className="empty-medicines">
              <Pill size={35} />
              <h3>{medicines.length ? "No medicines found" : "Your personal list starts here"}</h3>
              <p>{medicines.length ? "Try another search or add a new medicine." : "Only medicines you add appear here. Record details from your current package or prescription; CARE CONNECTED will not choose a medicine or dose."}</p>
              {!medicines.length && <button type="button" className="medicine-add-button" onClick={openNewMedicineForm}><Plus size={16} /> Add your medicine</button>}
            </div>
          )}
        </div>

        <div className="medicine-safety-note">
          <strong>Important</strong>
          <span>
            CARE CONNECTED stores the information you enter. It does not
            independently prescribe, change, or stop a medicine.
            Always verify medicine details against the original
            package or professional instructions.
          </span>
        </div>
      </div>
    </div>
  );
}

