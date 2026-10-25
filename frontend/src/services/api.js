const API_BASE = `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api`;

function networkError(error) {
  const message = error?.message || '';
  if (
    error?.name === 'TypeError' ||
    /Failed to fetch|NetworkError|Load failed|network/i.test(message)
  ) {
    return new Error(
      'La connexion a été coupée. Sur Render, un POST voix de 2 minutes est arrêté. Attendez que le modèle soit chargé, puis réessayez.',
    );
  }
  return error instanceof Error ? error : new Error(message);
}

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
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) {
      throw new Error('Le serveur ne répond pas pour le moment.');
    }
    return readJson(response);
  } catch (error) {
    throw networkError(error);
  }
}

export async function analyzeDocument(text) {
  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      throw new Error(await readError(response));
    }
    return readJson(response);
  } catch (error) {
    throw networkError(error);
  }
}

async function waitForVoice() {
  try {
    await fetch(`${API_BASE}/tts/warmup`, { method: 'POST' });
  } catch {
    // Le chargement continue côté serveur même si cet appel échoue.
  }
  const started = Date.now();
  while (Date.now() - started < 180000) {
    try {
      const health = await checkHealth();
      if (health.tts) {
        return;
      }
    } catch {
      // Instance Render en train de redémarrer ou saturée.
    }
    await new Promise((resolve) => window.setTimeout(resolve, 2500));
  }
  throw new Error(
    'La voix n’est pas prête. Le modèle éwé dépasse souvent la RAM ou le délai de Render. Réessayez, ou lancez le backend en local.',
  );
}

export async function requestSpeech(text) {
  await waitForVoice();
  try {
    const response = await fetch(`${API_BASE}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (response.status === 503) {
      await waitForVoice();
      const retry = await fetch(`${API_BASE}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!retry.ok) {
        throw new Error(await readError(retry));
      }
      const retryBlob = await retry.blob();
      return URL.createObjectURL(retryBlob);
    }
    if (!response.ok) {
      throw new Error(await readError(response));
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    throw networkError(error);
  }
}
