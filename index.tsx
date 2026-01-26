import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Add custom reusable input classes to CSS via JS injection (for Tailwind cleanliness in components)
const style = document.createElement('style');
style.textContent = `
  .form-input {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    outline: none;
    transition: all 0.2s;
  }
  .form-input:focus {
    ring: 2px;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    border-color: #3b82f6;
  }
  .form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #334155;
    margin-bottom: 0.25rem;
  }
`;
document.head.appendChild(style);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
