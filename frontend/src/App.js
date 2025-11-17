import React, { useState, useEffect } from 'react';
import PredictionForm from './components/PredictionForm';
import SalesChart from './components/SalesChart';
import StatsDashboard from './components/StatsDashboard';
import { predictionAPI } from './services/api';
import './App.css';

function App() {
  const [predictions, setPredictions] = useState([]);
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    checkHealth();
    loadStats();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await predictionAPI.health();
      setHealth(response.data);
    } catch (err) {
      setHealth({ status: 'unhealthy', model_loaded: false });
    }
  };

  const loadStats = async () => {
    try {
      const response = await predictionAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleNewPrediction = (predictionResult) => {
    setPredictions(prev => [predictionResult, ...prev].slice(0, 20)); // Keep last 20 predictions
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Nike Sales Prediction Dashboard</h1>
        {health && (
          <div className={`health-status ${health.status}`}>
            Backend: {health.status} | Model: {health.model_loaded ? 'Loaded' : 'Not Loaded'}
          </div>
        )}
      </header>

      <main className="App-main">
        <div className="left-panel">
          <PredictionForm onPrediction={handleNewPrediction} />
          {stats && <StatsDashboard stats={stats} />}
        </div>

        <div className="right-panel">
          <SalesChart predictions={predictions} />
          
          {predictions.length > 0 && (
            <div className="predictions-list">
              <h3>Recent Predictions</h3>
              {predictions.map((pred, index) => (
                <div key={index} className="prediction-item">
                  <div className="prediction-header">
                    <strong>{pred.input.Product}</strong>
                    <span className="prediction-value">
                      ${pred.prediction.toFixed(2)}
                    </span>
                  </div>
                  <div className="prediction-details">
                    {pred.input.Region} • {pred.input.Retailer} • {pred.input['Sales Method']}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;