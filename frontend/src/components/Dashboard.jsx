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

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Plant Health Dashboard</h1>

      <NotificationBanner
        latestLog={latestLog}
        moistureThreshold={moistureThreshold}
      />

      {latestLog ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard label="Soil Moisture" value={latestLog.soilMoisture} unit="" />
          <StatCard label="Temperature" value={latestLog.temperature} unit="°C" />
          <StatCard label="Humidity" value={latestLog.humidity} unit="%" />
          <StatCard label="Light" value={latestLog.lightIntensity} unit="" />
        </div>
      ) : (
        <p className="text-sm text-slate-400 mb-4">
          No sensor data yet. Send a log from Arduino.
        </p>
      )}

      <div className="flex gap-3 mb-3">
        <button
          onClick={handleManualWater}
          disabled={watering}
          className="px-4 py-2 text-sm rounded bg-emerald-600 disabled:opacity-60"
        >
          {watering ? "Triggering..." : "Manual Watering (log + command)"}
        </button>
        <button
          onClick={handleClearLogs}
          className="px-4 py-2 text-sm rounded bg-red-700"
        >
          Clear All Logs
        </button>
      </div>

      <ThingSpeakGraphs />

      <h2 className="text-lg font-semibold mt-6 mb-2">Watering Log</h2>
      <LogsTable logs={logs} />
    </div>
  );
};

const StatCard = ({ label, value, unit }) => (
  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
    <div className="text-xs text-slate-400">{label}</div>
    <div className="text-xl font-semibold">
      {value}
      {unit && <span className="text-sm ml-1">{unit}</span>}
    </div>
  </div>
);

export default Dashboard;
