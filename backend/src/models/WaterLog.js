import mongoose from "mongoose";

const waterLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    timestamp: { type: Date, default: Date.now },
    soilMoisture: { type: Number, required: true },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    lightIntensity: { type: Number, required: true },
    wateredBy: {
      type: String,
      enum: ["automatic", "manual", "test"],
      default: "automatic",
    },
  },
  { timestamps: true }
);

const WaterLog = mongoose.model("WaterLog", waterLogSchema);
export default WaterLog;
