import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import QualityTag from './QualityTag';

describe('QualityTag', () => {
  it('renders "高清" tag with green styling', () => {
    render(<QualityTag tag="高清" />);
    const tag = screen.getByText('高清');
    expect(tag).toBeInTheDocument();
    expect(tag.className).toContain('bg-green-100');
    expect(tag.className).toContain('text-green-700');
  });

  it('renders "推荐" tag with blue styling', () => {
    render(<QualityTag tag="推荐" />);
    const tag = screen.getByText('推荐');
    expect(tag).toBeInTheDocument();
    expect(tag.className).toContain('bg-blue-100');
    expect(tag.className).toContain('text-blue-700');
  });

  it('renders as an inline badge with small text', () => {
    render(<QualityTag tag="高清" />);
    const tag = screen.getByText('高清');
    expect(tag.className).toContain('text-xs');
    expect(tag.className).toContain('inline-block');
    expect(tag.className).toContain('rounded');
  });
});
