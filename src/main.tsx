
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { logAppInitialization } from './utils/debugUtils.ts'

// Log application startup for debugging
try {
  console.log('Application bootstrap starting...');
  const initResult = logAppInitialization();
  console.log('Initialization result:', initResult);
  
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found in the DOM');
  }
  
  const root = createRoot(rootElement);
  console.log('React root created successfully');
  
  root.render(<App />);
  console.log('App rendered to DOM');
} catch (error) {
  console.error('CRITICAL ERROR DURING APPLICATION STARTUP:', error);
  // Display a fallback error UI
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>Application Error</h2>
        <p>We encountered a problem loading the application.</p>
        <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
        <button onclick="window.location.reload()">Reload Application</button>
      </div>
    `;
  }
}
