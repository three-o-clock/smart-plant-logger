import express from "express";
import { authRequired } from "../middleware/authMiddleware.js";
import Settings from "../models/Settings.js";

const router = express.Router();

// Get settings for current user
router.get("/", authRequired, async (req, res) => {
  let settings = await Settings.findOne({ user: req.user._id });
  if (!settings) {
    settings = await Settings.create({ user: req.user._id });
  }
  res.json(settings);
});

// Update settings
router.put("/", authRequired, async (req, res) => {
  const updates = req.body;
  const settings = await Settings.findOneAndUpdate(
    { user: req.user._id },
    updates,
    { new: true, upsert: true }
  );
  res.json(settings);
});

export default router;
