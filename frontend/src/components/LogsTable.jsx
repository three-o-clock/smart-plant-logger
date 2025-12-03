const LogsTable = ({ logs, moistureThreshold }) => {
  if (!logs.length) {
    return <p className="text-sm text-slate-500">No watering logs yet.</p>;
  }

  const getCondition = (soilMoisture) => {
  if (soilMoisture === undefined || soilMoisture === null) {
    return {
      label: "N/A",
      classes: "bg-slate-100 text-slate-600 border border-slate-200",
    };
  }

  if (typeof moistureThreshold !== "number" || isNaN(moistureThreshold)) {
    return {
      label: `${soilMoisture}`,
      classes: "bg-slate-100 text-slate-600 border border-slate-200",
    };
  }

  if (soilMoisture >= moistureThreshold) {
    return {
      label: "Dry",
      classes: "bg-red-50 text-red-700 border border-red-200",
    };
  }

  return {
    label: "Wet",
    classes: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };
};


  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-xs md:text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-2 py-2 text-left font-semibold text-slate-700">
              Time
            </th>
            <th className="px-2 py-2 text-left font-semibold text-slate-700">
              Moisture
            </th>
            <th className="px-2 py-2 text-left font-semibold text-slate-700">
              Condition
            </th>
            <th className="px-2 py-2 text-left font-semibold text-slate-700">
              Temp (°C)
            </th>
            <th className="px-2 py-2 text-left font-semibold text-slate-700">
              Humidity (%)
            </th>
            <th className="px-2 py-2 text-left font-semibold text-slate-700">
              Light
            </th>
            <th className="px-2 py-2 text-left font-semibold text-slate-700">
              Mode
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const cond = getCondition(log.soilMoisture);

            return (
              <tr
                key={log._id}
                className="border-t border-slate-200 hover:bg-slate-50/80"
              >
                <td className="px-2 py-2 text-slate-700">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-2 py-2 text-slate-700">
                  {log.soilMoisture}
                </td>
                <td className="px-2 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] ${cond.classes}`}>
                    {cond.label}
                  </span>
                </td>
                <td className="px-2 py-2 text-slate-700">
                  {log.temperature}
                </td>
                <td className="px-2 py-2 text-slate-700">
                  {log.humidity}
                </td>
                <td className="px-2 py-2 text-slate-700">
                  {log.lightIntensity}
                </td>
                <td className="px-2 py-2 text-slate-700 capitalize">
                  {log.wateredBy}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LogsTable;
