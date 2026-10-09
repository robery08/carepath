import { useEffect, useState } from "react";
import {
  Clock3,
  Pill,
  Plus,
  Search,
  Trash2,
  X,
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

const defaultMedicines: Medicine[] = [
  {
    id: "2",
    name: "Amlodipine",
    strength: "5 mg",
    form: "Tablet",
    schedule: "8:00 AM",
    instructions: "Morning",
  },
  {
    id: "3",
    name: "Atorvastatin",
    strength: "10 mg",
    form: "Tablet",
    schedule: "10:00 PM",
    instructions: "Night",
  },
  {
    id: "4",
    name: "Metformin",
    strength: "500 mg",
    form: "Tablet",
    schedule: "1:00 PM",
    instructions: "After food",
  },
];

type Props = {
  onClose: () => void;
  onCountChange: (count: number) => void;
};

export default function MedicineCenter({
  onClose,
  onCountChange,
}: Props) {
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    try {
      const saved = localStorage.getItem("carepath_medicines");
      return saved ? JSON.parse(saved) : defaultMedicines;
    } catch {
      return defaultMedicines;
    }
  });

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    strength: "",
    form: "Tablet",
    schedule: "",
    instructions: "",
    expiryDate: "",
  });

  useEffect(() => {
    try {
      localStorage.setItem("carepath_medicines", JSON.stringify(medicines));
      localStorage.setItem("carepath_last_local_save", new Date().toISOString());
    } catch { /* Keep the session usable when browser storage is unavailable. */ }

    onCountChange(medicines.length);
  }, [medicines, onCountChange]);

  const addMedicine = () => {
    if (!form.name.trim() || !form.strength.trim()) {
      alert("Please enter the medicine name and strength.");
      return;
    }

    const newMedicine: Medicine = {
      id: Date.now().toString(),
      name: form.name.trim(),
      strength: form.strength.trim(),
      form: form.form,
      schedule: form.schedule || "Not specified",
      instructions: form.instructions || "Follow supplied instructions",
      expiryDate: form.expiryDate || undefined,
    };

    setMedicines((current) => [newMedicine, ...current]);

    setForm({
      name: "",
      strength: "",
      form: "Tablet",
      schedule: "",
      instructions: "",
      expiryDate: "",
    });

    setShowForm(false);
  };

  const removeMedicine = (id: string) => {
    const medicine = medicines.find((item) => item.id === id);

    if (!medicine) return;

    const confirmed = window.confirm(
      `Remove ${medicine.name} from your CAREPATH medicine list?`
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
              <p>CAREPATH</p>
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
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
            Add medicine
          </button>
        </div>

        {showForm && (
          <div className="medicine-form">
            <div className="form-header">
              <div>
                <p>Add a medicine</p>
                <span>
                  Enter the information from your package or supplied
                  prescription instructions.
                </span>
              </div>

              <button
                className="form-close"
                onClick={() => setShowForm(false)}
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

              <label>
                Package expiry (optional)
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                />
              </label>
            </div>

            <div className="form-actions">
              <button
                className="secondary"
                onClick={() => setShowForm(false)}
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

        <div className="medicine-list-header">
          <div>
            <strong>{filteredMedicines.length}</strong>
            <span> medicines shown</span>
          </div>

          <span className="privacy-note">
            Demo data is stored locally on this browser.
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
                  <small>{medicine.expiryDate ? `Expiry recorded: ${medicine.expiryDate}. ` : ""}Optional on-device estimate. It does not set a dose or schedule. CAREPATH cannot verify the entered count or your instructions.</small>
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
              <h3>No medicines found</h3>
              <p>Try another search or add a new medicine.</p>
            </div>
          )}
        </div>

        <div className="medicine-safety-note">
          <strong>Important</strong>
          <span>
            CAREPATH stores the information you enter. It does not
            independently prescribe, change, or stop a medicine.
            Always verify medicine details against the original
            package or professional instructions.
          </span>
        </div>
      </div>
    </div>
  );
}

