import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronDown,
  Clock3,
  Droplets,
  HeartPulse,
  Mic,
  Pencil,
  Plus,
  Thermometer,
  Weight,
  X,
  Zap,
} from "lucide-react";
import { getVoiceLanguage, saveVoiceLanguage } from "../voice";
import type { VoiceLanguage } from "../voice";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type HealthMetric =
  | "Blood Pressure"
  | "Blood Glucose"
  | "Pulse"
  | "SpO₂"
  | "Temperature"
  | "Weight"
  | "Height"
  | "Sleep"
  | "Steps";

type HealthReading = {
  id: string;
  metric: HealthMetric;
  value: number;
  secondValue?: number;
  unit: string;
  date: string;
  time: string;
  note: string;
  source?: "voice" | "typed";
  sourceLabel?: string;
};

type Props = {
  onClose: () => void;
  voiceEnabled: boolean;
};

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

const STORAGE_KEY = "carepath_health_readings";

function getDateOffset(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const metricOptions: Array<{
  name: HealthMetric;
  unit: string;
  icon: typeof HeartPulse;
}> = [
  {
    name: "Blood Pressure",
    unit: "mmHg",
    icon: HeartPulse,
  },
  {
    name: "Blood Glucose",
    unit: "mg/dL",
    icon: Droplets,
  },
  {
    name: "Pulse",
    unit: "bpm",
    icon: Activity,
  },
  {
    name: "SpO₂",
    unit: "%",
    icon: Zap,
  },
  {
    name: "Temperature",
    unit: "°C",
    icon: Thermometer,
  },
  {
    name: "Weight",
    unit: "kg",
    icon: Weight,
  },
  {
    name: "Height",
    unit: "cm",
    icon: Activity,
  },
  {
    name: "Sleep",
    unit: "hours",
    icon: Clock3,
  },
  {
    name: "Steps",
    unit: "steps",
    icon: Activity,
  },
];

function getInitialReadings(): HealthReading[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is HealthReading => {
          if (!item || typeof item !== "object") return false;
          const reading = item as Partial<HealthReading>;
          return typeof reading.id === "string"
            && !reading.id.startsWith("demo-")
            && metricOptions.some((option) => option.name === reading.metric)
            && typeof reading.value === "number"
            && Number.isFinite(reading.value)
            && typeof reading.unit === "string"
            && typeof reading.date === "string"
            && /^\d{4}-\d{2}-\d{2}$/u.test(reading.date)
            && typeof reading.time === "string"
            && /^\d{2}:\d{2}$/u.test(reading.time)
            && typeof reading.note === "string";
        });
      }
    }
  } catch {
    // Never substitute demonstration values for a user's own records.
  }

  return [];
}

function getCurrentDate() {
  return getDateOffset(0);
}

function getCurrentTime() {
  return new Date().toTimeString().slice(0, 5);
}

function formatMetricValue(reading: HealthReading) {
  if (reading.metric === "Blood Pressure") {
    return `${reading.value}/${reading.secondValue ?? "--"}`;
  }

  return String(reading.value);
}

function getMetricStatus(_reading: HealthReading) {
  return "Recorded";
}

const spokenNumberWords: Record<string, number> = {
  zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  ಶೂನ್ಯ: 0, ಸೊನ್ನೆ: 0, ಒಂದು: 1, ಎರಡು: 2, ಮೂರು: 3, ನಾಲ್ಕು: 4, ಐದು: 5, ಆರು: 6, ಏಳು: 7, ಎಂಟು: 8, ಒಂಬತ್ತು: 9,
  ಹತ್ತು: 10, ಹನ್ನೊಂದು: 11, ಹನ್ನೆರಡು: 12, ಹದಿಮೂರು: 13, ಹದಿನಾಲ್ಕು: 14, ಹದಿನೈದು: 15, ಹದಿನಾರು: 16, ಹದಿನೇಳು: 17, ಹದಿನೆಂಟು: 18, ಹತ್ತೊಂಬತ್ತು: 19,
  ಇಪ್ಪತ್ತು: 20, ಮೂವತ್ತು: 30, ನಲವತ್ತು: 40, ಐವತ್ತು: 50, ಅರವತ್ತು: 60, ಎಪ್ಪತ್ತು: 70, ಎಂಭತ್ತು: 80, ತೊಂಬತ್ತು: 90,
};

