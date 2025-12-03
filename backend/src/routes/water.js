import express from "express";
import axios from "axios";
import { authRequired } from "../middleware/authMiddleware.js";
import Settings from "../models/Settings.js";
import WaterLog from "../models/WaterLog.js";

const router = express.Router();

/**
 * POST /api/water/manual
 * - Fetch latest sensor data from ThingSpeak (fields 1–4, 5)
 * - Create a WaterLog in Mongo (wateredBy: "manual")
 * - Send field6 = 1 to ThingSpeak (manual command for Arduino)
 */
router.post("/manual", authRequired, async (req, res) => {
  try {
    const settings = await Settings.findOne({ user: req.user._id });

    if (
      !settings ||
      !settings.thingSpeakChannelId ||
      !settings.thingSpeakReadApiKey ||
      !settings.thingSpeakWriteApiKey
    ) {
      return res.status(400).json({
        message:
          "ThingSpeak channel ID, read API key, and write API key must be set in Settings.",
      });
    }

    const channelId = settings.thingSpeakChannelId;
    const readKey = settings.thingSpeakReadApiKey;
    const writeKey = settings.thingSpeakWriteApiKey;

    // 1) Fetch latest feed from ThingSpeak for logging
    const feedUrl = `https://api.thingspeak.com/channels/${channelId}/feeds.json`;
    console.log("[WATER/MANUAL] Fetching latest feed from:", feedUrl);

    const feedRes = await axios.get(feedUrl, {
      params: { api_key: readKey, results: 1 },
    });

    const feeds = feedRes.data.feeds || [];
    if (!feeds.length) {
      return res.status(400).json({
        message: "No ThingSpeak feed data available to log.",
      });
    }

    const feed = feeds[0];

    const soilMoisture = feed.field1 ? Number(feed.field1) : 0;
    const lightIntensity = feed.field2 ? Number(feed.field2) : 0;
    const temperature = feed.field3 ? Number(feed.field3) : 0;
    const humidity = feed.field4 ? Number(feed.field4) : 0;
    const pumpStateTs = feed.field5 ? Number(feed.field5) : 0;

    console.log("[WATER/MANUAL] Latest TS reading:", {
      soilMoisture,
      lightIntensity,
      temperature,
      humidity,
      pumpStateTs,
      created_at: feed.created_at,
    });

    // 2) Create a log in Mongo
    const log = await WaterLog.create({
      user: req.user._id,
      soilMoisture,
      temperature,
      humidity,
      lightIntensity,
      wateredBy: "manual",
      timestamp: feed.created_at ? new Date(feed.created_at) : new Date(),
    });

    console.log("[WATER/MANUAL] WaterLog created with id:", log._id);

    // 3) Send "button pressed" command to ThingSpeak (field6 = 1)
    const updateUrl = "https://api.thingspeak.com/update.json";
    console.log("[WATER/MANUAL] Sending field6=1 to ThingSpeak via:", updateUrl);

    const tsResp = await axios.post(updateUrl, null, {
      params: {
        api_key: writeKey,
        field6: 1,
      },
    });

    console.log("[WATER/MANUAL] ThingSpeak update response:", tsResp.data);

    // ThingSpeak returns 0 if rate-limited or failed
    if (tsResp.data === 0 || tsResp.data === "0") {
      return res.status(429).json({
        message:
          "ThingSpeak rejected the update (likely rate limit: 15s). Please wait a bit and try again.",
        log,
      });
    }

    return res.status(201).json({
      message: "Manual watering logged & command sent to ThingSpeak.",
      log,
      thingspeakEntryId: tsResp.data,
    });
  } catch (err) {
    console.error("[WATER/MANUAL] Error:", err.response?.data || err.message);
    return res.status(500).json({
      message: "Failed to log manual watering or send to ThingSpeak.",
      error: err.response?.data || err.message,
    });
  }
});

export default router;
