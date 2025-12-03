import express from "express";
import axios from "axios";
import { authRequired } from "../middleware/authMiddleware.js";
import Settings from "../models/Settings.js";
import WaterLog from "../models/WaterLog.js";

const router = express.Router();

/**
 * GET /api/thingspeak/latest
 * Returns latest reading from ThingSpeak (no logging).
 */
router.get("/latest", authRequired, async (req, res) => {
  try {
    const settings = await Settings.findOne({ user: req.user._id });

    if (!settings || !settings.thingSpeakChannelId || !settings.thingSpeakReadApiKey) {
      return res.status(400).json({
        message: "ThingSpeak channel ID and read API key must be set in Settings.",
      });
    }

    const channelId = settings.thingSpeakChannelId;
    const readKey = settings.thingSpeakReadApiKey;

    const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json`;
    const resp = await axios.get(url, {
      params: { api_key: readKey, results: 1 },
    });

    const feeds = resp.data.feeds || [];
    if (!feeds.length) {
      return res.status(404).json({ message: "No ThingSpeak data found." });
    }

    const f = feeds[0];

    const reading = {
      soilMoisture: f.field1 ? Number(f.field1) : 0,
      lightIntensity: f.field2 ? Number(f.field2) : 0,
      temperature: f.field3 ? Number(f.field3) : 0,
      humidity: f.field4 ? Number(f.field4) : 0,
      pumpState: f.field5 ? Number(f.field5) : 0,
      buttonState: f.field6 ? Number(f.field6) : 0,
      timestamp: f.created_at ? new Date(f.created_at) : new Date(),
    };

    res.json(reading);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch ThingSpeak latest reading" });
  }
});

/**
 * POST /api/thingspeak/sync-auto
 * Syncs automatic watering events from ThingSpeak into WaterLog.
 * Looks at recent feeds where field5 == 1 (pump ON) and creates logs
 * for any feeds newer than the last existing log.
 */
router.post("/sync-auto", authRequired, async (req, res) => {
  try {
    const settings = await Settings.findOne({ user: req.user._id });

    if (!settings || !settings.thingSpeakChannelId || !settings.thingSpeakReadApiKey) {
      return res.status(400).json({
        message: "ThingSpeak channel ID and read API key must be set in Settings.",
      });
    }

    const channelId = settings.thingSpeakChannelId;
    const readKey = settings.thingSpeakReadApiKey;

    const lastLog = await WaterLog.findOne({ user: req.user._id }).sort({
      timestamp: -1,
    });

    const lastTime = lastLog ? lastLog.timestamp : null;

    const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json`;
    const resp = await axios.get(url, {
      params: { api_key: readKey, results: 100 },
    });

    const feeds = resp.data.feeds || [];
    const toInsert = [];

    for (const f of feeds) {
      const createdAt = f.created_at ? new Date(f.created_at) : null;
      if (!createdAt) continue;
      if (lastTime && createdAt <= lastTime) continue;

      const pumpState = f.field5 ? Number(f.field5) : 0;
      if (pumpState !== 1) continue; // only when pump is ON

      const soilMoisture = f.field1 ? Number(f.field1) : 0;
      const lightIntensity = f.field2 ? Number(f.field2) : 0;
      const temperature = f.field3 ? Number(f.field3) : 0;
      const humidity = f.field4 ? Number(f.field4) : 0;

      toInsert.push({
        user: req.user._id,
        soilMoisture,
        temperature,
        humidity,
        lightIntensity,
        wateredBy: "automatic",
        timestamp: createdAt,
      });
    }

    if (toInsert.length) {
      await WaterLog.insertMany(toInsert);
    }

    res.json({ message: "Sync complete", added: toInsert.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to sync automatic logs" });
  }
});

export default router;
