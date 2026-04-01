import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../images';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function createMockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    query: {},
    ...overrides,
  } as unknown as VercelRequest;
}

function createMockRes() {
  const headers: Record<string, string> = {};
  const res: Partial<VercelResponse> & { _status: number; _json: unknown; _body: unknown; _headers: Record<string, string> } = {
    _status: 0,
    _json: null,
    _body: null,
    _headers: headers,
    status(code: number) {
      res._status = code;
      return res as VercelResponse;
    },
    json(data: unknown) {
      res._json = data;
      return res as VercelResponse;
    },
    send(body: unknown) {
      res._body = body;
      return res as VercelResponse;
    },
    setHeader(name: string, value: string) {
      headers[name] = value;
      return res as unknown as VercelResponse;
    },
  };
  return res;
}

describe('GET /api/images', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects non-GET requests with 405', async () => {
    const req = createMockReq({ method: 'POST' });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(res._status).toBe(405);
  });

  it('returns 400 when url param is missing', async () => {
    const req = createMockReq({ query: {} });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(res._status).toBe(400);
    expect(res._json).toEqual({ error: '请提供有效的图片 URL' });
  });

  it('returns 400 when url is empty string', async () => {
    const req = createMockReq({ query: { url: '' } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(res._status).toBe(400);
  });

  it('returns 400 when url is not a valid HTTP URL', async () => {
    const req = createMockReq({ query: { url: 'ftp://example.com/img.png' } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(res._status).toBe(400);
  });

  it('returns 400 for malformed URL', async () => {
    const req = createMockReq({ query: { url: 'not-a-url' } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(res._status).toBe(400);
  });

  it('uses first element when url is an array', async () => {
    const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: vi.fn().mockResolvedValue(imageData.buffer),
    };
    vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const req = createMockReq({ query: { url: ['https://example.com/a.png', 'https://example.com/b.png'] } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);
    expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
      'https://example.com/a.png',
      expect.any(Object),
    );
  });

  it('proxies image successfully with correct content-type', async () => {
    const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: vi.fn().mockResolvedValue(imageData.buffer),
    };
    vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const req = createMockReq({ query: { url: 'https://example.com/sheet.png' } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);

    expect(res._headers['Content-Type']).toBe('image/png');
    expect(res._headers['Access-Control-Allow-Origin']).toBe('*');
    expect(res._headers['Cache-Control']).toBe('public, max-age=86400');
    expect(res._body).toBeInstanceOf(Buffer);
  });

  it('defaults content-type to application/octet-stream when missing', async () => {
    const imageData = new Uint8Array([0xff, 0xd8]);
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers(),
      arrayBuffer: vi.fn().mockResolvedValue(imageData.buffer),
    };
    vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const req = createMockReq({ query: { url: 'https://example.com/img' } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);

    expect(res._headers['Content-Type']).toBe('application/octet-stream');
  });

  it('returns upstream status code when fetch response is not ok', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      headers: new Headers(),
    };
    vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const req = createMockReq({ query: { url: 'https://example.com/missing.png' } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);

    expect(res._status).toBe(404);
    expect(res._json).toEqual({ error: '图片获取失败' });
  });

  it('returns 502 when fetch throws a network error', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new TypeError('fetch failed'));

    const req = createMockReq({ query: { url: 'https://example.com/img.png' } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);

    expect(res._status).toBe(502);
    expect(res._json).toEqual({ error: '图片代理请求失败' });
  });

  it('returns 504 when fetch times out (AbortError)', async () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    vi.mocked(global.fetch).mockRejectedValue(abortError);

    const req = createMockReq({ query: { url: 'https://example.com/slow.png' } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);

    expect(res._status).toBe(504);
    expect(res._json).toEqual({ error: '图片请求超时' });
  });

  it('sets CORS headers on successful response', async () => {
    const imageData = new Uint8Array([0x00]);
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      arrayBuffer: vi.fn().mockResolvedValue(imageData.buffer),
    };
    vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response);

    const req = createMockReq({ query: { url: 'https://example.com/photo.jpg' } });
    const res = createMockRes();
    await handler(req, res as unknown as VercelResponse);

    expect(res._headers['Access-Control-Allow-Origin']).toBe('*');
    expect(res._headers['Access-Control-Allow-Methods']).toBe('GET');
    expect(res._headers['Access-Control-Allow-Headers']).toBe('Content-Type');
  });
});
