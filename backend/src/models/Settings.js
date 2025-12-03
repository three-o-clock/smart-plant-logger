import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    moistureThreshold: { type: Number, default: 30 },
    lightThreshold: { type: Number, default: 400 },
    thingSpeakChannelId: { type: String },
    thingSpeakReadApiKey: { type: String },
    thingSpeakWriteApiKey: { type: String }, // if you want to send commands
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
