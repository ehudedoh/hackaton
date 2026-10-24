import { AlertCircle, LoaderCircle } from 'lucide-react';
import BigButton from './BigButton.jsx';

export default function ImportScreen({
  fileName,
  progress,
  progressMessage,
  status,
  error,
  onChooseAnother,
  onContinue,
}) {
  const busy = status === 'reading';

  return (
    <section className="screen">
      <h1>Importer un document</h1>
      <p className="lead">
        PDF, JPG, JPEG ou PNG. Vous pouvez aussi prendre une photo avec
        l’appareil photo du téléphone.
      </p>

      <div className="card stack">
        <p>
          Fichier choisi :{' '}
          <span className="file-name">{fileName || 'aucun fichier'}</span>
        </p>
        {busy ? (
          <div>
            <p className="status-row">
              <LoaderCircle size={22} aria-hidden="true" />
              {progressMessage || 'Lecture du document en cours…'}
            </p>
            <div className="progress" aria-label="Progression de la lecture">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : null}
        {status === 'ready' ? (
          <p>Le texte a été lu. Vérifiez-le à l’écran suivant.</p>
        ) : null}
      </div>

      {error ? (
        <p className="error status-row" role="alert">
          <AlertCircle size={22} aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}

      <div className="footer-actions">
        <BigButton onClick={onContinue} disabled={!fileName || busy || status === 'error'}>
          Continuer vers le texte
        </BigButton>
        <BigButton variant="ghost" onClick={onChooseAnother} disabled={busy}>
          Choisir un autre fichier
        </BigButton>
      </div>
    </section>
  );
}
