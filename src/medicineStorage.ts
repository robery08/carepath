type SavedMedicine = {
  id?: unknown;
  name?: unknown;
  strength?: unknown;
  source?: unknown;
};

const OLD_EXAMPLE_MEDICINES = new Map([
  ["2", ["amlodipine", "5 mg"]],
  ["3", ["atorvastatin", "10 mg"]],
  ["4", ["metformin", "500 mg"]],
]);
const EXAMPLE_ARCHIVE_KEY = "carepath_migrated_example_medicines_v1";

function isExampleMedicine(value: SavedMedicine) {
  if (value.source === "sample") return true;
  const expected = OLD_EXAMPLE_MEDICINES.get(String(value.id ?? ""));
  return Boolean(expected
    && String(value.name ?? "").trim().toLocaleLowerCase() === expected[0]
    && String(value.strength ?? "").trim().toLocaleLowerCase() === expected[1]);
}

/** Read only medicines the user has chosen to save; old seeded demo medicines are migrated out. */
export function readPersonalMedicines<T extends SavedMedicine>(): T[] {
  try {
    const raw = localStorage.getItem("carepath_medicines");
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const examples = parsed.filter((item): item is T => Boolean(item && typeof item === "object") && isExampleMedicine(item as SavedMedicine));
    const personal = parsed.filter((item): item is T => Boolean(item && typeof item === "object") && !isExampleMedicine(item as SavedMedicine));
    if (examples.length) {
      let existing: T[] = [];
      try {
        const existingRaw = localStorage.getItem(EXAMPLE_ARCHIVE_KEY);
        const stored: unknown = existingRaw ? JSON.parse(existingRaw) : [];
        if (Array.isArray(stored)) existing = stored.filter((item): item is T => Boolean(item && typeof item === "object"));
      } catch { /* An invalid old archive can be replaced with a fresh one. */ }
      const merged = new Map<string, T>();
      for (const item of [...existing, ...examples]) if (item && typeof item === "object") merged.set(String(item.id ?? ""), item);
      // Write the recoverable examples first; if storage is full, keep the original medicine list untouched.
      try { localStorage.setItem(EXAMPLE_ARCHIVE_KEY, JSON.stringify(Array.from(merged.values()))); }
      catch { return parsed as T[]; }
    }
    if (personal.length !== parsed.length) {
      localStorage.setItem("carepath_medicines", JSON.stringify(personal));
    }
    return personal;
  } catch {
    return [];
  }
}

export function readExampleMedicineArchive<T extends SavedMedicine>(): T[] {
  try {
    const raw = localStorage.getItem(EXAMPLE_ARCHIVE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is T => Boolean(item && typeof item === "object")) : [];
  } catch {
    return [];
  }
}

export function saveExampleMedicineArchive<T extends SavedMedicine>(items: T[]) {
  try {
    localStorage.setItem(EXAMPLE_ARCHIVE_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}
