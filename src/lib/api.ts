export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const sessionId = localStorage.getItem('sessionId');
  const headers = {
    ...options.headers,
    ...(sessionId ? { 'x-session-id': sessionId } : {}),
  };

  const response = await fetch(endpoint, { ...options, headers });
  
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
