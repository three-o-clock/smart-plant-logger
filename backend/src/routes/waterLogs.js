import express from "express";
import WaterLog from "../models/WaterLog.js";

const router = express.Router();

// Get latest 5 logs
router.get("/", async (req, res) => {
  const logs = await WaterLog.find().sort({ createdAt: -1 }).limit(5);
  res.json(logs);
});

// Add new log
router.post("/", async (req, res) => {
  try {
    const log = await WaterLog.create(req.body);
    res.status(201).json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create log" });
  }
});

// Clear logs
router.delete("/", async (req, res) => {
  await WaterLog.deleteMany({});
  res.json({ message: "Logs cleared" });
});

export default router;
