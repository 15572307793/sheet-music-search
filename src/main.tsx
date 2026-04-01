import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SearchProvider } from './context/SearchContext';
import { DownloadProvider } from './context/DownloadContext';
import { ToastProvider } from './context/ToastContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <SearchProvider>
        <DownloadProvider>
          <App />
        </DownloadProvider>
      </SearchProvider>
    </ToastProvider>
  </React.StrictMode>,
);
