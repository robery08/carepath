import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Droplets,
  HeartPulse,
  Mic,
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

const demoReadings: HealthReading[] = [
  {
    id: "demo-1",
    metric: "Blood Pressure",
    value: 128,
    secondValue: 82,
    unit: "mmHg",
    date: getDateOffset(0),
    time: "08:30",
    note: "Morning reading",
  },
  {
    id: "demo-2",
    metric: "Blood Pressure",
    value: 124,
    secondValue: 80,
    unit: "mmHg",
    date: getDateOffset(-1),
    time: "08:20",
    note: "Morning reading",
  },
  {
    id: "demo-3",
    metric: "Blood Pressure",
    value: 130,
    secondValue: 84,
    unit: "mmHg",
    date: getDateOffset(-2),
    time: "08:45",
    note: "Morning reading",
  },
  {
    id: "demo-4",
    metric: "Blood Pressure",
    value: 126,
    secondValue: 81,
    unit: "mmHg",
    date: getDateOffset(-3),
    time: "09:00",
    note: "Morning reading",
  },
  {
    id: "demo-5",
    metric: "Blood Glucose",
    value: 96,
    unit: "mg/dL",
    date: getDateOffset(0),
    time: "07:45",
    note: "Fasting",
  },
  {
    id: "demo-6",
    metric: "Pulse",
    value: 74,
    unit: "bpm",
    date: getDateOffset(0),
    time: "08:35",
    note: "Resting",
  },
  {
    id: "demo-7",
    metric: "SpO₂",
    value: 98,
    unit: "%",
    date: getDateOffset(0),
    time: "08:40",
    note: "Resting",
  },
  {
    id: "demo-8",
    metric: "Temperature",
    value: 36.7,
    unit: "°C",
    date: getDateOffset(0),
    time: "08:42",
    note: "Morning",
  },
  {
    id: "demo-9",
    metric: "Weight",
    value: 68.4,
    unit: "kg",
    date: getDateOffset(0),
    time: "07:30",
    note: "Morning",
  },
  {
    id: "demo-10",
    metric: "Steps",
    value: 4200,
    unit: "steps",
    date: getDateOffset(0),
    time: "08:45",
    note: "Illustrative daily count",
  },
];

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
        return parsed;
      }
    }
  } catch {
    // Use demo data when local storage is unavailable.
  }

  return demoReadings;
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
  const unitWords = /\b(?:my|the|reading|is|was|show|shows|value|blood|pressure|systolic|diastolic|glucose|sugar|pulse|heart|rate|temperature|oxygen|saturation|weight|steps|millimeters?|millimetres?|mercury|mmhg|degrees?|celsius|fahrenheit|percent|bpm|mg|dl|kg|per|of)\b/g;
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
    useState<"7D" | "30D">("7D");

  const [showForm, setShowForm] = useState(false);

  const [metric, setMetric] =
    useState<HealthMetric>("Blood Pressure");

  const [value, setValue] = useState("");
  const [secondValue, setSecondValue] = useState("");
  const [date, setDate] = useState(getCurrentDate);
  const [time, setTime] = useState(getCurrentTime);
  const [note, setNote] = useState("");
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
    const days = period === "7D" ? 7 : 30;

    return readings
      .filter((reading) => {
        const readingDate = new Date(
          `${reading.date}T${reading.time}:00`,
        );

        const difference =
          (now.getTime() - readingDate.getTime()) /
          (1000 * 60 * 60 * 24);

        return (
          reading.metric === selectedMetric &&
          difference >= -1 &&
          difference <= days
        );
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
    const values = filteredReadings.map(
      (item) => item.value,
    );

    if (!values.length) {
      return "--";
    }

    const average =
      values.reduce(
        (total, current) => total + current,
        0,
      ) / values.length;

    return average.toFixed(
      selectedMetric === "Temperature" ? 1 : 0,
    );
  }, [filteredReadings, selectedMetric]);

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
    setMetric("Blood Pressure");
    setVoiceTranscript("");
    setVoiceNotice("");
    setFormError("");
    setEntrySource("typed");
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
        setVoiceNotice(transcript ? "Review what CAREPATH heard, then choose Use numbers. Nothing is saved yet." : "No words were heard. Try again or type the numbers.");
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
    setVoiceNotice("Numbers filled in for review. CAREPATH will not save until you confirm the values and press Save reading.");
  }

  function handleAddReading() {
    const numericValue = Number(value);
    const numericSecondValue = Number(secondValue);

    if (!value.trim() || !Number.isFinite(numericValue) || numericValue <= 0) {
      setFormError("Enter a number greater than zero, then check it against your device.");
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

    const newReading: HealthReading = {
      id: `${Date.now()}`,
      metric,
      value: numericValue,
      secondValue:
        metric === "Blood Pressure"
          ? numericSecondValue
          : undefined,
      unit: selectedMetricInfo?.unit ?? "",
      date,
      time,
      note: [note.trim(), entrySource === "voice" ? "Entered using voice · user verified" : ""].filter(Boolean).join(" · "),
      source: entrySource,
    };

    if (!persist([newReading, ...readings])) return;
    try { localStorage.setItem("carepath_last_local_save", new Date().toISOString()); } catch { /* Keep the session useful if storage is restricted. */ }
    window.dispatchEvent(new Event("carepath:refresh"));

    setSelectedMetric(metric);
    setShowForm(false);
    resetForm();
  }

  function deleteReading(id: string) {
    persist(readings.filter((reading) => reading.id !== id));
  }

  return (
    <div className="health-monitor-overlay">
      <div className="health-monitor-panel">
        <header className="health-monitor-header">
          <div>
            <div className="health-monitor-kicker">
              <Activity size={15} />
              CAREPATH HEALTH MONITOR
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
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
            Add reading
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
            <span>{period} average</span>

            <strong>{averageValue}</strong>

            <small>
              {latestReading?.unit ?? ""}
            </small>
          </div>

          <div className="health-summary-card">
            <span>Records</span>

            <strong>{filteredReadings.length}</strong>

            <small>
              {period === "7D"
                ? "Last 7 days"
                : "Last 30 days"}
            </small>
          </div>

          <div className="health-summary-card">
            <span>Data status</span>

            <strong className="status-good">
              <CheckCircle2 size={20} />
              Organized
            </strong>

            <small>
              Review readings with a professional when needed
            </small>
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
              <button
                className={
                  period === "7D" ? "active" : ""
                }
                onClick={() => setPeriod("7D")}
              >
                7D
              </button>

              <button
                className={
                  period === "30D" ? "active" : ""
                }
                onClick={() => setPeriod("30D")}
              >
                30D
              </button>
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

                  <Tooltip />

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

                <strong>No readings yet</strong>

                <span>
                  Add a measurement to start building
                  your trend.
                </span>
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
                          <span>{reading.id.startsWith("demo-") ? "Sample data · example only" : reading.source === "voice" ? "Voice entered · not verified" : "Entered on this device · not verified"}</span>
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

                        <button
                          onClick={() =>
                            deleteReading(reading.id)
                          }
                          title="Delete reading"
                          aria-label="Delete reading"
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
            <strong>CAREPATH safety note</strong>

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
                  <span>NEW HEALTH READING</span>

                  <h3>Add a measurement</h3>
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

              <div className="health-voice-entry">
                <div className="health-voice-entry-copy"><strong>Say the numbers instead</strong><span>For blood pressure, say “128 over 82”. Review before anything is saved.</span></div>
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
                    : "Value"}

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

              <div className="health-input-grid two">
                <label>
                  Date

                  <input
                    type="date"
                    value={date}
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

                <button
                  className="primary"
                  onClick={handleAddReading}
                >
                  <Plus size={17} />
                  Save reading
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

