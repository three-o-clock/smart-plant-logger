import { useEffect, useState } from "react";
import { api } from "../api";
import LogsTable from "./LogsTable.jsx";
import NotificationBanner from "./NotificationBanner.jsx";
import ThingSpeakGraphs from "./ThingSpeakGraphs.jsx";

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveReading, setLiveReading] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, settingsRes] = await Promise.all([
        api.get("/logs"), // backend should already limit to 5
        api.get("/settings"),
      ]);
      setLogs(logsRes.data || []);
      setSettings(settingsRes.data || null);
    } catch (err) {
      console.error("fetchData error:", err);
      setToast({
        type: "error",
        message: "Failed to load dashboard data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      // 1) latest live reading from ThingSpeak
      const latestRes = await api.get("/thingspeak/latest");
      setLiveReading(latestRes.data);

      // 2) sync automatic logs into DB
      await api.post("/thingspeak/sync-auto");

      // 3) reload logs/settings
      await fetchData();

      setToast({
        type: "success",
        message: "Dashboard updated with latest ThingSpeak data.",
      });
    } catch (err) {
      console.error("Refresh error:", err.response?.data || err.message);
      setToast({
        type: "error",
        message:
          err.response?.data?.message ||
          "Failed to refresh from ThingSpeak. Please try again.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearLogs = async () => {
    const ok = window.confirm(
      "Clear all watering logs?\n\nThis cannot be undone. Logs cannot be retrieved once cleared."
    );
    if (!ok) return;

    try {
      const res = await api.delete("/logs");
      setLogs([]);
      setToast({
        type: "success",
        message:
          res.data?.message || "All watering logs have been permanently cleared.",
      });
    } catch (err) {
      console.error("Clear logs error:", err);
      setToast({
        type: "error",
        message:
          err.response?.data?.message ||
          "Failed to clear logs from the database.",
      });
    }
  };

  const latestLog = logs[0] || null;
  const latestReading = liveReading || latestLog || null;
  const moistureThreshold = settings?.moistureThreshold ?? 30;

  if (loading) {
    return (
      <div className="p-4 text-sm text-slate-600">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
            Plant Health Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automatically logged watering events and live readings from your smart
            plant.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 text-xs rounded-full border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh from ThingSpeak"}
          </button>
          <button
            onClick={handleClearLogs}
            className="px-4 py-2 text-xs rounded-full bg-red-600 text-white hover:bg-red-500"
          >
            Clear Logs
          </button>
        </div>
      </div>

      {/* Plant health + notification */}
      <PlantHealthCard latestReading={latestReading} settings={settings} />
      <NotificationBanner
        latestLog={latestReading}
        moistureThreshold={moistureThreshold}
      />

      {/* Stat cards */}
      {latestReading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Soil Moisture"
            value={latestReading.soilMoisture}
            unit=""
            accent="emerald"
          />
          <StatCard
            label="Light (LDR)"
            value={latestReading.lightIntensity}
            unit=""
            accent="amber"
          />
          <StatCard
            label="Temperature"
            value={latestReading.temperature}
            unit="°C"
            accent="sky"
          />
          <StatCard
            label="Humidity"
            value={latestReading.humidity}
            unit="%"
            accent="violet"
          />
        </div>
      ) : (
        <div className="text-xs text-slate-500">
          No data yet. Use Refresh to pull the latest values from ThingSpeak.
        </div>
      )}

      {/* Graphs + stats */}
      <div className="grid lg:grid-cols-[1.2fr,1fr] gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            ThingSpeak Visualizations
          </h2>
          <ThingSpeakGraphs />
        </div>

        <WateringStatsCard logs={logs} />
      </div>

      {/* Complete log table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 mb-2">
          Complete Watering Log
        </h2>
        <LogsTable logs={logs} moistureThreshold={moistureThreshold} />
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

/* ---------- Plant Health Card ---------- */

const PlantHealthCard = ({ latestReading }) => {
  if (!latestReading) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
        <div className="text-xs font-semibold text-slate-700">Plant Health</div>
        <div className="text-xs text-slate-500 mt-1">
          No data yet. Refresh to pull the latest sensor values.
        </div>
      </div>
    );
  }

  const { soilMoisture, lightIntensity, temperature, humidity, timestamp } =
    latestReading;

  let status = "Good";
  let description = "Moisture level is within optimal range.";
  let badgeClasses = "bg-emerald-600 text-white";
  let cardClasses = "bg-emerald-50 border-emerald-200";

  // Soil-based logic ONLY
  if (soilMoisture >= 800) {
    status = "Dry";
    description = "Soil is dry — watering required.";
    badgeClasses = "bg-red-600 text-white";
    cardClasses = "bg-red-50 border-red-200";
  } else if (soilMoisture <= 500) {
    status = "Wet";
    description = "Soil is too wet — reduce watering.";
    badgeClasses = "bg-sky-600 text-white";
    cardClasses = "bg-sky-50 border-sky-200";
  }

  return (
    <div className={`rounded-xl p-3 border flex items-start justify-between gap-3 ${cardClasses}`}>
      <div>
        <div className="text-xs font-semibold text-slate-800">Plant Health</div>
        <div className="text-xs text-slate-600 mt-1">{description}</div>
        <div className="mt-2 text-[11px] text-slate-700">
          Soil Moisture: <span className="font-semibold">{soilMoisture}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`px-3 py-1 text-[11px] rounded-full font-medium ${badgeClasses}`}>
          {status}
        </span>
        {timestamp && (
          <div className="text-[10px] text-slate-600">
            Updated:{" "}
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
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

/* ---------- Watering stats card ---------- */

const WateringStatsCard = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 mb-1">
          Watering Stats
        </h2>
        <p className="text-xs text-slate-500">
          No watering events recorded yet.
        </p>
      </div>
    );
  }

  const last = logs[0];
  const now = new Date();

  const wateredToday = logs.filter((log) => {
    const d = new Date(log.timestamp);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }).length;

  const moistures = logs
    .map((l) => l.soilMoisture)
    .filter((m) => m !== null && m !== undefined);

  const avgMoisture =
    moistures.reduce((sum, m) => sum + m, 0) /
    (moistures.length || 1);
  const minMoisture = moistures.length ? Math.min(...moistures) : 0;
  const maxMoisture = moistures.length ? Math.max(...moistures) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-800 mb-2">
        Watering Stats
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">
            Last watered
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800">
              {new Date(last.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 capitalize">
              {last.wateredBy}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">
            Watered today
          </div>
          <div className="text-sm font-semibold text-emerald-600">
            {wateredToday}{" "}
            <span className="text-[11px] text-slate-500 font-normal">
              event{wateredToday === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">
            Avg moisture at watering
          </div>
          <div className="text-sm font-semibold text-sky-600">
            {avgMoisture.toFixed(0)}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">
            Min / Max moisture
          </div>
          <div className="text-sm font-semibold text-violet-600">
            {minMoisture}{" "}
            <span className="text-[11px] text-slate-400 mx-1">•</span>
            {maxMoisture}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Toast ---------- */

const Toast = ({ toast, onClose }) => {
  const [show, setShow] = useState(false);

  // When a new toast comes in, show it and auto-hide after 3.5s
  useEffect(() => {
    if (toast) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
      }, 3500);

      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [toast]);

  // After the hide animation finishes, actually clear the toast state
  useEffect(() => {
    if (!show && toast) {
      const timer = setTimeout(() => {
        onClose?.();
      }, 200); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [show, toast, onClose]);

  if (!toast && !show) return null;

  const base =
  "fixed top-4 right-4 z-50 max-w-sm rounded-xl shadow-lg px-4 py-3 text-sm flex items-start gap-3 border transform transition-all duration-300 ease-out";


  const styles =
    toast?.type === "error"
      ? "bg-red-50 border-red-200 text-red-800"
      : "bg-emerald-50 border-emerald-200 text-emerald-800";

  const motion = show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4";

  return (
    <div className={`${base} ${styles} ${motion}`}>
      <div className="mt-0.5">
        {toast?.type === "error" ? "⚠️" : "✅"}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-xs mb-0.5">
          {toast?.title ||
            (toast?.type === "error" ? "Something went wrong" : "Success")}
        </div>
        <div>{toast?.message}</div>
      </div>
      <button
        onClick={() => setShow(false)}
        className="ml-2 text-xs text-slate-500 hover:text-slate-700"
      >
        ✕
      </button>
    </div>
  );
};


export default Dashboard;
