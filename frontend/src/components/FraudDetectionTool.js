// financial-analysis-suite-web/frontend/src/components/FraudDetectionTool.js
import React, { useState } from 'react';

function FraudDetectionTool() {
  const [file, setFile] = useState(null);
  const [contamination, setContamination] = useState(0.01);
  const [dateColumnName, setDateColumnName] = useState('TransactionDate');
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

    // REVISED ESLINT-PROOF CHECKS
    if (!dataObject) {
      console.warn(`renderTableFromPandasSplitJson: dataObject is null/undefined after parsing for ${title}`);
      return <p className="info-message">No {title.toLowerCase()} data available or data format is incorrect (parsed object missing).</p>;
    }
    if (!dataObject.columns) {
      console.warn(`renderTableFromPandasSplitJson: dataObject.columns is missing for ${title}`, dataObject);
      return <p className="info-message">No {title.toLowerCase()} data available or data format is incorrect (missing columns info).</p>;
    }
    if (!Array.isArray(dataObject.data)) {
      console.warn(`renderTableFromPandasSplitJson: dataObject.data is not an array for ${title}`, dataObject);
      return <p className="error-message">Data for {title.toLowerCase()} is not in expected array format.</p>;
    }
    if (dataObject.data.length === 0) {
      console.warn(`renderTableFromPandasSplitJson: dataObject.data array is empty for ${title}`, dataObject);
      return <p className="info-message">No {title.toLowerCase()} data available.</p>;
    }
    // END REVISED ESLINT-PROOF CHECKS
    
    const processedRows = dataObject.data.map((row, rowIndex) => {
        const newRow = [];
        if (dataObject.index && dataObject.index[rowIndex] !== undefined) {
            newRow.push(dataObject.index[rowIndex]);
        }
        row.forEach(cell => newRow.push(cell));
        return newRow;
    });

    const columns = dataObject.columns;
    const headerCells = [];
    if (dataObject.index) {
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
          {/* Pass the JSON string to be parsed inside helper */}
          {results.anomalies_data_json && (
            renderTableFromPandasSplitJson(results.anomalies_data_json, "anomalies")
          ) }
          {/* Conditional message if no anomalies are found */}
          {!results.anomalies_data_json || 
           (JSON.parse(results.anomalies_data_json).data && JSON.parse(results.anomalies_data_json).data.length === 0) ?
            <p className="info-message">No anomalies detected.</p> : null
          }


          {/* Display plots (Matplotlib base64 images - no JSON.parse needed) */}
          {results.plot_images && Object.keys(results.plot_images).length > 0 && (
            <div>
              <h5>Visualizations</h5>
              {Object.entries(results.plot_images).map(([key, base64Image]) => (
                <div key={key} className="chart-container">
                  <h6>{key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1)}</h6>
                  <img src={`data:image/png;base64,${base64Image}`} alt={key} />
                </div>
              ))}
            </div>
          )}
          {!results.plot_images || Object.keys(results.plot_images).length === 0 ?
             <p className="info-message">No visualization plots available.</p> : null
          }


          {results.anomaly_summary && (
            <div>
              <h5>Anomaly Summary</h5>
              {Array.isArray(results.anomaly_summary) && results.anomaly_summary.map((line, index) => <p key={index}>{line}</p>)}
            </div>
          )}
          {!results.anomaly_summary || !Array.isArray(results.anomaly_summary) || results.anomaly_summary.length === 0 ?
              <p className="info-message">No anomaly summary available.</p> : null
          }

          {/* Pass the JSON string to be parsed inside helper */}
          {results.top_anomalies_data_json && (
            <div>
              <h5>Top Anomalies</h5>
              {renderTableFromPandasSplitJson(results.top_anomalies_data_json, "top anomalies")}
            </div>
          )}
          {!results.top_anomalies_data_json || 
           (JSON.parse(results.top_anomalies_data_json).data && JSON.parse(results.top_anomalies_data_json).data.length === 0) ?
              <p className="info-message">No top anomalies detected.</p> : null
          }

        </div>
      )}
    </div>
  );
}

export default FraudDetectionTool;
