import mongoose from "mongoose";

const WaterLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    soilMoisture: { type: Number, required: true },
    lightIntensity: { type: Number, required: true },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },

    wateredBy: {
      type: String,
      enum: ["automatic", "manual"],
      default: "automatic",
    },

    // optional: for “Dry / Wet / Good” label
    condition: { type: String },
    timestamp: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("WaterLog", WaterLogSchema);
