import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import WaterLog from "../models/WaterLog.js";
import Settings from "../models/Settings.js";
import axios from "axios";

const router = express.Router();

router.post("/manual", authRequired, async (req, res) => {
  try {
    const settings = await Settings.findOne({ user: req.user._id });

    if (
      !settings ||
      !settings.thingSpeakChannelId ||
      !settings.thingSpeakReadApiKey
    ) {
      return res.status(400).json({
        message: "ThingSpeak channel ID and read API key must be set in Settings.",
      });
    }

    const channelId = settings.thingSpeakChannelId;
    const readKey = settings.thingSpeakReadApiKey;

    // 1) Fetch latest feed entry from ThingSpeak
    const feedUrl = `https://api.thingspeak.com/channels/${channelId}/feeds.json`;
    const feedRes = await axios.get(feedUrl, {
      params: { api_key: readKey, results: 1 },
    });

    const feeds = feedRes.data.feeds || [];
    if (feeds.length === 0) {
      return res.status(400).json({
        message: "No ThingSpeak feed data available to log.",
      });
    }

    const feed = feeds[0];

    const soilMoisture = feed.field1 ? Number(feed.field1) : 0;
    const lightIntensity = feed.field2 ? Number(feed.field2) : 0;
    const temperature = feed.field3 ? Number(feed.field3) : 0;
    const humidity = feed.field4 ? Number(feed.field4) : 0;

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

    // 3) Send "button pressed" command to ThingSpeak (field6 = 1)
    if (settings.thingSpeakWriteApiKey) {
      const updateUrl = "https://api.thingspeak.com/update.json";
      await axios.post(updateUrl, null, {
        params: {
          api_key: settings.thingSpeakWriteApiKey,
          field6: 1,
        },
      });
    }

    res
      .status(201)
      .json({ message: "Manual watering logged & command sent", log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to log manual watering" });
  }
});

export default router;
