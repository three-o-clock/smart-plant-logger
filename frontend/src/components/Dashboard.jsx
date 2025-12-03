import { useEffect, useState } from "react";
import { api } from "../api";
import LogsTable from "./LogsTable.jsx";
import NotificationBanner from "./NotificationBanner.jsx";
import ThingSpeakGraphs from "./ThingSpeakGraphs.jsx";

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watering, setWatering] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, settingsRes] = await Promise.all([
        api.get("/logs"),
        api.get("/settings"),
      ]);
      setLogs(logsRes.data);
      setSettings(settingsRes.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const latestLog = logs[0] || null;
  const moistureThreshold = settings?.moistureThreshold ?? 30;

  const handleManualWater = async () => {
    if (!latestLog) {
      alert("No latest sensor reading available to log.");
      return;
    }
    try {
      setWatering(true);
      await api.post("/water/manual", {
        soilMoisture: latestLog.soilMoisture,
        temperature: latestLog.temperature,
        humidity: latestLog.humidity,
        lightIntensity: latestLog.lightIntensity,
      });
      await fetchData();
      alert("Manual watering logged. (Wire this to pump via Arduino.)");
    } catch (err) {
      console.error(err);
      alert("Failed to trigger manual watering");
    } finally {
      setWatering(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm("Clear all watering logs?")) return;
    try {
      await api.delete("/logs");
      setLogs([]);
    } catch (err) {
      console.error(err);
      alert("Failed to clear logs");
    }
  };

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
            Plant Health Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor live readings and keep a complete log of every watering event.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleManualWater}
            disabled={watering}
            className="px-4 py-2 text-xs rounded-full bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {watering ? "Logging..." : "Manual Watering"}
          </button>
          <button
            onClick={handleClearLogs}
            className="px-4 py-2 text-xs rounded-full bg-red-600 text-white hover:bg-red-500"
          >
            Clear Logs
          </button>
        </div>
      </div>

      {/* NEW: Plant health summary card */}
      <PlantHealthCard latestLog={latestLog} settings={settings} />

      <NotificationBanner
        latestLog={latestLog}
        moistureThreshold={moistureThreshold}
      />

      {/* Stats row */}
      {latestLog ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Soil Moisture"
            value={latestLog.soilMoisture}
            unit=""
            accent="emerald"
          />
          <StatCard
            label="Light (LDR)"
            value={latestLog.lightIntensity}
            unit=""
            accent="amber"
          />
          <StatCard
            label="Temperature"
            value={latestLog.temperature}
            unit="°C"
            accent="sky"
          />
          <StatCard
            label="Humidity"
            value={latestLog.humidity}
            unit="%"
            accent="violet"
          />
        </div>
      ) : (
        <div className="text-xs text-slate-500">
          No sensor data yet. Send logs from your Arduino to populate this.
        </div>
      )}

      {/* Graph + summary cards */}
      <div className="grid lg:grid-cols-[1.2fr,1fr] gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            ThingSpeak Visualizations
          </h2>
          <ThingSpeakGraphs />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            Recent Watering Summary
          </h2>
          <p className="text-xs text-slate-500 mb-2">
            Total events:{" "}
            <span className="text-emerald-600 font-semibold">
              {logs.length}
            </span>
          </p>
          <div className="max-h-[260px] overflow-y-auto">
            <LogsTable logs={logs} />
          </div>
        </div>
      </div>

      {/* Full log table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 mb-2">
          Complete Watering Log
        </h2>
        <LogsTable logs={logs} />
      </div>
    </div>
  );
};

/* ---------- Plant Health Card ---------- */

const PlantHealthCard = ({ latestLog, settings }) => {
  if (!latestLog) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-700">
            Plant Health
          </div>
          <div className="text-xs text-slate-500 mt-1">
            No sensor data yet. Health status will appear once readings are
            received.
          </div>
        </div>
        <span className="px-3 py-1 text-[11px] rounded-full bg-slate-200 text-slate-700">
          Unknown
        </span>
      </div>
    );
  }

  const moistureThreshold = settings?.moistureThreshold ?? 30;
  const lightThreshold = settings?.lightThreshold ?? 400;

  const { soilMoisture, temperature, humidity, lightIntensity } = latestLog;

  const issues = [];

  // Simple heuristics – you can tweak these if your plant type is different
  if (soilMoisture < moistureThreshold) {
    issues.push("Low soil moisture");
  }
  if (lightIntensity < lightThreshold) {
    issues.push("Low light");
  }
  if (temperature < 18 || temperature > 32) {
    issues.push("Temperature not ideal");
  }
  if (humidity < 35 || humidity > 80) {
    issues.push("Humidity not ideal");
  }

  let status = "Good";
  let badgeClasses = "bg-emerald-500 text-white";
  let cardClasses = "bg-emerald-50 border-emerald-200";
  let description = "Your plant looks healthy based on the latest readings.";

  if (issues.length === 1) {
    status = "Fair";
    badgeClasses = "bg-amber-500 text-white";
    cardClasses = "bg-amber-50 border-amber-200";
    description = "One parameter needs attention. Consider checking soon.";
  } else if (issues.length >= 2) {
    status = "Poor";
    badgeClasses = "bg-red-500 text-white";
    cardClasses = "bg-red-50 border-red-200";
    description = "Multiple parameters are out of range. Check the plant now.";
  }

  return (
    <div
      className={`rounded-xl p-3 border flex items-start justify-between gap-3 ${cardClasses}`}
    >
      <div>
        <div className="text-xs font-semibold text-slate-800">
          Plant Health
        </div>
        <div className="text-xs text-slate-600 mt-1">{description}</div>
        {issues.length > 0 && (
          <ul className="mt-2 text-[11px] text-slate-700 list-disc list-inside space-y-0.5">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        )}
        {issues.length === 0 && (
          <div className="mt-2 text-[11px] text-slate-600">
            Moisture, light, temperature and humidity are all in acceptable
            ranges.
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <span
          className={`px-3 py-1 text-[11px] rounded-full font-medium ${badgeClasses}`}
        >
          {status}
        </span>
        <div className="text-[10px] text-slate-600 text-right">
          Last update:{" "}
          {new Date(latestLog.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};

/* ---------- Stat card ---------- */

const StatCard = ({ label, value, unit, accent = "emerald" }) => {
  const accentClass =
    accent === "emerald"
      ? "text-emerald-600"
      : accent === "amber"
      ? "text-amber-600"
      : accent === "sky"
      ? "text-sky-600"
      : "text-violet-600";

  const dotClass =
    accent === "emerald"
      ? "bg-emerald-500"
      : accent === "amber"
      ? "bg-amber-400"
      : accent === "sky"
      ? "bg-sky-400"
      : "bg-violet-500";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-slate-500">{label}</span>
        <span className={`h-2 w-2 rounded-full ${dotClass}`}></span>
      </div>
      <div className={`text-xl font-semibold ${accentClass}`}>
        {value}
        {unit && <span className="text-xs text-slate-500 ml-1">{unit}</span>}
      </div>
    </div>
  );
};

export default Dashboard;
