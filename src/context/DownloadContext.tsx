import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { DownloadTask } from '../types/index';

export interface DownloadState {
  downloadTasks: Map<string, DownloadTask>;
}

export type DownloadAction =
  | { type: 'START_DOWNLOAD'; payload: { resultId: string } }
  | { type: 'UPDATE_PROGRESS'; payload: { resultId: string; progress: number } }
  | { type: 'COMPLETE_DOWNLOAD'; payload: { resultId: string } }
  | { type: 'FAIL_DOWNLOAD'; payload: { resultId: string; error: string } }
  | { type: 'RESET_DOWNLOAD'; payload: { resultId: string } };

const initialState: DownloadState = {
  downloadTasks: new Map(),
};

export function downloadReducer(state: DownloadState, action: DownloadAction): DownloadState {
  const tasks = new Map(state.downloadTasks);

  switch (action.type) {
    case 'START_DOWNLOAD':
      tasks.set(action.payload.resultId, {
        resultId: action.payload.resultId,
        status: 'downloading',
        progress: 0,
      });
      return { downloadTasks: tasks };

    case 'UPDATE_PROGRESS': {
      const task = tasks.get(action.payload.resultId);
      if (task) {
        tasks.set(action.payload.resultId, {
          ...task,
          progress: action.payload.progress,
        });
      }
      return { downloadTasks: tasks };
    }

    case 'COMPLETE_DOWNLOAD': {
      const task = tasks.get(action.payload.resultId);
      if (task) {
        tasks.set(action.payload.resultId, {
          ...task,
          status: 'completed',
          progress: 100,
        });
      }
      return { downloadTasks: tasks };
    }

    case 'FAIL_DOWNLOAD': {
      const task = tasks.get(action.payload.resultId);
      if (task) {
        tasks.set(action.payload.resultId, {
          ...task,
          status: 'failed',
          error: action.payload.error,
        });
      }
      return { downloadTasks: tasks };
    }

    case 'RESET_DOWNLOAD':
      tasks.delete(action.payload.resultId);
      return { downloadTasks: tasks };

    default:
      return state;
  }
}

interface DownloadContextValue {
  state: DownloadState;
  dispatch: React.Dispatch<DownloadAction>;
}

const DownloadContext = createContext<DownloadContextValue | null>(null);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(downloadReducer, initialState);
  return (
    <DownloadContext.Provider value={{ state, dispatch }}>
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownload(): DownloadContextValue {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownload must be used within a DownloadProvider');
  }
  return context;
}
