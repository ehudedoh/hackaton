const API_BASE = `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api`;

async function readJson(response) {
  const raw = await response.text();
  if (!raw) {
    throw new Error(
      'Le serveur n’a renvoyé aucune donnée. Sur Render, le frontend doit appeler l’URL du backend (variable VITE_API_URL au build).',
    );
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      'Le serveur n’a pas renvoyé de JSON. Vérifiez VITE_API_URL et que le service backend Render est bien démarré.',
    );
  }
}

async function readError(response) {
  try {
    const data = await response.clone().json();
    return data.detail || 'Le serveur n’a pas pu terminer la demande.';
  } catch {
    return 'Le serveur n’a pas pu terminer la demande.';
  }
}

export async function checkHealth() {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error('Le serveur ne répond pas pour le moment.');
  }
  return readJson(response);
}

export async function analyzeDocument(text) {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return readJson(response);
}

export async function requestSpeech(text) {
  const response = await fetch(`${API_BASE}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
