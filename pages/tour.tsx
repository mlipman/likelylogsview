import React, {useState, useEffect} from "react";
import {LineChart, Line, XAxis, YAxis, ResponsiveContainer} from "recharts";

const TourProgress = () => {
  const imageUrl = "https://www.nm.org/image/doctor/NPI/1467957688.jpg";
  const [progress, setProgress] = useState(0);
  const [checkboxes, setCheckboxes] = useState(Array(36).fill(false));

  const handleCheckboxChange = (index: number) => {
    const newCheckboxes = [...checkboxes];
    newCheckboxes[index] = !newCheckboxes[index];
    setCheckboxes(newCheckboxes);
  };

  useEffect(() => {
    const checkedCount = checkboxes.filter(Boolean).length;
    setProgress(checkedCount / 36);
  }, [checkboxes]);

  const graphData = [
    {km: 0, elevation: 405},
    {km: 50, elevation: 2035},
    {km: 70, elevation: 1860},
    {km: 100, elevation: 1376},
    {km: 139.6, elevation: 1413},
  ];
  const currentPosition = progress * 139.6;

  // Calculate the current elevation based on progress
  const currentElevation = (() => {
    for (let i = 0; i < graphData.length - 1; i++) {
      const curr = graphData[i];
      const next = graphData[i + 1];
      if (currentPosition >= curr.km && currentPosition < next.km) {
        const ratio = (currentPosition - curr.km) / (next.km - curr.km);
        return curr.elevation + (next.elevation - curr.elevation) * ratio;
      }
    }
    // If we're at the very end, return the last elevation
    return graphData[graphData.length - 1].elevation;
  })();

  // Calculate the position as percentages
  const xPercentage = (currentPosition / 139.6) * 100 + 20;
  const yPercentage = ((2035 - currentElevation) / (2035 - 405)) * -100 + 120;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Tour de France Stage Progress</h1>
      <div className="mb-4">
        {[0, 1, 2].map((boxIndex) => (
          <div key={boxIndex} className="mb-2">
            <h2 className="font-semibold">Checkpoint {boxIndex + 1}</h2>
            <div className="flex flex-wrap">
              {Array(12)
                .fill(false)
                .map((_, i) => {
                  const checkboxIndex = boxIndex * 12 + i;
                  return (
                    <label key={i} className="mr-2 mb-1">
                      <input
                        type="checkbox"
                        checked={checkboxes[checkboxIndex]}
                        onChange={() => handleCheckboxChange(checkboxIndex)}
                        className="mr-1"
                      />
                    </label>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      <div className="h-64 mb-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={graphData}>
            <XAxis dataKey="km" />
            <YAxis domain={[405, 2035]} />
            <Line
              type="linear"
              dataKey="elevation"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{r: 4}}
            />
          </LineChart>
        </ResponsiveContainer>
        <img
          src={imageUrl}
          alt="Progress Marker"
          className="absolute w-8 h-8 transition-all duration-300 ease-in-out"
          style={{
            left: `${xPercentage}%`,
            bottom: `${yPercentage}%`,
            transform: "translate(-50%, 50%)",
          }}
        />
      </div>
      <div className="text-center">
        Progress: {(progress * 100).toFixed(2)}% - {currentPosition.toFixed(1)}{" "}
        km
      </div>
    </div>
  );
};

export default TourProgress;
