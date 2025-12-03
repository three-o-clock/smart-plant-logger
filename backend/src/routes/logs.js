import express from "express";
import WaterLog from "../models/WaterLog.js";
import Settings from "../models/Settings.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /logs  → latest 5 logs for this user
router.get("/", authRequired, async (req, res) => {
  try {
    const logs = await WaterLog.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .limit(5);

    res.json(logs);
  } catch (err) {
    console.error("GET /logs error:", err);
    res.status(500).json({ message: "Failed to fetch logs." });
  }
});

// DELETE /logs → clear logs + set cutoff so they don't come back on sync
router.delete("/", authRequired, async (req, res) => {
  try {
    await WaterLog.deleteMany({ user: req.user._id });

    await Settings.findOneAndUpdate(
      { user: req.user._id },
      { $set: { logClearCutoff: new Date() } },
      { upsert: true }
    );

    res.json({ message: "All watering logs cleared." });
  } catch (err) {
    console.error("DELETE /logs error:", err);
    res.status(500).json({ message: "Failed to clear logs from database." });
  }
});

export default router;
