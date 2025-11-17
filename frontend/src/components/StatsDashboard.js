import React from 'react';

const StatsDashboard = ({ stats }) => {
  if (!stats) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="stats-dashboard">
      <h3>Dataset Overview</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{formatNumber(stats.total_records)}</div>
          <div className="stat-label">Total Records</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(stats.total_sales)}</div>
          <div className="stat-label">Total Sales</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(stats.average_sale)}</div>
          <div className="stat-label">Average Sale</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{formatNumber(stats.products)}</div>
          <div className="stat-label">Products</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{formatNumber(stats.regions)}</div>
          <div className="stat-label">Regions</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{formatNumber(stats.retailers)}</div>
          <div className="stat-label">Retailers</div>
        </div>
      </div>
      
      {stats.date_range && (
        <div className="date-range">
          <strong>Date Range:</strong> {stats.date_range.start} to {stats.date_range.end}
        </div>
      )}
    </div>
  );
};

export default StatsDashboard;