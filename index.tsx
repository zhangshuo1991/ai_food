import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Starting App mount...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  const msg = "FATAL: Could not find root element to mount to";
  console.error(msg);
  throw new Error(msg);
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("App mounted successfully.");
} catch (e) {
  console.error("Failed to render React app:", e);
  rootElement.innerHTML = `<div style="padding:20px; color:red;"><h3>Application Error</h3><pre>${e}</pre></div>`;
}