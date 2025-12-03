const NotificationBanner = ({ latestLog, moistureThreshold }) => {
  if (!latestLog) return null;
  if (latestLog.soilMoisture >= moistureThreshold) return null;

  return (
    <div className="mb-4 p-3 rounded-lg bg-red-900/60 border border-red-500 text-sm">
      ⚠️ Soil moisture is low ({latestLog.soilMoisture}) – below threshold{" "}
      {moistureThreshold}. Plant might need water.
    </div>
  );
};

export default NotificationBanner;
