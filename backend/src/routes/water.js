import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import WaterLog from "../models/WaterLog.js";

const router = express.Router();

// Simple: just create a "manual" log with values from request (or latest)
router.post("/manual", authRequired, async (req, res) => {
  try {
    const { soilMoisture, temperature, humidity, lightIntensity } = req.body;

    const log = await WaterLog.create({
      user: req.user._id,
      soilMoisture,
      temperature,
      humidity,
      lightIntensity,
      wateredBy: "manual",
    });

    res.status(201).json({ message: "Manual watering logged", log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to log manual watering" });
  }
});

export default router;
