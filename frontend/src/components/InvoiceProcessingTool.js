// financial-analysis-suite-web/frontend/src/components/InvoiceProcessingTool.js
import React, { useState } from 'react';
import Plot from 'react-plotly.js'; // For Plotly charts

function InvoiceProcessingTool() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

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

      const data = await response.json();
      setResults(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render a table from pandas orient='split' JSON (receives JSON string)
  const renderTableFromPandasSplitJson = (jsonString, title) => {
    if (!jsonString) {
      console.warn(`renderTableFromPandasSplitJson: jsonString is null or undefined for ${title}`);
      return <p className="info-message">No {title.toLowerCase()} data available or data format is incorrect (input missing).</p>;
    }

    let dataObject;
    try {
      dataObject = JSON.parse(jsonString); // CRITICAL CHANGE: Parse the JSON string here
    } catch (e) {
      console.error(`Error parsing JSON string for ${title} table:`, e, jsonString);
      return <p className="error-message">Error parsing data for {title.toLowerCase()}.</p>;
    }

    // REVISED LINE FOR ESLINT no-mixed-operators: Explicitly group OR conditions
    if ((!dataObject) || (!dataObject.columns) || (!Array.isArray(dataObject.data)) || (dataObject.data.length === 0)) {
        console.warn(`renderTableFromPandasSplitJson: Data object is empty or malformed for ${title}`, dataObject);
        return <p className="info-message">No {title.toLowerCase()} data available or data format is incorrect.</p>;
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

  // Helper to render Plotly figures (receives JSON string)
  const renderPlotlyFigure = (jsonString, title) => {
      if (!jsonString) {
          console.warn(`renderPlotlyFigure: jsonString is null or undefined for ${title}`);
          return <p className="info-message">No {title.toLowerCase()} plot data available (input missing).</p>;
      }
      let plotData;
      try {
          plotData = JSON.parse(jsonString); // CRITICAL: Parse the JSON string here
      } catch (e) {
          console.error(`Error parsing JSON string for ${title} plot:`, e, jsonString);
          return <p className="error-message">Error parsing plot data for {title.toLowerCase()}.</p>;
      }
      if (!plotData || !plotData.data || plotData.data.length === 0) {
          console.warn(`renderPlotlyFigure: Plot data object is empty or malformed for ${title}`, plotData);
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
          {renderTableFromPandasSplitJson(results.top_segments_json, "top segments")}
          {renderPlotlyFigure(results.city_revenue_fig_json, "Revenue by City")}
          {renderPlotlyFigure(results.revenue_trend_fig_json, "Monthly Revenue Trend")}

          <h5>Invoice Fraud Detection</h5>
          {renderTableFromPandasSplitJson(results.suspicious_invoices_json, "suspicious invoices")}

          <h5>Extracted Invoice Entities</h5>
          {renderTableFromPandasSplitJson(results.extracted_entities_json, "extracted entities")}

          <h5>Budget vs. Actual Analysis (by Job Role)</h5>
          {renderTableFromPandasSplitJson(results.actual_vs_budget_json, "budget vs. actual")}

          <h5>Audit Flags for Further Review</h5>
          {renderTableFromPandasSplitJson(results.audit_flags_json, "audit flags")}
        </div>
      )}
    </div>
  );
}

export default InvoiceProcessingTool;
