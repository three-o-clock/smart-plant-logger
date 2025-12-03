import { useEffect, useState } from "react";
import { api } from "../api";

const ThingSpeakGraphs = () => {
  const [settings, setSettings] = useState(null);

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

  if (!settings || !settings.thingSpeakChannelId) {
    return (
      <p className="text-xs text-slate-400">
        ThingSpeak not configured. Set channel ID in Settings to see graphs.
      </p>
    );
  }

  const channelId = settings.thingSpeakChannelId;

  // Example: multi-channel chart for 4 fields
  const src = `https://thingspeak.com/channels/${channelId}/charts/1?bgcolor=%23000000&color=%23ffffff`;

  return (
    <div className="mt-4">
      <h2 className="text-sm font-semibold mb-2">ThingSpeak Graph</h2>
      <iframe
        title="ThingSpeak Chart"
        width="100%"
        height="260"
        src={src}
        frameBorder="0"
      ></iframe>
    </div>
  );
};

export default ThingSpeakGraphs;
