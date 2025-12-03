import express from "express";
import axios from "axios";
import { authRequired } from "../middleware/authMiddleware.js";
import Settings from "../models/Settings.js";
import WaterLog from "../models/WaterLog.js";

const router = express.Router();

// GET /thingspeak/latest → just latest feed from TS
router.get("/latest", authRequired, async (req, res) => {
    try {
        const settings = await Settings.findOne({ user: req.user._id });
        if (!settings || !settings.thingSpeakChannelId || !settings.thingSpeakReadApiKey) {
            return res.status(400).json({
                message: "ThingSpeak channel ID and read API key must be set in Settings.",
            });
        }

        const { thingSpeakChannelId: channelId, thingSpeakReadApiKey: readKey } =
            settings;

        const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json`;
        const tsRes = await axios.get(url, {
            params: { api_key: readKey, results: 1 },
        });

        const feed = tsRes.data.feeds?.[0];
        if (!feed) {
            return res.status(404).json({ message: "No data available from ThingSpeak." });
        }

        const latest = {
            soilMoisture: feed.field1 ? Number(feed.field1) : null,
            lightIntensity: feed.field2 ? Number(feed.field2) : null,
            temperature: feed.field3 ? Number(feed.field3) : null,
            humidity: feed.field4 ? Number(feed.field4) : null,
            pumpState: feed.field5 ? Number(feed.field5) : null,
            timestamp: feed.created_at ? new Date(feed.created_at) : new Date(),
        };

        res.json(latest);
    } catch (err) {
        console.error("GET /thingspeak/latest error:", err.response?.data || err.message);
        res.status(500).json({ message: "Failed to fetch latest ThingSpeak data." });
    }
});

// POST /thingspeak/sync-auto → import new pump=ON events as logs
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
        const clearCutoff = settings.logClearCutoff || null;

        const lastLog = await WaterLog.findOne({ user: req.user._id }).sort({
            timestamp: -1,
        });
        const lastLogTime = lastLog ? lastLog.timestamp : null;

        const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json`;
        const tsRes = await axios.get(url, {
            params: { api_key: readKey, results: 100 },
        });

        const feeds = tsRes.data.feeds || [];
        const toInsert = [];

        for (const f of feeds) {
            const createdAt = f.created_at ? new Date(f.created_at) : null;
            if (!createdAt) continue;

            // Don't resurrect logs from before last clear
            if (clearCutoff && createdAt <= clearCutoff) continue;

            // Don't duplicate already-logged entries
            if (lastLogTime && createdAt <= lastLogTime) continue;

            const pumpState = f.field5 ? Number(f.field5) : 0;
            if (pumpState !== 1) continue; // only when pump was ON

            const soilMoisture = f.field1 ? Number(f.field1) : 0;
            const lightIntensity = f.field2 ? Number(f.field2) : 0;
            const temperature = f.field3 ? Number(f.field3) : 0;
            const humidity = f.field4 ? Number(f.field4) : 0;

            const condition =
                soilMoisture >= 800
                    ? "Dry"
                    : soilMoisture <= 500
                        ? "Wet"
                        : "Good";

            toInsert.push({
                user: req.user._id,
                soilMoisture,
                lightIntensity,
                temperature,
                humidity,
                wateredBy: "automatic",
                condition,
                timestamp: createdAt,
            });
        }

        if (toInsert.length) {
            await WaterLog.insertMany(toInsert);
        }

        // Keep only latest 5 logs in DB
        const keep = 5;
        const idsToKeep = (
            await WaterLog.find({ user: req.user._id })
                .sort({ timestamp: -1 })
                .limit(keep)
                .select("_id")
        ).map((d) => d._id);

        await WaterLog.deleteMany({
            user: req.user._id,
            _id: { $nin: idsToKeep },
        });

        res.json({ message: "Sync complete", added: toInsert.length });
    } catch (err) {
        console.error("POST /thingspeak/sync-auto error:", err.response?.data || err.message);
        res.status(500).json({ message: "Failed to sync automatic logs." });
    }
});

// test: GET /api/thingspeak/ping
router.get("/ping", (req, res) => {
    res.json({ ok: true, message: "ThingSpeak routes are mounted" });
});

export default router;
