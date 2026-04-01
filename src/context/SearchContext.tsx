import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { SearchResult, SearchResponse } from '../types/index';

export interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  total: number;
}

export type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_RESULTS'; payload: SearchResponse }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' };

const initialState: SearchState = {
  query: '',
  results: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  total: 0,
};

export function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: action.payload ? null : state.error };
    case 'SET_RESULTS': {
      const { results, total, page, pageSize } = action.payload;
      return {
        ...state,
        results,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
        isLoading: false,
        error: null,
      };
    }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface SearchContextValue {
  state: SearchState;
  dispatch: React.Dispatch<SearchAction>;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  return (
    <SearchContext.Provider value={{ state, dispatch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
