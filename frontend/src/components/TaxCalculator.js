// financial-analysis-suite-web/frontend/src/components/TaxCalculator.js
import React, { useState } from 'react';
import Plot from 'react-plotly.js'; // For Plotly charts

function TaxCalculator() {
  const [income, setIncome] = useState(750000);
  const [deductions, setDeductions] = useState(150000);
  const [year, setYear] = useState(2024);
  const [taxResult, setTaxResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [taxPlotData, setTaxPlotData] = useState(null); // For Plotly chart data

  const calculateTax = async () => {
    setLoading(true);
    setError(null);
    setTaxResult(null);
    setTaxPlotData(null);
    try {
      // Calls your Flask backend. Vercel routes '/api' to your backend.
      // During local development, if React is on port 3000 and Flask is on 5000,
      // you might need a proxy setup in package.json or use full URL 'http://localhost:5000/api/tax_calculate'
      const response = await fetch('/api/tax_calculate', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ income, deductions, year }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTaxResult(data);

      // Prepare Plotly data if breakdown exists
      if (data.tax_breakdown && data.tax_breakdown.length > 0) {
        const plotLayout = {
          title: 'Tax Contribution per Slab',
          xaxis: { 
            title: 'Tax Slab', 
            categoryorder: 'array', 
            categoryarray: data.tax_breakdown.map(d => d.slab_range) 
          },
          yaxis: { title: 'Tax Amount (₹)' },
          height: 400,
          barmode: 'stack', 
          plot_bgcolor: 'white',
          paper_bgcolor: 'white', // Ensure background is white
          margin: { l: 50, r: 50, t: 70, b: 50 } // Adjust margins
        };
        const plotTrace = {
          x: data.tax_breakdown.map(d => d.slab_range),
          y: data.tax_breakdown.map(d => d.tax_in_segment),
          type: 'bar',
          marker: {
            color: data.tax_breakdown.map(d => {
              // Simple color mapping based on rate for visual distinction
              if (d.rate === "0.0%") return '#4CAF50'; // Green
              if (d.rate === "5.0%") return '#FFC107'; // Amber
              if (d.rate === "20.0%") return '#FF5722'; // Deep Orange
              if (d.rate === "30.0%") return '#F44336'; // Red
              return '#9E9E9E'; // Grey fallback
            })
          },
          name: 'Tax Amount (₹)'
        };
        setTaxPlotData({ data: [plotTrace], layout: plotLayout });
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="TaxCalculator tool-section">
      <h3>💰 Tax Compliance Calculator (India)</h3>
      <p className="tool-description">Estimate your income tax liability based on gross income and deductions.</p>
      
      <div className="form-group">
        <label htmlFor="income">Gross Annual Income (₹):</label>
        <input type="number" id="income" value={income} onChange={(e) => setIncome(parseFloat(e.target.value))} />
      </div>
      <div className="form-group">
        <label htmlFor="deductions">Eligible Deductions (₹):</label>
        <input type="number" id="deductions" value={deductions} onChange={(e) => setDeductions(parseFloat(e.target.value))} />
      </div>
      <div className="form-group">
        <label htmlFor="taxYear">Tax Year:</label>
        <select id="taxYear" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
          <option value={2024}>2024</option>
          <option value={2023}>2023</option>
        </select>
      </div>
      <button className="calculate-button" onClick={calculateTax} disabled={loading}>
        {loading ? 'Calculating...' : 'Calculate Tax Liability'}
      </button>

      {error && <p className="error-message">Error: {error}</p>}

      {taxResult && (
        <div className="results-section">
          <h4>Summary of Tax Calculation</h4>
          <p><strong>Gross Annual Income:</strong> ₹{taxResult.gross_income?.toLocaleString()}</p>
          <p><strong>Total Eligible Deductions:</strong> ₹{taxResult.total_deductions?.toLocaleString()}</p>
          <p><strong>Taxable Income:</strong> ₹{taxResult.taxable_income?.toLocaleString()}</p>
          <p><strong>Tax Before Cess:</strong> ₹{taxResult.tax_before_cess?.toLocaleString()}</p>
          <p><strong>Health & Education Cess (4%):</strong> ₹{taxResult.cess?.toLocaleString()}</p>
          <p><strong>Total Tax Liability:</strong> ₹{taxResult.total_tax_liability?.toLocaleString()}</p>

          <h4>Tax Slab Breakdown</h4>
          {taxResult.tax_breakdown && taxResult.tax_breakdown.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Slab Range</th>
                  <th>Amount in Slab</th>
                  <th>Rate</th>
                  <th>Tax in Segment</th>
                </tr>
              </thead>
              <tbody>
                {taxResult.tax_breakdown.map((item, index) => (
                  <tr key={index}>
                    <td>{item.slab_range}</td>
                    <td>{item.amount_in_slab?.toLocaleString()}</td> {/* Format with toLocaleString */}
                    <td>{item.rate}</td>
                    <td>{item.tax_in_segment?.toLocaleString()}</td> {/* Format with toLocaleString */}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="info-message">No tax liability calculated for the given income and deductions.</p>
          )}

          {taxPlotData && (
            <div className="chart-container">
              <Plot
                data={taxPlotData.data}
                layout={taxPlotData.layout}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true} // Makes the plot responsive
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TaxCalculator;