const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export async function getTasks({ signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}/tasks`, { signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Cannot reach the server. Please try again.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || 'Unable to load tasks. Please try again.');
  }
  const tasks = await response.json();
  if (!Array.isArray(tasks)) throw new Error('The server returned an unexpected response.');
  return tasks;
}
