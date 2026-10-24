const API_BASE = '/api';

async function readError(response) {
  try {
    const data = await response.json();
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
  return response.json();
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
  return response.json();
}

export async function requestSpeech() {
  throw new Error('La voix n’est pas encore branchée.');
}
