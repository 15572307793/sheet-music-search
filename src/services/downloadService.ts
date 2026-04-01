import JSZip from 'jszip';
import type { SearchResult } from '../types/index';

function imageProxyUrl(url: string): string {
  return `/api/images?url=${encodeURIComponent(url)}`;
}

async function fetchImageBlob(url: string): Promise<Blob> {
  const response = await fetch(imageProxyUrl(url));
  if (!response.ok) {
    throw new Error(`图片下载失败: ${response.status}`);
  }
  return response.blob();
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function extensionFromBlob(blob: Blob): string {
  const type = blob.type;
  if (type.includes('png')) return '.png';
  if (type.includes('webp')) return '.webp';
  return '.jpg';
}

export async function downloadSheetMusic(
  item: SearchResult,
  onProgress?: (progress: number) => void,
): Promise<void> {
  onProgress?.(0);

  if (item.pageCount === 1) {
    const blob = await fetchImageBlob(item.imageUrls[0]);
    onProgress?.(90);
    const ext = extensionFromBlob(blob);
    triggerBrowserDownload(blob, `${item.title}${ext}`);
    onProgress?.(100);
    return;
  }

  // Multi-page: bundle into ZIP
  const zip = new JSZip();
  const total = item.imageUrls.length;

  for (let i = 0; i < total; i++) {
    const blob = await fetchImageBlob(item.imageUrls[i]);
    const ext = extensionFromBlob(blob);
    zip.file(`${item.title}_${i + 1}${ext}`, blob);
    onProgress?.(Math.round(((i + 1) / total) * 80));
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  onProgress?.(95);
  triggerBrowserDownload(zipBlob, `${item.title}.zip`);
  onProgress?.(100);
}
