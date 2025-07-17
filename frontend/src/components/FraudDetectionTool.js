// financial-analysis-suite-web/frontend/src/components/FraudDetectionTool.js
import React, { useState } from 'react';

function FraudDetectionTool() {
  const [file, setFile] = useState(null);
  const [contamination, setContamination] = useState(0.01);
  const [dateColumnName, setDateColumnName] = useState('TransactionDate');
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
    formData.append('contamination', contamination);
    formData.append('date_column_name', dateColumnName);

    try {
      const response = await fetch('/api/fraud', { // Call Flask backend
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json(); // Data is already a JS object here
      setResults(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render a table from pandas orient='split' JSON (now takes JS object)
  const renderTableFromPandasSplitJson = (dataObject, title) => { // Renamed param
    // Add defensive checks for dataObject and its properties
    if (!dataObject || !dataObject.columns || !Array.isArray(dataObject.data)) { // Ensure data is an array
      return <p className="info-message">No {title.toLowerCase()} data available or data format is incorrect.</p>;
    }
    if (dataObject.data.length === 0) { // Check length after confirming it's an array
        return <p className="info-message">No {title.toLowerCase()} data available.</p>;
    }
    
    // Assuming dataObject.index contains the index values and dataObject.data contains the row values
    const processedRows = dataObject.data.map((row, rowIndex) => {
        const newRow = [];
        // Add index value as the first cell if it exists
        if (dataObject.index && dataObject.index[rowIndex] !== undefined) {
            newRow.push(dataObject.index[rowIndex]);
        }
        // Add actual row data
        row.forEach(cell => newRow.push(cell));
        return newRow;
    });

    // Create column headers
    const columns = dataObject.columns;
    const headerCells = [];
    if (dataObject.index) { // If there's an index, add a header for it
      headerCells.push(<th key="index_header">{dataObject.index_col_name || "Index"}</th>);
    }
    headerCells.push(...columns.map(col => <th key={col}>{col}</th>));


    return (
      <div style={{overflowX: 'auto'}}>
        <table className="results-table">
          <thead>
            <tr>
              {headerCells}
            </tr>
          </thead>
          <tbody>
            {processedRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
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


  return (
    <div className="FraudDetectionTool tool-section">
      <h3>🕵️‍♂️ Fraud Detection</h3>
      <p className="tool-description">Upload your transaction data to identify suspicious anomalies.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fraudFile">Upload CSV for Fraud Detection:</label>
          <input type="file" id="fraudFile" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
        </div>
        <div className="form-group">
          <label htmlFor="fraudContamination">Anomaly Detection Sensitivity (Contamination):</label>
          <input type="number" id="fraudContamination" value={contamination} onChange={(e) => setContamination(parseFloat(e.target.value))} step="0.001" min="0.001" max="0.1" />
        </div>
        <div className="form-group">
          <label htmlFor="fraudDateCol">Primary Date Column (Optional):</label>
          <input type="text" id="fraudDateCol" value={dateColumnName} onChange={(e) => setDateColumnName(e.target.value)} />
        </div>
        <button type="submit" className="calculate-button" disabled={loading}>
          {loading ? 'Detecting Fraud...' : 'Run Fraud Detection'}
        </button>
      </form>

      {error && <p className="error-message">Error: {error}</p>}

      {results && (
        <div className="results-section">
          <h4>Detected Anomalies</h4>
          {/* Add more robust checks for anomalies_data_json before accessing .data.length */}
          {results.anomalies_data_json && results.anomalies_data_json.data && results.anomalies_data_json.data.length > 0 ? (
            renderTableFromPandasSplitJson(results.anomalies_data_json, "anomalies")
          ) : (
            <p className="info-message">No anomalies detected.</p>
          )}

          {/* Display plots - check if plot_images exists AND has keys */}
          {results.plot_images && Object.keys(results.plot_images).length > 0 && (
            <div>
              <h5>Visualizations</h5>
              {Object.entries(results.plot_images).map(([key, base64Image]) => (
                <div key={key} className="chart-container">
                  {/* Basic title formatting */}
                  <h6>{key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1)}</h6> 
                  <img src={`data:image/png;base64,${base64Image}`} alt={key} />
                </div>
              ))}
            </div>
          )}

          {results.anomaly_summary && ( // Check if anomaly_summary exists
            <div>
              <h5>Anomaly Summary</h5>
              {/* Ensure anomaly_summary is an array before mapping */}
              {Array.isArray(results.anomaly_summary) && results.anomaly_summary.map((line, index) => <p key={index}>{line}</p>)}
            </div>
          )}
          {/* Add more robust checks for top_anomalies_data_json before accessing .data.length */}
          {results.top_anomalies_data_json && results.top_anomalies_data_json.data && results.top_anomalies_data_json.data.length > 0 && (
            <div>
              <h5>Top Anomalies</h5>
              {renderTableFromPandasSplitJson(results.top_anomalies_data_json, "top anomalies")}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default FraudDetectionTool;