import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';
import { SearchProvider } from './context/SearchContext';
import { DownloadProvider } from './context/DownloadContext';
import { ToastProvider } from './context/ToastContext';

function renderApp() {
  return render(
    <ToastProvider>
      <SearchProvider>
        <DownloadProvider>
          <App />
        </DownloadProvider>
      </SearchProvider>
    </ToastProvider>,
  );
}

describe('App', () => {
  it('renders the app title', () => {
    renderApp();
    expect(screen.getByText('乐谱搜索')).toBeInTheDocument();
  });

  it('renders the search bar', () => {
    renderApp();
    expect(screen.getByLabelText('搜索曲谱')).toBeInTheDocument();
  });

  it('renders the empty results message initially', () => {
    renderApp();
    expect(screen.getByText('未找到相关曲谱，请尝试其他关键词')).toBeInTheDocument();
  });
});
