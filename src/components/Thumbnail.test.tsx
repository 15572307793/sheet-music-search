import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Thumbnail from './Thumbnail';

describe('Thumbnail', () => {
  const defaultProps = {
    src: 'https://example.com/sheet.jpg',
    alt: '小星星乐谱',
    onClick: vi.fn(),
  };

  it('renders an image with proxied src', () => {
    render(<Thumbnail {...defaultProps} />);
    const img = screen.getByRole('img', { name: '小星星乐谱' });
    expect(img).toHaveAttribute(
      'src',
      `/api/images?url=${encodeURIComponent(defaultProps.src)}`
    );
  });

  it('has minimum dimensions of 80x120 pixels', () => {
    render(<Thumbnail {...defaultProps} />);
    const img = screen.getByRole('img', { name: '小星星乐谱' });
    expect(img.style.minWidth).toBe('80px');
    expect(img.style.minHeight).toBe('120px');
  });

  it('shows placeholder icon when image fails to load', () => {
    render(<Thumbnail {...defaultProps} />);
    const img = screen.getByRole('img', { name: '小星星乐谱' });

    fireEvent.error(img);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    const button = screen.getByRole('button', { name: '小星星乐谱' });
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Thumbnail {...defaultProps} onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: '小星星乐谱' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders without onClick (optional prop)', () => {
    render(<Thumbnail src={defaultProps.src} alt={defaultProps.alt} />);
    expect(screen.getByRole('button', { name: '小星星乐谱' })).toBeInTheDocument();
  });

  it('encodes special characters in the image URL', () => {
    const specialSrc = 'https://example.com/sheet music & notes.jpg';
    render(<Thumbnail src={specialSrc} alt="test" />);
    const img = screen.getByRole('img', { name: 'test' });
    expect(img.getAttribute('src')).toBe(
      `/api/images?url=${encodeURIComponent(specialSrc)}`
    );
  });

  it('shows placeholder icon after error, not the broken image', () => {
    render(<Thumbnail {...defaultProps} />);
    fireEvent.error(screen.getByRole('img', { name: '小星星乐谱' }));

    // Placeholder should have the music note SVG
    const button = screen.getByRole('button', { name: '小星星乐谱' });
    expect(button.querySelector('svg')).toBeInTheDocument();
    // No img element should remain
    expect(button.querySelector('img')).not.toBeInTheDocument();
  });
});
