import React, { useState, useEffect } from 'react';
import { predictionAPI } from '../services/api';

const PredictionForm = ({ onPrediction }) => {
  const [formData, setFormData] = useState({
    'Invoice Date': new Date().toISOString().split('T')[0],
    'Product': '',
    'Region': '',
    'Retailer': '',
    'Sales Method': '',
    'State': '',
    'Price per Unit': '',
    'Units Sold': ''
  });
  
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      const response = await predictionAPI.getFeatures();
      setFeatures(response.data);
      
      // Set default values
      setFormData(prev => ({
        ...prev,
        'Product': response.data.Product?.[0] || '',
        'Region': response.data.Region?.[0] || '',
        'Retailer': response.data.Retailer?.[0] || '',
        'Sales Method': response.data['Sales Method']?.[0] || '',
        'State': response.data.State?.[0] || ''
      }));
    } catch (err) {
      setError('Failed to load features');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await predictionAPI.predict({
        ...formData,
        'Price per Unit': parseFloat(formData['Price per Unit']),
        'Units Sold': parseInt(formData['Units Sold'])
      });
      
      onPrediction({
        input: formData,
        prediction: response.data.prediction
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prediction-form">
      <h2>Sales Prediction</h2>
      
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              name="Invoice Date"
              value={formData['Invoice Date']}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Product:</label>
            <select
              name="Product"
              value={formData.Product}
              onChange={handleChange}
              required
            >
              {features.Product?.map(product => (
                <option key={product} value={product}>{product}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Region:</label>
            <select
              name="Region"
              value={formData.Region}
              onChange={handleChange}
              required
            >
              {features.Region?.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Retailer:</label>
            <select
              name="Retailer"
              value={formData.Retailer}
              onChange={handleChange}
              required
            >
              {features.Retailer?.map(retailer => (
                <option key={retailer} value={retailer}>{retailer}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Sales Method:</label>
            <select
              name="Sales Method"
              value={formData['Sales Method']}
              onChange={handleChange}
              required
            >
              {features['Sales Method']?.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>State:</label>
            <select
              name="State"
              value={formData.State}
              onChange={handleChange}
              required
            >
              {features.State?.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Price per Unit ($):</label>
            <input
              type="number"
              step="0.01"
              name="Price per Unit"
              value={formData['Price per Unit']}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Units Sold:</label>
            <input
              type="number"
              name="Units Sold"
              value={formData['Units Sold']}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Predicting...' : 'Predict Sales'}
        </button>
      </form>
    </div>
  );
};

export default PredictionForm;