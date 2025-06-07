import './index.css';
import React from "react";
import ReactDOM from 'react-dom/client';
import { App } from "./App";
import { AudioProvider } from '../../src/components/shared/AudioManager'; // Adjusted path

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AudioProvider>
        <App />
      </AudioProvider>
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}