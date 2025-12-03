const LogsTable = ({ logs }) => {
  if (!logs.length) {
    return <p className="text-sm text-slate-400">No watering logs yet.</p>;
  }

  return (
    <div className="overflow-x-auto border border-slate-800 rounded-lg mt-4">
      <table className="w-full text-sm">
        <thead className="bg-slate-900">
          <tr>
            <th className="px-2 py-1 text-left">Time</th>
            <th className="px-2 py-1 text-left">Moisture</th>
            <th className="px-2 py-1 text-left">Temp (°C)</th>
            <th className="px-2 py-1 text-left">Humidity (%)</th>
            <th className="px-2 py-1 text-left">Light</th>
            <th className="px-2 py-1 text-left">Mode</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log._id} className="border-t border-slate-800">
              <td className="px-2 py-1">
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td className="px-2 py-1">{log.soilMoisture}</td>
              <td className="px-2 py-1">{log.temperature}</td>
              <td className="px-2 py-1">{log.humidity}</td>
              <td className="px-2 py-1">{log.lightIntensity}</td>
              <td className="px-2 py-1">{log.wateredBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LogsTable;
