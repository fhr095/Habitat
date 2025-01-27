// src/pages/Home/components/Analytics/Dashboard.jsx
import React from 'react';
import PieChart from './PieChart';
import BarChart from './BarChart';
import ErrorBoundary from '../../../../components/ErrorBoundary'; // Ajuste o caminho conforme necessário
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h1>Dashboard de Analytics</h1>
      <div className="charts-container">
        <ErrorBoundary>
          <div className="chart-item">
            <PieChart />
          </div>
        </ErrorBoundary>
        <ErrorBoundary>
          <div className="chart-item">
            <BarChart />
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Dashboard;
