import { streamPost } from './sse';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  getSongs: () => request('/songs'),
  getSong: (id) => request(`/songs/${id}`),
  createSong: (title) =>
    request('/songs', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  addSection: (songId, section) =>
    request(`/songs/${songId}/sections`, {
      method: 'POST',
      body: JSON.stringify(section),
    }),
  getMessages: (songId) => request(`/songs/${songId}/messages`),
  askForLyrics: (songId, sectionId, content) =>
    request(`/songs/${songId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        sectionId,
        generate: true,
      }),
    }),
  askForLyricsStream: (songId, sectionId, content, onEvent, signal) =>
    streamPost(
      `/songs/${songId}/messages/stream`,
      { content, sectionId, generate: true },
      onEvent,
      signal,
    ),
};
