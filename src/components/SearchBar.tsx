import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import type { SearchBarProps } from '../types/components';

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [hint, setHint] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setHint('请输入曲谱名称');
      return;
    }
    setHint('');
    onSearch(trimmed);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 px-3 py-3">
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (hint) setHint('');
          }}
          onKeyDown={handleKeyDown}
          placeholder="搜索曲谱..."
          aria-label="搜索曲谱"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {hint && (
          <p className="absolute mt-1 text-xs text-red-500" role="alert">
            {hint}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        aria-label={isLoading ? '搜索中' : '搜索'}
        className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center gap-1">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            搜索中
          </span>
        ) : (
          '搜索'
        )}
      </button>
    </form>
  );
}
