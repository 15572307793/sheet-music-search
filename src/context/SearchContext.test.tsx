import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SearchProvider, useSearch, searchReducer, type SearchState } from './SearchContext';

const initialState: SearchState = {
  query: '',
  results: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  total: 0,
};

function wrapper({ children }: { children: ReactNode }) {
  return <SearchProvider>{children}</SearchProvider>;
}

describe('searchReducer', () => {
  it('SET_QUERY updates query', () => {
    const state = searchReducer(initialState, { type: 'SET_QUERY', payload: '月光奏鸣曲' });
    expect(state.query).toBe('月光奏鸣曲');
  });

  it('SET_LOADING sets loading and clears error when true', () => {
    const stateWithError = { ...initialState, error: 'some error' };
    const state = searchReducer(stateWithError, { type: 'SET_LOADING', payload: true });
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('SET_LOADING keeps existing error when false', () => {
    const stateWithError = { ...initialState, error: 'some error', isLoading: true };
    const state = searchReducer(stateWithError, { type: 'SET_LOADING', payload: false });
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('some error');
  });

  it('SET_RESULTS updates results, pagination, and clears loading/error', () => {
    const loadingState = { ...initialState, isLoading: true, error: 'old error' };
    const state = searchReducer(loadingState, {
      type: 'SET_RESULTS',
      payload: {
        results: [{ id: '1', title: 'Test', sourceName: 'A', sourceUrl: '', sourcePriority: 'high', thumbnailUrl: '', imageUrls: [], pageCount: 1, qualityTags: [], matchScore: 1 }],
        total: 45,
        page: 2,
        pageSize: 20,
      },
    });
    expect(state.results).toHaveLength(1);
    expect(state.total).toBe(45);
    expect(state.currentPage).toBe(2);
    expect(state.totalPages).toBe(3);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('SET_ERROR sets error and clears loading', () => {
    const loadingState = { ...initialState, isLoading: true };
    const state = searchReducer(loadingState, { type: 'SET_ERROR', payload: '搜索失败' });
    expect(state.error).toBe('搜索失败');
    expect(state.isLoading).toBe(false);
  });

  it('RESET returns to initial state', () => {
    const modifiedState: SearchState = {
      query: 'test',
      results: [{ id: '1', title: 'T', sourceName: 'A', sourceUrl: '', sourcePriority: 'high', thumbnailUrl: '', imageUrls: [], pageCount: 1, qualityTags: [], matchScore: 1 }],
      isLoading: true,
      error: 'err',
      currentPage: 3,
      totalPages: 5,
      total: 100,
    };
    const state = searchReducer(modifiedState, { type: 'RESET' });
    expect(state).toEqual(initialState);
  });
});

describe('useSearch hook', () => {
  it('provides state and dispatch within SearchProvider', () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    expect(result.current.state).toEqual(initialState);
    expect(typeof result.current.dispatch).toBe('function');
  });

  it('throws when used outside SearchProvider', () => {
    expect(() => {
      renderHook(() => useSearch());
    }).toThrow('useSearch must be used within a SearchProvider');
  });

  it('dispatches actions correctly', () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    act(() => {
      result.current.dispatch({ type: 'SET_QUERY', payload: '小星星' });
    });
    expect(result.current.state.query).toBe('小星星');
  });
});
