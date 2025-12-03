import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

const SettingsPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings");
        setSettings(res.data);
      } catch (err) {
        console.error(err);
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
      alert("Settings saved");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <p>Loading settings...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>

      <div className="mb-4 text-sm">
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
            className="w-full px-2 py-1 text-sm bg-white border border-slate-700 rounded"
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
            className="w-full px-2 py-1 text-sm bg-white border border-slate-700 rounded"
          />
        </div>

        <div>
          <label className="block text-xs mb-1">ThingSpeak Channel ID</label>
          <input
            type="text"
            name="thingSpeakChannelId"
            value={settings.thingSpeakChannelId ?? ""}
            onChange={handleChange}
            className="w-full px-2 py-1 text-sm bg-white border border-slate-700 rounded"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-emerald-600 rounded text-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
