import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Droplets,
  HeartPulse,
  Plus,
  Thermometer,
  Weight,
  X,
  Zap,
} from "lucide-react";
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
};

type Props = {
  onClose: () => void;
};

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

export default function HealthMonitor({ onClose }: Props) {
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
    setReadings(nextReadings);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(nextReadings),
      );
    } catch {
      // Continue working even if local storage is unavailable.
    }
  }

  function resetForm() {
    setValue("");
    setSecondValue("");
    setDate(getCurrentDate());
    setTime(getCurrentTime());
    setNote("");
    setMetric("Blood Pressure");
  }

  function handleAddReading() {
    const numericValue = Number(value);
    const numericSecondValue = Number(secondValue);

    if (!value || Number.isNaN(numericValue)) {
      alert("Please enter a valid reading.");
      return;
    }

    if (
      metric === "Blood Pressure" &&
      (!secondValue || Number.isNaN(numericSecondValue))
    ) {
      alert(
        "Please enter both systolic and diastolic values.",
      );
      return;
    }

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
      note,
    };

    persist([newReading, ...readings]);

    setSelectedMetric(metric);
    setShowForm(false);
    resetForm();
  }

  function deleteReading(id: string) {
    persist(
      readings.filter((reading) => reading.id !== id),
    );
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
                          <span>{reading.id.startsWith("demo-") ? "Sample data" : "Entered on this device · not verified"}</span>
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

