import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { DownloadProvider, useDownload, downloadReducer, type DownloadState } from './DownloadContext';

const initialState: DownloadState = { downloadTasks: new Map() };

function wrapper({ children }: { children: ReactNode }) {
  return <DownloadProvider>{children}</DownloadProvider>;
}

describe('downloadReducer', () => {
  it('START_DOWNLOAD creates a new downloading task', () => {
    const state = downloadReducer(initialState, { type: 'START_DOWNLOAD', payload: { resultId: 'r1' } });
    const task = state.downloadTasks.get('r1');
    expect(task).toEqual({ resultId: 'r1', status: 'downloading', progress: 0 });
  });

  it('UPDATE_PROGRESS updates progress of existing task', () => {
    const prev: DownloadState = {
      downloadTasks: new Map([['r1', { resultId: 'r1', status: 'downloading', progress: 0 }]]),
    };
    const state = downloadReducer(prev, { type: 'UPDATE_PROGRESS', payload: { resultId: 'r1', progress: 50 } });
    expect(state.downloadTasks.get('r1')?.progress).toBe(50);
  });

  it('UPDATE_PROGRESS is a no-op for non-existent task', () => {
    const state = downloadReducer(initialState, { type: 'UPDATE_PROGRESS', payload: { resultId: 'r1', progress: 50 } });
    expect(state.downloadTasks.has('r1')).toBe(false);
  });

  it('COMPLETE_DOWNLOAD sets status to completed and progress to 100', () => {
    const prev: DownloadState = {
      downloadTasks: new Map([['r1', { resultId: 'r1', status: 'downloading', progress: 75 }]]),
    };
    const state = downloadReducer(prev, { type: 'COMPLETE_DOWNLOAD', payload: { resultId: 'r1' } });
    const task = state.downloadTasks.get('r1');
    expect(task?.status).toBe('completed');
    expect(task?.progress).toBe(100);
  });

  it('FAIL_DOWNLOAD sets status to failed with error message', () => {
    const prev: DownloadState = {
      downloadTasks: new Map([['r1', { resultId: 'r1', status: 'downloading', progress: 30 }]]),
    };
    const state = downloadReducer(prev, { type: 'FAIL_DOWNLOAD', payload: { resultId: 'r1', error: '网络错误' } });
    const task = state.downloadTasks.get('r1');
    expect(task?.status).toBe('failed');
    expect(task?.error).toBe('网络错误');
  });

  it('RESET_DOWNLOAD removes the task', () => {
    const prev: DownloadState = {
      downloadTasks: new Map([['r1', { resultId: 'r1', status: 'completed', progress: 100 }]]),
    };
    const state = downloadReducer(prev, { type: 'RESET_DOWNLOAD', payload: { resultId: 'r1' } });
    expect(state.downloadTasks.has('r1')).toBe(false);
  });

  it('does not mutate original state', () => {
    const prev: DownloadState = {
      downloadTasks: new Map([['r1', { resultId: 'r1', status: 'downloading', progress: 0 }]]),
    };
    downloadReducer(prev, { type: 'UPDATE_PROGRESS', payload: { resultId: 'r1', progress: 50 } });
    expect(prev.downloadTasks.get('r1')?.progress).toBe(0);
  });
});

describe('useDownload hook', () => {
  it('provides state and dispatch within DownloadProvider', () => {
    const { result } = renderHook(() => useDownload(), { wrapper });
    expect(result.current.state.downloadTasks.size).toBe(0);
    expect(typeof result.current.dispatch).toBe('function');
  });

  it('throws when used outside DownloadProvider', () => {
    expect(() => {
      renderHook(() => useDownload());
    }).toThrow('useDownload must be used within a DownloadProvider');
  });

  it('dispatches START_DOWNLOAD and UPDATE_PROGRESS correctly', () => {
    const { result } = renderHook(() => useDownload(), { wrapper });
    act(() => {
      result.current.dispatch({ type: 'START_DOWNLOAD', payload: { resultId: 'r1' } });
    });
    expect(result.current.state.downloadTasks.get('r1')?.status).toBe('downloading');

    act(() => {
      result.current.dispatch({ type: 'UPDATE_PROGRESS', payload: { resultId: 'r1', progress: 60 } });
    });
    expect(result.current.state.downloadTasks.get('r1')?.progress).toBe(60);
  });
});
