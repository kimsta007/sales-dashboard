// App.js
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import './App.css';

const App = () => {
  const [salesData, setSalesData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [featureImportance, setFeatureImportance] = useState({});
  const [selectedYear, setSelectedYear] = useState(2021);
  const [loading, setLoading] = useState(false);

  // Fetch historical data
  useEffect(() => {
    fetch('http://localhost:8000/api/sales-data')
      .then(response => response.json())
      .then(data => setSalesData(data));
  }, []);

  // Fetch predictions when year changes
  useEffect(() => {
    predictSales();
  }, [selectedYear]);

  const predictSales = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/predict-sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ year: selectedYear }),
      });
      const data = await response.json();
      setPredictions(data.predictions);
      setFeatureImportance(data.feature_importance);
    } catch (error) {
      console.error('Error predicting sales:', error);
    }
    setLoading(false);
  };

  // Prepare data for visualizations
  const monthlySales = salesData.reduce((acc, item) => {
    const month = new Date(item['Invoice Date']).getMonth();
    acc[month] = (acc[month] || 0) + item['Total Sales'];
    return acc;
  }, {});

  const monthlyData = Object.keys(monthlySales).map(month => ({
    month: parseInt(month) + 1,
    actual: monthlySales[month],
    predicted: predictions.find(p => p.month === parseInt(month) + 1)?.predicted_sales || 0
  }));

  const productSales = salesData.reduce((acc, item) => {
    acc[item.Product] = (acc[item.Product] || 0) + item['Total Sales'];
    return acc;
  }, {});

  const productData = Object.keys(productSales).map(product => ({
    name: product,
    value: productSales[product]
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Shoe Sales Analytics Dashboard</h1>
        <div className="controls">
          <label>
            Predict Sales for Year:
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              <option value={2021}>2021</option>
              <option value={2022}>2022</option>
              <option value={2023}>2023</option>
            </select>
          </label>
          <button onClick={predictSales} disabled={loading}>
            {loading ? 'Predicting...' : 'Refresh Predictions'}
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Sales Prediction Chart */}
        <div className="chart-container">
          <h2>Monthly Sales Prediction vs Actual</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="#8884d8" name="Actual Sales" />
              <Line type="monotone" dataKey="predicted" stroke="#82ca9d" name="Predicted Sales" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Product Sales Distribution */}
        <div className="chart-container">
          <h2>Product Sales Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {productData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Feature Importance */}
        <div className="chart-container">
          <h2>Feature Importance in Prediction</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={Object.entries(featureImportance).map(([feature, importance]) => ({
                feature,
                importance
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="feature" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="importance" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Regional Sales Map */}
        <div className="chart-container">
          <h2>Regional Sales Distribution</h2>
          <div style={{ width: '100%', height: '300px' }}>
            <ComposableMap>
              <Geographies geography="/path/to/your/us-topojson.json">
                {({ geographies }) =>
                  geographies.map(geo => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#DDD"
                      stroke="#FFF"
                    />
                  ))
                }
              </Geographies>
            </ComposableMap>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;