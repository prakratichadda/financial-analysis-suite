// financial-analysis-suite-web/frontend/src/components/FinancialForecastingTool.js
import React, { useState } from 'react';
import Plot from 'react-plotly.js'; // For Plotly charts

function FinancialForecastingTool() {
  const [file, setFile] = useState(null);
  const [targetColumn, setTargetColumn] = useState('target_sales');
  const [dateColumn, setDateColumn] = useState('Date');
  const [forecastMonths, setForecastMonths] = useState(12);
  const [contamination, setContamination] = useState(0.01);
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
    formData.append('target_column', targetColumn);
    formData.append('date_column', dateColumn);
    formData.append('forecast_months', forecastMonths);
    formData.append('contamination', contamination);

    try {
      const response = await fetch('/api/forecast', { // Call Flask backend
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json(); // Assuming error response is JSON
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json(); // Data is already a JS object here
      console.log("Financial Forecasting API Response Data:", data); // KEEP THIS LOG FOR YOUR DEBUGGING
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
      dataObject = JSON.parse(jsonString); // <--- CRITICAL CHANGE: Parse the JSON string here
    } catch (e) {
      console.error(`Error parsing JSON string for ${title} table:`, e, jsonString);
      return <p className="error-message">Error parsing data for {title.toLowerCase()}.</p>;
    }

    if (!dataObject || !dataObject.columns || !Array.isArray(dataObject.data) || dataObject.data.length === 0) {
      console.warn(`renderTableFromPandasSplitJson: Data object is empty or malformed for ${title}`, dataObject);
      return <p className="info-message">No {title.toLowerCase()} data available or data format is incorrect.</p>;
    }
    
    // Process data to display index and format numbers
    const processedRows = dataObject.data.map((row, rowIndex) => {
        const newRow = [];
        if (dataObject.index && dataObject.index[rowIndex] !== undefined) {
            // Attempt to format dates if the index looks like an ISO date string
            if (String(dataObject.index[rowIndex]).includes('T') || String(dataObject.index[rowIndex]).includes('-') && !isNaN(new Date(dataObject.index[rowIndex]))) {
                newRow.push(new Date(dataObject.index[rowIndex]).toLocaleDateString('en-GB')); 
            } else {
                newRow.push(dataObject.index[rowIndex]);
            }
        }
        row.forEach(cell => newRow.push(cell));
        return newRow;
    });

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
    <div className="FinancialForecastingTool tool-section">
      <h3>📈 Financial Forecasting</h3>
      <p className="tool-description">Upload your historical sales data to predict future trends and detect anomalies.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="forecastFile">Upload CSV for Forecasting:</label>
          <input type="file" id="forecastFile" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
        </div>
        <div className="form-group">
          <label htmlFor="targetCol">Target Column Name:</label>
          <input type="text" id="targetCol" value={targetColumn} onChange={(e) => setTargetColumn(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="dateCol">Date Column Name (Optional):</label>
          <input type="text" id="dateCol" value={dateColumn} onChange={(e) => setDateColumn(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="forecastMonths">Number of Periods to Forecast:</label>
          <input type="number" id="forecastMonths" value={forecastMonths} onChange={(e) => setForecastMonths(parseInt(e.target.value))} min="1" />
        </div>
        <div className="form-group">
          <label htmlFor="contamination">Anomaly Sensitivity (Contamination):</label>
          <input type="number" id="contamination" value={contamination} onChange={(e) => setContamination(parseFloat(e.target.value))} step="0.001" min="0.001" max="0.1" />
        </div>
        <button type="submit" className="calculate-button" disabled={loading}>
          {loading ? 'Running Forecast...' : 'Run Financial Forecast'}
        </button>
      </form>

      {error && <p className="error-message">Error: {error}</p>}

      {results && (
        <div className="results-section">
          <h4>Forecast Results</h4>
          
          {/* Main Forecast Plot - Parse the JSON string */}
          {results.main_forecast_plot_json && JSON.parse(results.main_forecast_plot_json).data && JSON.parse(results.main_forecast_plot_json).layout && (
            <div className="chart-container">
              <h5>Sales Forecast with Anomalies</h5>
              <Plot
                data={JSON.parse(results.main_forecast_plot_json).data}
                layout={JSON.parse(results.main_forecast_plot_json).layout}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
              />
            </div>
          )}
          {!results.main_forecast_plot_json ? 
              <p className="info-message">No main forecast plot available.</p> : null
          }


          {/* Forecasted Values Table - Pass the JSON string to be parsed inside helper */}
          {results.forecast_data && ( 
            <div>
              <h5>Forecasted Values</h5>
              {renderTableFromPandasSplitJson(results.forecast_data, "forecasted")}
            </div>
          )}

          {/* Anomalies Data Table - Pass the JSON string to be parsed inside helper */}
          {results.anomalies_data && (
            <div>
              <h5>Detected Anomalies in Historical Data</h5>
              {renderTableFromPandasSplitJson(results.anomalies_data, "anomalies")}
            </div>
          )}

          {/* Additional Plots (Matplotlib Base64 Images) - NO CHANGE NEEDED HERE (they are strings) */}
          {results.additional_plots?.numeric_trends && (
            <div className="chart-container">
              <h5>Numeric Trends After Cleaning</h5>
              <img src={`data:image/png;base64,${results.additional_plots.numeric_trends}`} alt="Numeric Trends" />
            </div>
          )}
          {!results.additional_plots?.numeric_trends && results.additional_plots && Object.keys(results.additional_plots).length > 0 &&
             <p className="info-message">No numeric trends plot available.</p>
          }

          {/* Additional Plots (Plotly figures) - Parse the JSON string */}
          {results.additional_plots?.sales_vs_target_sales_plotly && JSON.parse(results.additional_plots.sales_vs_target_sales_plotly).data && JSON.parse(results.additional_plots.sales_vs_target_sales_plotly).layout && (
            <div className="chart-container">
              <h5>Sales vs Target Sales</h5>
              <Plot
                data={JSON.parse(results.additional_plots.sales_vs_target_sales_plotly).data}
                layout={JSON.parse(results.additional_plots.sales_vs_target_sales_plotly).layout}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
              />
            </div>
          )}
          {!results.additional_plots?.sales_vs_target_sales_plotly ?
             <p className="info-message">No Sales vs Target Sales plot available.</p> : null
          }


          {/* Market Indicators (dynamic selection) - Parse the nested JSON strings */}
          {results.additional_plots?.market_indicators_plotly_figs && 
           Object.keys(results.additional_plots.market_indicators_plotly_figs).length > 0 && (
            <div>
              <h5>Individual Market Indicator Trends</h5>
              {/* Pass the 'plots' object which contains JSON strings */}
              <MarketIndicatorSelector plots={results.additional_plots.market_indicators_plotly_figs} />
            </div>
          )}
          {!results.additional_plots?.market_indicators_plotly_figs || Object.keys(results.additional_plots.market_indicators_plotly_figs).length === 0 ?
             <p className="info-message">No market indicator trends available.</p> : null
          }

          {/* Correlation Heatmap - Parse the JSON string */}
          {results.additional_plots?.correlation_heatmap_plotly && JSON.parse(results.additional_plots.correlation_heatmap_plotly).data && JSON.parse(results.additional_plots.correlation_heatmap_plotly).layout && (
            <div className="chart-container">
              <h5>Correlation Heatmap of Financial Indicators</h5>
              <Plot
                data={JSON.parse(results.additional_plots.correlation_heatmap_plotly).data}
                layout={JSON.parse(results.additional_plots.correlation_heatmap_plotly).layout}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
              />
            </div>
          )}
          {!results.additional_plots?.correlation_heatmap_plotly ?
             <p className="info-message">No correlation heatmap available.</p> : null
          }
        </div>
      )}
    </div>
  );
}

// Helper component for Market Indicator Selector (used by FinancialForecastingTool)
function MarketIndicatorSelector({ plots }) { // 'plots' here is an object where values are JSON strings
    const indicatorOptions = Object.keys(plots);
    const [selectedIndicator, setSelectedIndicator] = useState(indicatorOptions[0]);

    if (!indicatorOptions.length) {
        return null;
    }

    let currentPlotData = null;
    if (selectedIndicator && plots[selectedIndicator]) {
        try {
            currentPlotData = JSON.parse(plots[selectedIndicator]); // <--- CRITICAL: Parse the selected indicator's JSON string
        } catch (e) {
            console.error(`Error parsing JSON for selected indicator plot (${selectedIndicator}):`, e, plots[selectedIndicator]);
        }
    }

    return (
        <div className="form-group">
            <label htmlFor="indicatorSelect">Select Indicator:</label>
            <select id="indicatorSelect" value={selectedIndicator} onChange={(e) => setSelectedIndicator(e.target.value)}>
                {indicatorOptions.map(option => (
                    <option key={option} value={option}>{option.replace(/_/g, ' ').charAt(0).toUpperCase() + option.replace(/_/g, ' ').slice(1)}</option>
                ))}
            </select>
            {/* Check if parsed plot data/layout exist before rendering */}
            {currentPlotData?.data && currentPlotData?.layout ? (
                <div className="chart-container">
                    <Plot
                        data={currentPlotData.data}
                        layout={currentPlotData.layout}
                        style={{ width: '100%', height: '100%' }}
                        useResizeHandler={true}
                    />
                </div>
            ) : (
                selectedIndicator && <p className="info-message">Plot data for {selectedIndicator.replace(/_/g, ' ').toLowerCase()} not available or corrupted.</p>
            )}
        </div>
    );
}

export default FinancialForecastingTool;