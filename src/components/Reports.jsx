import React, { useState, useEffect, useRef } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);

const Reports = () => {
  const [detectionsData, setDetectionsData] = useState(null);
  const mainDivRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const jsonData = JSON.parse(event.target.result);
      setDetectionsData(jsonData);
    };

    reader.readAsText(file);
  };

  useEffect(() => {
    if (mainDivRef.current) {
      console.log("Main Div Dimensions and Position:", {
        width: mainDivRef.current.offsetWidth,
        height: mainDivRef.current.offsetHeight,
        top: mainDivRef.current.offsetTop,
        left: mainDivRef.current.offsetLeft,
      });
    }
  }, [detectionsData]);

  const groupDetectionsById = () => {
    const groupedData = detectionsData.reduce((acc, detection) => {
      const { id } = detection;
      if (!acc[id]) {
        acc[id] = { id, detections: 0 };
      }
      acc[id].detections += 1;
      return acc;
    }, {});

    return Object.values(groupedData).sort((a, b) => b.detections - a.detections);
  };

  const generateDetectionCountChart = () => {
    const groupedData = groupDetectionsById();
    const data = {
      labels: groupedData.map(d => d.id),
      datasets: [{
        label: 'Number of Detections per ID (Pareto)',
        data: groupedData.map(d => d.detections),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        barPercentage: 0.7,
      }],
    };

    const options = {
        maintainAspectRatio: false,  // Assegura que o canvas respeite as dimensões do contêiner
        responsive: true,  // Garante que o gráfico seja responsivo
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 14,
              },
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0,0,0,0.7)',
            titleFont: {
              size: 16,
            },
            bodyFont: {
              size: 14,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              font: {
                size: 12,
              },
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              font: {
                size: 12,
              },
            },
          },
        },
        layout: {
          padding: {
            top: 20,
            bottom: 20,
          },
        },
      };
      
    return <Bar data={data} options={options} />;
  };

  const generateConsecutiveDetectionsChart = () => {
    const groupedData = detectionsData.reduce((acc, detection, index, array) => {
      const { id } = detection;
      if (!acc[id]) {
        acc[id] = { id, consecutiveDetections: 0, lastSeenIndex: index };
      } else {
        if (acc[id].lastSeenIndex === index - 1) {
          acc[id].consecutiveDetections += 1;
        } else {
          acc[id].consecutiveDetections = 1;
        }
        acc[id].lastSeenIndex = index;
      }
      return acc;
    }, {});

    const sortedData = Object.values(groupedData).sort((a, b) => b.consecutiveDetections - a.consecutiveDetections);
    const data = {
      labels: sortedData.map(d => d.id),
      datasets: [{
        label: 'Consecutive Detections Over Time (Pareto)',
        data: sortedData.map(d => d.consecutiveDetections),
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
        tension: 0.4,
      }],
    };

    const options = {
        maintainAspectRatio: false,  // Assegura que o canvas respeite as dimensões do contêiner
        responsive: true,  // Garante que o gráfico seja responsivo
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 14,
              },
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0,0,0,0.7)',
            titleFont: {
              size: 16,
            },
            bodyFont: {
              size: 14,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              font: {
                size: 12,
              },
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              font: {
                size: 12,
              },
            },
          },
        },
        layout: {
          padding: {
            top: 20,
            bottom: 20,
          },
        },
      };
      

    return <Line data={data} options={options} />;
  };

  return (
    <div ref={mainDivRef} className="main-div">
      <h1>Reports</h1>
      <input type="file" onChange={handleFileUpload} accept=".json" />
      {detectionsData && (
        <>
          <div className="chart-container">
            <h2>Detection Count per ID (Pareto)</h2>
            {generateDetectionCountChart()}
          </div>
          <div className="chart-container">
            <h2>Consecutive Detections Over Time (Pareto)</h2>
            {generateConsecutiveDetectionsChart()}
          </div>
        </>
      )}
    </div>
  );
  
};

export default Reports;
