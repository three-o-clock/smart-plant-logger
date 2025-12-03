import express from "express";
import WaterLog from "../models/WaterLog.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all logs for current user (latest first)
router.get("/", authRequired, async (req, res) => {
  const logs = await WaterLog.find({ user: req.user._id }).sort({ timestamp: -1 });
  res.json(logs);
});

// Create log (Arduino or manual)
router.post("/", authRequired, async (req, res) => {
  try {
    const {
      soilMoisture,
      temperature,
      humidity,
      lightIntensity,
      wateredBy = "automatic",
    } = req.body;

    if (
      soilMoisture == null ||
      temperature == null ||
      humidity == null ||
      lightIntensity == null
    ) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const log = await WaterLog.create({
      user: req.user._id,
      soilMoisture,
      temperature,
      humidity,
      lightIntensity,
      wateredBy,
    });

    res.status(201).json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create log" });
  }
});

// Clear all logs
router.delete("/", authRequired, async (req, res) => {
  await WaterLog.deleteMany({ user: req.user._id });
  res.json({ message: "All logs cleared" });
});

export default router;
