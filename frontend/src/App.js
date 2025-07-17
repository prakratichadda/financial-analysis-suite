// financial-analysis-suite-web/frontend/src/App.js
import React, { useState } from 'react';
import './App.css'; // Main application-specific styles

// Import your feature components
import FinancialForecastingTool from './components/FinancialForecastingTool';
import FraudDetectionTool from './components/FraudDetectionTool';
import TaxCalculator from './components/TaxCalculator';
import InvoiceProcessingTool from './components/InvoiceProcessingTool';

function App() {
  // State to manage which tool/tab is currently active
  const [activeTab, setActiveTab] = useState('forecast'); // Default to 'forecast'

  return (
    <div className="App">
      <header className="App-header">
        <h1>Financial Analysis Suite</h1>
        <p>Empowering financial decisions with data and AI.</p>
      </header>
      
      <nav className="App-nav">
        <button 
          // Add 'active' class based on activeTab state for styling
          className={activeTab === 'forecast' ? 'active' : ''} 
          onClick={() => setActiveTab('forecast')}>
          📈 Financial Forecasting
        </button>
        <button 
          className={activeTab === 'fraud' ? 'active' : ''} 
          onClick={() => setActiveTab('fraud')}>
          🕵️‍♂️ Fraud Detection
        </button>
        <button 
          className={activeTab === 'tax' ? 'active' : ''} 
          onClick={() => setActiveTab('tax')}>
          💰 Tax Compliance
        </button>
        <button 
          className={activeTab === 'invoice' ? 'active' : ''} 
          onClick={() => setActiveTab('invoice')}>
          🧾 Invoice Processing
        </button>
      </nav>

      <main className="App-main">
        {/* Conditionally render the active component based on the state */}
        {activeTab === 'forecast' && <FinancialForecastingTool />}
        {activeTab === 'fraud' && <FraudDetectionTool />}
        {activeTab === 'tax' && <TaxCalculator />}
        {activeTab === 'invoice' && <InvoiceProcessingTool />}
      </main>

      <footer>
        <p>&copy; 2025 Financial Analysis Suite. All rights reserved.</p>
        <p>Built with React & Flask</p>
      </footer>
    </div>
  );
}

export default App;