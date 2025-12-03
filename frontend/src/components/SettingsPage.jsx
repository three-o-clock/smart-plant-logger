import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

const SettingsPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // 👈 add toast state

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings");
        setSettings(res.data);
      } catch (err) {
        console.error(err);
        setToast({
          type: "error",
          message: "Failed to load settings.",
        });
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]:
        name === "moistureThreshold" || name === "lightThreshold"
          ? Number(value)
          : value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.put("/settings", settings);
      setSettings(res.data);
      setToast({
        type: "success",
        message: "Settings saved.",
      });
    } catch (err) {
      console.error(err);
      setToast({
        type: "error",
        message: "Settings did not save.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <p className="text-sm text-slate-600">Loading settings...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold mb-2">Settings</h1>

      <div className="mb-2 text-sm">
        <p>
          <span className="font-semibold">Logged in as:</span> {user.name} (
          {user.email})
        </p>
      </div>

      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs mb-1">
            Moisture Threshold (for low moisture warning)
          </label>
          <input
            type="number"
            name="moistureThreshold"
            value={settings.moistureThreshold ?? ""}
            onChange={handleChange}
            className="w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded"
          />
        </div>

        <div>
          <label className="block text-xs mb-1">
            Light Threshold (for automatic watering logic reference)
          </label>
          <input
            type="number"
            name="lightThreshold"
            value={settings.lightThreshold ?? ""}
            onChange={handleChange}
            className="w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded"
          />
        </div>

        <div>
          <label className="block text-xs mb-1">ThingSpeak Channel ID</label>
          <input
            type="text"
            name="thingSpeakChannelId"
            value={settings.thingSpeakChannelId ?? ""}
            onChange={handleChange}
            className="w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded"
          />
        </div>

        <div>
          <label className="block text-xs mb-1">ThingSpeak Read API Key</label>
          <input
            type="text"
            name="thingSpeakReadApiKey"
            value={settings.thingSpeakReadApiKey ?? ""}
            onChange={handleChange}
            className="w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded"
          />
        </div>

        <div>
          <label className="block text-xs mb-1">ThingSpeak Write API Key</label>
          <input
            type="text"
            name="thingSpeakWriteApiKey"
            value={settings.thingSpeakWriteApiKey ?? ""}
            onChange={handleChange}
            className="w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-emerald-600 text-white rounded text-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

// Top-center animated toast, same style as Dashboard
const Toast = ({ toast, onClose }) => {
  const [show, setShow] = useState(false);

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

  useEffect(() => {
    if (!show && toast) {
      const timer = setTimeout(() => {
        onClose?.();
      }, 200);
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

  const motion = show
    ? "opacity-100 translate-y-0"
    : "opacity-0 -translate-y-4";

  return (
    <div className={`${base} ${styles} ${motion}`}>
      <div className="mt-0.5">{toast?.type === "error" ? "⚠️" : "✅"}</div>
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

export default SettingsPage;