function parseSpokenNumber(phrase: string): number | null {
  const kannadaDigits = "೦೧೨೩೪೫೬೭೮೯";
  const normalized = phrase.toLowerCase().replace(/[೦-೯]/g, (digit) => String(kannadaDigits.indexOf(digit))).replace(/-/g, " ").trim();
  const direct = normalized.match(/[0-9]+(?:[.,][0-9]+)?/g);
  if (direct?.length === 1) {
    const parsed = Number(direct[0].replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  const unitWords = /\b(?:my|the|reading|is|was|show|shows|value|blood|pressure|systolic|diastolic|glucose|sugar|pulse|heart|rate|temperature|oxygen|saturation|weight|height|sleep|steps|hours?|minutes?|centimeters?|centimetres?|meters?|metres?|inches?|millimeters?|millimetres?|mercury|mmhg|degrees?|celsius|fahrenheit|percent|bpm|mg|dl|kg|per|of)\b/g;
  const tokens = normalized.replace(unitWords, " ").replace(/[^a-z0-9.\s\u0C80-\u0CFF]/g, " ").split(/\s+/).filter(Boolean);
  let total = 0;
  let current = 0;
  let decimal = false;
  let decimalDigits = "";
  let sawNumber = false;
  for (const token of tokens) {
    if (token === "and" || token === "ಮತ್ತು") continue;
    if (token === "point" || token === "dot") { decimal = true; continue; }
    if (token === "hundred" || token === "ನೂರು" || token === "ನೂರ") { current = Math.max(1, current) * 100; sawNumber = true; continue; }
    if (token === "thousand" || token === "ಸಾವಿರ") { total += Math.max(1, current) * 1000; current = 0; sawNumber = true; continue; }
    const number = spokenNumberWords[token];
    if (number === undefined) return null;
    sawNumber = true;
    if (decimal) decimalDigits += String(number);
    else current += number;
  }
  if (!sawNumber) return null;
  const whole = total + current;
  return decimalDigits ? whole + Number(`0.${decimalDigits}`) : whole;
}

function parseSpokenReading(transcript: string, metric: HealthMetric) {
  const expected = metric === "Blood Pressure" ? 2 : 1;
  const digitValues = transcript.match(/[0-9]+(?:[.,][0-9]+)?/g)?.map((item) => Number(item.replace(",", "."))) ?? [];
  if (digitValues.length === expected && digitValues.every(Number.isFinite)) return digitValues;
  if (metric === "Blood Pressure") {
    const parts = transcript.split(/\b(?:over|slash|above)\b|\/|ಮೇಲೆ|ಒವರ್/i).map((part) => part.trim()).filter(Boolean);
    if (parts.length === 2) {
      const values = parts.map(parseSpokenNumber);
      if (values.every((item): item is number => item !== null)) return values;
    }
    return null;
  }
  if (digitValues.length) return null;
  const value = parseSpokenNumber(transcript);
  return value === null ? null : [value];
}

export default function HealthMonitor({ onClose, voiceEnabled }: Props) {
  const [readings, setReadings] =
    useState<HealthReading[]>(getInitialReadings);

  const [selectedMetric, setSelectedMetric] =
    useState<HealthMetric>("Blood Pressure");

  const [period, setPeriod] =
    useState<"7D" | "30D" | "90D" | "ALL">("7D");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reviewReading, setReviewReading] = useState<HealthReading | null>(null);

  const [metric, setMetric] =
    useState<HealthMetric>("Blood Pressure");

  const [value, setValue] = useState("");
  const [secondValue, setSecondValue] = useState("");
  const [date, setDate] = useState(getCurrentDate);
  const [time, setTime] = useState(getCurrentTime);
  const [note, setNote] = useState("");
  const [sourceLabel, setSourceLabel] = useState("My device reading (entered by me)");
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>(getVoiceLanguage);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceNotice, setVoiceNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [listening, setListening] = useState(false);
  const [entrySource, setEntrySource] = useState<"voice" | "typed">("typed");
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => () => speechRecognitionRef.current?.stop(), []);
  useEffect(() => {
    if (!voiceEnabled) {
      speechRecognitionRef.current?.stop();
      speechRecognitionRef.current = null;
    }
  }, [voiceEnabled]);

  const selectedMetricInfo = metricOptions.find(
    (item) => item.name === metric,
  );

  const filteredReadings = useMemo(() => {
    const now = new Date();
    const days = period === "7D" ? 7 : period === "30D" ? 30 : period === "90D" ? 90 : Infinity;

    return readings
      .filter((reading) => {
        const readingDate = new Date(
          `${reading.date}T${reading.time}:00`,
        );

        const difference =
          (now.getTime() - readingDate.getTime()) /
          (1000 * 60 * 60 * 24);

        return reading.metric === selectedMetric && difference >= 0 && difference <= days;
      })
      .sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(
          `${b.date} ${b.time}`,
        ),
      );
  }, [readings, selectedMetric, period]);

  const chartData = useMemo(() => {
    return filteredReadings.map((reading) => ({
      date: `${reading.date.slice(5)} ${reading.time}`,
      value: reading.value,
      secondary: reading.secondValue,
    }));
  }, [filteredReadings]);

  const latestReading = useMemo(() => {
    const items = readings
      .filter((reading) => reading.metric === selectedMetric)
      .sort((a, b) =>
        `${b.date} ${b.time}`.localeCompare(
          `${a.date} ${a.time}`,
        ),
      );

    return items[0];
  }, [readings, selectedMetric]);

  const averageValue = useMemo(() => {
    if (filteredReadings.length < 2) return "—";
    const average = (values: number[]) => values.reduce((total, current) => total + current, 0) / values.length;
    const digits = selectedMetric === "Temperature" || selectedMetric === "Weight" || selectedMetric === "Height" || selectedMetric === "Sleep" ? 1 : 0;
    const primary = average(filteredReadings.map((item) => item.value)).toFixed(digits);
    if (selectedMetric === "Blood Pressure") {
      const diastolic = average(filteredReadings.map((item) => item.secondValue ?? 0)).toFixed(0);
      return `${primary}/${diastolic}`;
    }
    return primary;
  }, [filteredReadings, selectedMetric]);

  const latestHeight = readings.filter((reading) => reading.metric === "Height").sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))[0];
  const latestWeight = readings.filter((reading) => reading.metric === "Weight").sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))[0];
  const calculatedBmi = latestHeight && latestWeight && latestHeight.value > 0
    ? (latestWeight.value / ((latestHeight.value / 100) ** 2)).toFixed(1)
    : null;

  const previousReading = readings
    .filter((reading) => reading.metric === selectedMetric)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))[1];
  const recordedChange = latestReading && previousReading
    ? selectedMetric === "Blood Pressure"
      ? `${latestReading.value - previousReading.value >= 0 ? "+" : ""}${latestReading.value - previousReading.value}/${(latestReading.secondValue ?? 0) - (previousReading.secondValue ?? 0)} ${latestReading.unit}`
      : `${latestReading.value - previousReading.value >= 0 ? "+" : ""}${(latestReading.value - previousReading.value).toFixed(selectedMetric === "Temperature" || selectedMetric === "Weight" || selectedMetric === "Height" || selectedMetric === "Sleep" ? 1 : 0)} ${latestReading.unit}`
    : "Add another reading to compare";

  function persist(nextReadings: HealthReading[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextReadings));
      setReadings(nextReadings);
      return true;
    } catch {
      setFormError("Your browser could not save this reading. Free device storage and try again.");
      return false;
    }
  }

  function resetForm() {
    setValue("");
    setSecondValue("");
    setDate(getCurrentDate());
    setTime(getCurrentTime());
    setNote("");
    setSourceLabel("My device reading (entered by me)");
    setMetric("Blood Pressure");
    setVoiceTranscript("");
    setVoiceNotice("");
    setFormError("");
    setEntrySource("typed");
    setEditingId(null);
    setReviewReading(null);
  }

  function startVoiceEntry() {
    if (!voiceEnabled) { setVoiceNotice("Turn on voice support in the accessibility bar first."); return; }
    const Speech = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
    if (!Speech) { setVoiceNotice("Voice input is not available in this browser. Enter the numbers below instead."); return; }
    speechRecognitionRef.current?.stop();
    setVoiceTranscript("");
    setVoiceNotice("Listening for a single measurement. Review the words and numbers before using them.");
    try {
      const recognition = new Speech();
      recognition.lang = voiceLanguage === "kn" ? "kn-IN" : "en-IN";
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim() || "";
        setVoiceTranscript(transcript);
        setVoiceNotice(transcript ? "Review what CARE CONNECTED heard, then choose Use numbers. Nothing is saved yet." : "No words were heard. Try again or type the numbers.");
        setListening(false);
      };
      recognition.onerror = () => { setListening(false); setVoiceNotice("The microphone did not capture a clear reading. Try again or type it."); };
      recognition.onend = () => setListening(false);
      speechRecognitionRef.current = recognition;
      setListening(true);
      recognition.start();
    } catch {
      speechRecognitionRef.current = null;
      setListening(false);
      setVoiceNotice("Microphone input could not start. Check browser permission or type the numbers.");
    }
  }

  function useVoiceNumbers() {
    const parsed = parseSpokenReading(voiceTranscript, metric);
    if (!parsed || parsed.length !== (metric === "Blood Pressure" ? 2 : 1)) {
      setVoiceNotice(metric === "Blood Pressure" ? "I could not separate two blood-pressure numbers. Type systolic and diastolic values yourself." : "I could not confidently find one number. Type the value yourself.");
      return;
    }
    setValue(String(parsed[0]));
    setSecondValue(parsed.length === 2 ? String(parsed[1]) : "");
    setEntrySource("voice");
    setFormError("");
    setVoiceNotice("Numbers filled in for review. CARE CONNECTED will not save until you confirm the values and press Save reading.");
  }

  function handleAddReading() {
    const numericValue = Number(value);
    const numericSecondValue = Number(secondValue);

    if (!value.trim() || !Number.isFinite(numericValue) || (numericValue <= 0 && metric !== "Steps")) {
      setFormError(metric === "Steps" ? "Enter zero or a positive step count, then check it against your device." : "Enter a number greater than zero, then check it against your device.");
      return;
    }

    if (
      metric === "Blood Pressure" &&
      (!secondValue.trim() || !Number.isFinite(numericSecondValue) || numericSecondValue <= 0)
    ) {
      setFormError("Enter both blood-pressure numbers and check them against your monitor.");
      return;
    }
    if (!date || !time) { setFormError("Choose the date and time for this reading."); return; }
    const currentDateTime = `${getCurrentDate()}T${getCurrentTime()}`;
    if (`${date}T${time}` > currentDateTime) { setFormError("A health measurement cannot be dated in the future. Check the date and time."); return; }

    const ranges: Record<HealthMetric, [number, number]> = {
      "Blood Pressure": [1, 400], "Blood Glucose": [1, 3000], Pulse: [1, 350],
      "SpO₂": [1, 100], Temperature: [10, 50], Weight: [0.1, 700],
      Height: [30, 280], Sleep: [0.1, 24], Steps: [0, 300000],
    };
    const [minimum, maximum] = ranges[metric];
    if (numericValue < minimum || numericValue > maximum || (metric === "Blood Pressure" && (numericSecondValue < 1 || numericSecondValue > 400))) {
      setFormError(`Check the ${metric.toLowerCase()} value and its unit. The number is outside the entry range.`);
      return;
    }

    const duplicate = readings.some((item) => item.id !== editingId && item.metric === metric && item.date === date && item.time === time && item.value === numericValue && item.secondValue === (metric === "Blood Pressure" ? numericSecondValue : undefined));
    if (duplicate) { setFormError("The same value is already saved for this date and time. Open that entry to edit it, or check the date and numbers."); return; }

    const newReading: HealthReading = {
      id: editingId ?? `${Date.now()}`,
      metric,
      value: numericValue,
      secondValue:
        metric === "Blood Pressure"
          ? numericSecondValue
          : undefined,
      unit: selectedMetricInfo?.unit ?? "",
      date,
      time,
      note: note.trim(),
      source: entrySource,
      sourceLabel,
    };

    setReviewReading(newReading);
    setFormError("");
  }

  function saveReviewedReading() {
    if (!reviewReading) return;
    const nextReadings = editingId
      ? readings.map((reading) => reading.id === editingId ? reviewReading : reading)
      : [reviewReading, ...readings];
    if (!persist(nextReadings)) return;
    try { localStorage.setItem("carepath_last_local_save", new Date().toISOString()); } catch { /* Keep the session useful if storage is restricted. */ }
    window.dispatchEvent(new Event("carepath:refresh"));

    setSelectedMetric(reviewReading.metric);
    setShowForm(false);
    resetForm();
  }

  function startEditReading(reading: HealthReading) {
    setEditingId(reading.id);
    setReviewReading(null);
    setMetric(reading.metric);
    setValue(String(reading.value));
    setSecondValue(reading.secondValue === undefined ? "" : String(reading.secondValue));
    setDate(reading.date);
    setTime(reading.time);
    setNote(reading.note || "");
    setSourceLabel(reading.sourceLabel || "Entered by me");
    setEntrySource(reading.source || "typed");
    setFormError("");
    setVoiceNotice("");
    setShowForm(true);
  }

  function deleteReading(id: string) {
    const reading = readings.find((item) => item.id === id);
    if (!reading || !window.confirm(`Delete the ${reading.metric} entry from ${reading.date} ${reading.time}?`)) return;
    if (persist(readings.filter((item) => item.id !== id))) window.dispatchEvent(new Event("carepath:refresh"));
  }

  return (
    <div className="health-monitor-overlay">
      <div className="health-monitor-panel">
        <header className="health-monitor-header">
          <div>
            <div className="health-monitor-kicker">
              <Activity size={15} />
              CARE CONNECTED HEALTH MONITOR
            </div>

            <h2>Track your health information</h2>

            <p>
              Record measurements, view changes over time,
              and keep your health information organized.
            </p>
          </div>

          <button
            className="health-close-btn"
            onClick={onClose}
            aria-label="Close health monitor"
          >
            <X size={20} />
          </button>
        </header>

        <div className="health-monitor-toolbar">
          <div className="metric-selector">
            {metricOptions.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  className={
                    selectedMetric === item.name
                      ? "metric-chip active"
                      : "metric-chip"
                  }
                  onClick={() =>
                    setSelectedMetric(item.name)
                  }
                >
                  <Icon size={16} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          <button
            className="health-add-btn"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            <Plus size={18} />
            Log a reading
          </button>
        </div>

        <section className="health-summary-grid">
          <div className="health-summary-card">
            <span>Latest {selectedMetric}</span>

            <strong>
              {latestReading
                ? formatMetricValue(latestReading)
                : "--"}
            </strong>

            <small>
              {latestReading
                ? `${latestReading.unit} • ${latestReading.date}`
                : "No reading recorded"}
            </small>
          </div>

          <div className="health-summary-card">
            <span>{period === "ALL" ? "All-time average" : `${period} average`}</span>

            <strong>{averageValue}</strong>

            <small>
              {filteredReadings.length < 2 ? "Needs at least 2 readings" : latestReading?.unit ?? ""}
            </small>
          </div>

          <div className="health-summary-card">
            <span>Records</span>

            <strong>{filteredReadings.length}</strong>

            <small>
              {period === "ALL" ? "All saved dates" : `Last ${period.slice(0, -1)} days`}
            </small>
          </div>

          <div className="health-summary-card">
            <span>Latest vs previous</span>
            <strong>{recordedChange}</strong>
            <small>Recorded difference only · no clinical interpretation</small>
          </div>
          <div className="health-summary-card health-bmi-card">
            <span>Body mass index · derived</span>
            <strong>{calculatedBmi ?? "—"}</strong>
            <small>{calculatedBmi ? `From your latest height (${latestHeight?.value} cm) and weight (${latestWeight?.value} kg)` : "Add a height and weight entry to calculate it"}</small>
          </div>
        </section>

        <section className="health-chart-card">
          <div className="health-chart-heading">
            <div>
              <h3>{selectedMetric} trend</h3>

              <p>
                Recorded measurements over the selected
                time period.
              </p>
            </div>

            <div className="period-toggle">
              {(["7D", "30D", "90D", "ALL"] as const).map((range) => <button key={range} className={period === range ? "active" : ""} aria-pressed={period === range} onClick={() => setPeriod(range)}>{range === "ALL" ? "All" : range}</button>)}
            </div>
          </div>

          <div className="health-chart">
            {chartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={42}
                  />

                  <Tooltip formatter={(chartValue) => [`${chartValue} ${latestReading?.unit ?? ""}`, selectedMetric]} labelFormatter={(label) => `Recorded ${label}`} />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="currentColor"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />

                  {selectedMetric === "Blood Pressure" && (
                    <Line
                      type="monotone"
                      dataKey="secondary"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={{ r: 3 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-health-chart">
                <Activity size={30} />

                <strong>{readings.some((reading) => reading.metric === selectedMetric) ? `No ${selectedMetric.toLowerCase()} readings in this range` : `No ${selectedMetric.toLowerCase()} readings yet`}</strong>

                <span>
                  Add a measurement to start building
                  your trend.
                </span>
                <button type="button" className="health-empty-add" onClick={() => { resetForm(); setShowForm(true); }}>Add your first reading</button>
              </div>
            )}
          </div>

          {selectedMetric === "Blood Pressure" && (
            <div className="bp-legend">
              <span>
                <i className="legend-dot" />
                Systolic
              </span>

              <span>
                <i className="legend-line" />
                Diastolic
              </span>
            </div>
          )}
        </section>

        <section className="health-history-card">
          <div className="health-history-header">
            <div>
              <h3>
                Recent {selectedMetric} readings
              </h3>

              <p>
                Your stored measurements and notes.
              </p>
            </div>
          </div>

          <div className="health-history-list">
            {filteredReadings.length > 0 ? (
              filteredReadings
                .slice()
                .reverse()
                .map((reading) => {
                  const status =
                    getMetricStatus(reading);

                  return (
                    <article
                      className="health-reading-row"
                      key={reading.id}
                    >
                      <div className="reading-icon">
                        <Activity size={19} />
                      </div>

                      <div className="reading-main">
                        <strong>
                          {formatMetricValue(reading)}
                          <span>
                            {reading.unit}
                          </span>
                        </strong>

                        <div className="reading-meta">
                          <span>
                            <CalendarDays size={13} />
                            {reading.date}
                          </span>

                          <span>
                            <Clock3 size={13} />
                            {reading.time}
                          </span>

                          {reading.note && (
                            <span>
                              {reading.note}
                            </span>
                          )}
                          <span>{reading.sourceLabel || "Entered by you"} · {reading.source === "voice" ? "voice entry" : "manual entry"} · not clinically verified</span>
                        </div>
                      </div>

                      <div className="reading-actions">
                        <span
                          className={
                            status === "Recorded"
                              ? "reading-status"
                              : "reading-status review"
                          }
                        >
                          {status}
                        </span>

                        <button type="button" onClick={() => startEditReading(reading)} title="Edit reading" aria-label={`Edit ${reading.metric} reading from ${reading.date}`}>
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            deleteReading(reading.id)
                          }
                          title="Delete reading"
                          aria-label={`Delete ${reading.metric} reading from ${reading.date}`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </article>
                  );
                })
            ) : (
              <div className="empty-history">
                <Activity size={30} />

                <strong>
                  No data for this period
                </strong>

                <span>
                  Add a reading to see it here.
                </span>
              </div>
            )}
          </div>
        </section>

        <div className="health-safety-note">
          <HeartPulse size={20} />

          <div>
            <strong>CARE CONNECTED safety note</strong>

            <p>
              These records are for organization and
              monitoring. They are not a diagnosis.
              Unexpected or concerning measurements should
              be discussed with an appropriate healthcare
              professional, and urgent symptoms require
              urgent care.
            </p>
          </div>
        </div>

        {showForm && (
          <div className="health-form-backdrop">
            <div className="health-form-modal">
              <div className="health-form-header">
                <div>
                  <span>{editingId ? "EDIT YOUR ENTRY" : "YOUR HEALTH RECORD"}</span>

                  <h3>{editingId ? "Review an existing measurement" : "Add a measurement"}</h3>
                </div>

                <button
                  className="health-close-btn"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  aria-label="Close form"
                >
                  <X size={19} />
                </button>
              </div>

              {reviewReading && <section className="health-reading-review" role="status">
                <span>CHECK BEFORE SAVING</span>
                <strong>{formatMetricValue(reviewReading)} {reviewReading.unit}</strong>
                <p>{reviewReading.metric} · {reviewReading.date} at {reviewReading.time} · {reviewReading.sourceLabel || "Entered by you"}</p>
                {reviewReading.note && <small>Note: {reviewReading.note}</small>}
                <p>This is a record of what you entered. CARE CONNECTED does not verify the measurement or assign a risk label.</p>
              </section>}

              <fieldset className="health-measurement-fields" disabled={Boolean(reviewReading)}>
              <div className="health-voice-entry">
                <div className="health-voice-entry-copy"><strong>Speak or type your reading</strong><span>For blood pressure, say “128 over 82”. Review recognized numbers before saving.</span></div>
                <label className="health-voice-language">Voice language<select value={voiceLanguage} onChange={(event) => { const next = event.target.value as VoiceLanguage; setVoiceLanguage(next); saveVoiceLanguage(next); }}><option value="en">English</option><option value="kn">Kannada</option></select></label>
                <button type="button" className="health-voice-button" onClick={startVoiceEntry} disabled={!voiceEnabled || listening}><Mic size={17} />{listening ? "Listening…" : voiceEnabled ? "Speak reading" : "Voice off"}</button>
                {voiceTranscript && <div className="health-voice-transcript"><span><strong>Heard:</strong> {voiceTranscript}</span><button type="button" onClick={useVoiceNumbers}>Use numbers</button></div>}
                {voiceNotice && <p className="health-form-message" role="status">{voiceNotice}</p>}
                <small className="health-voice-privacy">Browser speech recognition may use your browser’s speech service. Do not speak your name or other identifying details.</small>
              </div>
              {formError && <p className="health-form-error" role="alert">{formError}</p>}

              <label>
                Measurement

                <div className="health-select-wrap">
                  <select
                    value={metric}
                    onChange={(event) =>
                      setMetric(
                        event.target
                          .value as HealthMetric,
                      )
                    }
                  >
                    {metricOptions.map((item) => (
                      <option
                        key={item.name}
                        value={item.name}
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>

                  <ChevronDown size={17} />
                </div>
              </label>

              <div
                className={
                  metric === "Blood Pressure"
                    ? "health-input-grid two"
                    : "health-input-grid"
                }
              >
                <label>
                  {metric === "Blood Pressure"
                    ? "Systolic"
                    : `Value (${selectedMetricInfo?.unit ?? ""})`}

                  <input
                    type="number"
                    step={
                      metric === "Temperature"
                        ? "0.1"
                        : "1"
                    }
                    value={value}
                    onChange={(event) =>
                      setValue(event.target.value)
                    }
                    placeholder={
                      metric === "Blood Pressure"
                        ? "e.g. 128"
                        : "Enter value"
                    }
                  />
                </label>

                {metric === "Blood Pressure" && (
                  <label>
                    Diastolic

                    <input
                      type="number"
                      value={secondValue}
                      onChange={(event) =>
                        setSecondValue(
                          event.target.value,
                        )
                      }
                      placeholder="e.g. 82"
                    />
                  </label>
                )}
              </div>

              <label className="health-source-label">Where did this reading come from?
                <select value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)}>
                  <option>My device reading (entered by me)</option>
                  <option>Copied from a report</option>
                  <option>Entered manually</option>
                  <option>Other source</option>
                </select>
              </label>

              <div className="health-input-grid two">
                <label>
                  Date

                  <input
                    type="date"
                    value={date}
                    max={getCurrentDate()}
                    onChange={(event) =>
                      setDate(event.target.value)
                    }
                  />
                </label>

                <label>
                  Time

                  <input
                    type="time"
                    value={time}
                    onChange={(event) =>
                      setTime(event.target.value)
                    }
                  />
                </label>
              </div>

              <label>
                Note

                <textarea
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                  placeholder="Optional note, e.g. fasting, after exercise..."
                  rows={3}
                />
              </label>
              </fieldset>

              <div className="health-form-actions">
                <button
                  className="secondary"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>

                {reviewReading ? <>
                  <button type="button" className="secondary" onClick={() => setReviewReading(null)}>Edit entry</button>
                  <button type="button" className="primary" onClick={saveReviewedReading}><Plus size={17} /> Confirm & save</button>
                </> : <button type="button" className="primary" onClick={handleAddReading}><Plus size={17} /> Review reading</button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

