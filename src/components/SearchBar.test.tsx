import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  it('renders search input and button', () => {
    render(<SearchBar onSearch={vi.fn()} isLoading={false} />);
    expect(screen.getByLabelText('搜索曲谱')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '搜索' })).toBeInTheDocument();
  });

  it('auto-focuses input on mount', () => {
    render(<SearchBar onSearch={vi.fn()} isLoading={false} />);
    expect(screen.getByLabelText('搜索曲谱')).toHaveFocus();
  });

  it('calls onSearch with trimmed query when button is clicked', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isLoading={false} />);

    fireEvent.change(screen.getByLabelText('搜索曲谱'), { target: { value: '  小星星  ' } });
    fireEvent.click(screen.getByRole('button', { name: '搜索' }));

    expect(onSearch).toHaveBeenCalledWith('小星星');
  });

  it('calls onSearch when Enter key is pressed', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isLoading={false} />);

    const input = screen.getByLabelText('搜索曲谱');
    fireEvent.change(input, { target: { value: '月光奏鸣曲' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSearch).toHaveBeenCalledWith('月光奏鸣曲');
  });

  it('shows hint when searching with empty input', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isLoading={false} />);

    fireEvent.click(screen.getByRole('button', { name: '搜索' }));

    expect(screen.getByText('请输入曲谱名称')).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('shows hint when searching with whitespace-only input', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isLoading={false} />);

    fireEvent.change(screen.getByLabelText('搜索曲谱'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: '搜索' }));

    expect(screen.getByText('请输入曲谱名称')).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('clears hint when user types after empty submission', () => {
    render(<SearchBar onSearch={vi.fn()} isLoading={false} />);

    fireEvent.click(screen.getByRole('button', { name: '搜索' }));
    expect(screen.getByText('请输入曲谱名称')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('搜索曲谱'), { target: { value: 'a' } });
    expect(screen.queryByText('请输入曲谱名称')).not.toBeInTheDocument();
  });

  it('disables button and shows loading state when isLoading is true', () => {
    render(<SearchBar onSearch={vi.fn()} isLoading={true} />);

    const button = screen.getByRole('button', { name: '搜索中' });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('搜索中');
  });

  it('does not call onSearch when button is clicked during loading', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isLoading={true} />);

    fireEvent.change(screen.getByLabelText('搜索曲谱'), { target: { value: '测试' } });
    fireEvent.click(screen.getByRole('button', { name: '搜索中' }));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('shows spinner SVG during loading', () => {
    const { container } = render(<SearchBar onSearch={vi.fn()} isLoading={true} />);
    const svg = container.querySelector('svg.animate-spin');
    expect(svg).toBeInTheDocument();
  });
});
