import { useEffect, useState } from "react";
import { api } from "../api";

// Order: Temperature first (default), then others
const GRAPH_CONFIGS = [
  {
    field: 3,
    title: "Temperature",
  },
  {
    field: 1,
    title: "Soil Moisture",
  },
  {
    field: 2,
    title: "Light",
  },
  {
    field: 4,
    title: "Humidity",
  },
];

const ThingSpeakGraphs = () => {
  const [settings, setSettings] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0); // 0 = Temperature

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
      <p className="text-xs text-slate-500">
        ThingSpeak not configured. Set your channel ID in Settings to see graphs.
      </p>
    );
  }

  const channelId = settings.thingSpeakChannelId;
  const graph = GRAPH_CONFIGS[currentIndex];

  const commonParams =
    "&bgcolor=%23ffffff&color=%230000ff&dynamic=true&results=50";
  const src = `https://thingspeak.com/channels/${channelId}/charts/${graph.field}?title=${encodeURIComponent(
    graph.title
  )}${commonParams}`;

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? GRAPH_CONFIGS.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === GRAPH_CONFIGS.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-xs font-semibold text-slate-700">
            {GRAPH_CONFIGS[currentIndex].title}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="h-7 w-7 flex items-center justify-center rounded-full border border-slate-300 text-xs text-slate-700 hover:bg-slate-100"
          >
            ◀
          </button>
          <button
            onClick={handleNext}
            className="h-7 w-7 flex items-center justify-center rounded-full border border-slate-300 text-xs text-slate-700 hover:bg-slate-100"
          >
            ▶
          </button>
        </div>
      </div>

<div className="flex justify-center">
      <div className="rounded-xl overflow-hidden border border-slate-200">
        <iframe
          title={graph.title}
          width="500"
          height="250"
          src={src}
        ></iframe>
      </div>
      </div>
    </div>
  );
};

export default ThingSpeakGraphs;
