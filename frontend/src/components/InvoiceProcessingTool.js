// financial-analysis-suite-web/frontend/src/components/InvoiceProcessingTool.js
import React, { useState } from 'react';
import Plot from 'react-plotly.js'; // For Plotly charts

function InvoiceProcessingTool() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null); // 'results' will store the directly parsed JS object

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    if (!file) {
      setError('Please upload a CSV file.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/invoice_process', { // Call Flask backend
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json(); // Data is already a JS object here
      console.log("Invoice Processing API Response Data:", data); // <--- ADD THIS LINE FOR DEBUGGING
      setResults(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderTableFromPandasSplitJson = (dataObject, title) => {
    // This helper now is the primary judge of emptiness
    if (!dataObject || !dataObject.columns || !Array.isArray(dataObject.data) || dataObject.data.length === 0) {
      // It returns the 'No data' message or null if no title specified
      return <p className="info-message">No {title.toLowerCase()} data available.</p>;
    }
    
    const columns = dataObject.columns;
    const indexColName = dataObject.index_col_name || 'Index';

    return (
      <div style={{overflowX: 'auto'}}>
        <table className="results-table">
          <thead>
            <tr>
              {dataObject.index && <th>{indexColName}</th>}
              {columns.map(col => <th key={col}>{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {dataObject.data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {dataObject.index && <td>{dataObject.index[rowIndex]}</td>}
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>
                    {typeof cell === 'number' ? cell.toLocaleString() : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPlotlyFigure = (jsonString, title) => {
      // This helper now is the primary judge of emptiness for Plotly
      if (!jsonString) return null;
      const plotData = JSON.parse(jsonString); // Still need to parse as it's a JSON string from Flask
      if (!plotData || !plotData.data || plotData.data.length === 0) {
          return <p className="info-message">No {title.toLowerCase()} plot data available.</p>;
      }
      return (
          <div className="chart-container">
              <h6>{title}</h6>
              <Plot
                  data={plotData.data}
                  layout={plotData.layout}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler={true}
              />
          </div>
      );
  };


  return (
    <div className="InvoiceProcessingTool tool-section">
      <h3>🧾 Invoice Processing & Analysis</h3>
      <p className="tool-description">Upload your invoice data to perform customer segmentation, fraud detection, and budget vs. actual analysis.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="invoiceFile">Upload CSV for Invoice Processing:</label>
          <input type="file" id="invoiceFile" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
        </div>
        <button type="submit" className="calculate-button" disabled={loading}>
          {loading ? 'Processing...' : 'Process Invoices'}
        </button>
      </form>

      {error && <p className="error-message">Error: {error}</p>}

      {results && (
        <div className="results-section">
          <h4>Summary of Processed Invoices</h4>
          <p>Total Invoices Processed: <strong>{results.summary?.total_invoices}</strong></p>
          <p>Total Revenue: <strong>₹{results.summary?.total_revenue?.toLocaleString()}</strong></p>

          <h5>Customer Segmentation</h5>
          {/* Simplified conditional check */}
          {renderTableFromPandasSplitJson(JSON.parse(results.top_segments_json), "top segments")}
          {renderPlotlyFigure(results.city_revenue_fig_json, "Revenue by City")}
          {renderPlotlyFigure(results.revenue_trend_fig_json, "Monthly Revenue Trend")}

          <h5>Invoice Fraud Detection</h5>
          {renderTableFromPandasSplitJson(JSON.parse(results.suspicious_invoices_json), "suspicious invoices")}

          <h5>Extracted Invoice Entities</h5>
          {renderTableFromPandasSplitJson(JSON.parse(results.extracted_entities_json), "extracted entities")}

          <h5>Budget vs. Actual Analysis (by Job Role)</h5>
          {renderTableFromPandasSplitJson(JSON.parse(results.actual_vs_budget_json), "budget vs. actual")}

          <h5>Audit Flags for Further Review</h5>
          {renderTableFromPandasSplitJson(JSON.parse(results.audit_flags_json), "audit flags")}
        </div>
      )}
    </div>
  );
}

export default InvoiceProcessingTool;