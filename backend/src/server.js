import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import thingSpeakRoutes from "./routes/thingspeak.js";


import authRoutes from "./routes/auth.js";
import logRoutes from "./routes/logs.js";
import settingsRoutes from "./routes/settings.js";
import waterRoutes from "./routes/water.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/water", waterRoutes);
app.use("/api/thingspeak", thingSpeakRoutes);


app.get("/", (req, res) => {
  res.send("Smart Plant Logger API running");
});

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
};

start();
