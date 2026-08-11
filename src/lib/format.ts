export function formatBytes(bytes?: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getFileCategory(mimeType?: string | null, fileName?: string | null): 'image' | 'video' | 'audio' | 'pdf' | 'archive' | 'code' | 'doc' | 'file' {
  const type = mimeType || '';
  const name = (fileName || '').toLowerCase();
  
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('7z') || name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z')) return 'archive';
  if (name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.jsx') || name.endsWith('.tsx') || name.endsWith('.html') || name.endsWith('.css') || name.endsWith('.json') || name.endsWith('.py') || name.endsWith('.java') || name.endsWith('.cpp') || name.endsWith('.c')) return 'code';
  if (type.includes('document') || type.includes('word') || type.includes('spreadsheet') || name.endsWith('.doc') || name.endsWith('.docx') || name.endsWith('.xlsx') || name.endsWith('.csv') || name.endsWith('.txt')) return 'doc';
  return 'file';
}
