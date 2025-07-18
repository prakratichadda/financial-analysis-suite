// financial-analysis-suite-web/frontend/src/components/FinancialForecastingTool.js
import React, { useState } from 'react';

function FinancialForecastingTool({ apiEndpoint, toolTitle, toolDescription, fileLabel, buttonLabel, resultTitle }) {
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
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}${apiEndpoint}`, {
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

  return (
    <div className="FinancialForecastingTool tool-section">
      <h3>{toolTitle}</h3>
      <p className="tool-description">{toolDescription}</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="financialFile">{fileLabel}</label>
          <input
            type="file"
            id="financialFile"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>
        <button type="submit" className="calculate-button" disabled={loading}>
          {loading ? 'Processing...' : buttonLabel}
        </button>
      </form>

      {error && <p className="error-message">Error: {error}</p>}

      {results && (
        <div className="results-section">
          <h4>{resultTitle}</h4>
          <pre className="results-output">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default FinancialForecastingTool;
