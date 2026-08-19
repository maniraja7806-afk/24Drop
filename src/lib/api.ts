import { addOfflineRequest, getOfflineRequests, clearOfflineRequests } from './offlineQueue';
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const sessionId = localStorage.getItem('sessionId');
  const headers = {
    ...options.headers,
    ...(sessionId ? { 'x-session-id': sessionId } : {}),
  };

  let response;
  try {
    response = await fetch(endpoint, { ...options, headers });
  } catch (err: any) {
    if (err?.name === 'TypeError' || err?.message?.includes('fetch')) {
      if (options.method === 'POST') {
        addOfflineRequest({ endpoint, options: { ...options, headers } });
        // Return a mock successful response for offline queued messages
        return { _queued: true };
      }
      throw new Error('Unable to connect to server. Please check your network connection.');
    }
    throw err;
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    throw new Error('Application is starting up or unavailable. Please try again.');
  }

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new Event('auth_error'));
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Error ${response.status}`);
  }

  return response.json();
}


export async function syncOfflineRequests() {
  const queue = getOfflineRequests();
  if (!queue.length) return;
  
  const currentQueue = [...queue];
  clearOfflineRequests();
  
  for (const req of currentQueue) {
    try {
      await fetchApi(req.endpoint, req.options);
    } catch (e: any) {
      if (e?.message?.includes('network connection') || e?.name === 'TypeError') {
        // Still offline, put it back
        addOfflineRequest(req);
      } else {
        // Request failed for other reasons (e.g. 400), drop it or log it
        console.error('Failed to sync offline request:', e);
      }
    }
  }
}
