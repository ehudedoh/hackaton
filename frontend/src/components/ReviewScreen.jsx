import { AlertCircle } from 'lucide-react';
import BigButton from './BigButton.jsx';

export default function ReviewScreen({
  text,
  onChangeText,
  onAnalyze,
  fileName,
  warning,
  analyzing,
  analyzeError,
}) {
  const empty = !text.trim();

  return (
    <section className="screen">
      <h1>Vérifier le texte</h1>
      <p className="lead">
        Relisez le texte reconnu. Corrigez-le si besoin, puis demandez
        une explication simple.
      </p>

      {fileName ? (
        <p className="muted">Document : <span className="file-name">{fileName}</span></p>
      ) : null}

      {!empty && warning ? (
        <p className="error status-row" role="status">
          <AlertCircle size={22} aria-hidden="true" />
          <span>{warning}</span>
        </p>
      ) : null}

      {empty ? (
        <p className="error status-row" role="status">
          <AlertCircle size={22} aria-hidden="true" />
          <span>
            Aucun texte n’a été lu. Recopiez le texte ici, ou choisissez
            une photo plus nette.
          </span>
        </p>
      ) : null}

      <label htmlFor="extracted-text">Texte du document</label>
      <textarea
        id="extracted-text"
        value={text}
        onChange={(event) => onChangeText(event.target.value)}
        placeholder="Le texte du document apparaîtra ici."
      />

      {analyzeError ? (
        <p className="error" role="alert">
          {analyzeError}
        </p>
      ) : null}

      <p className="legal">
        En appuyant sur « Comprendre ce document », le texte est envoyé
        à Gemma 4 (service Google) pour l’explication et la traduction
        en éwé. Ce n’est pas un traitement entièrement local.
      </p>

      <div className="footer-actions">
        <BigButton onClick={onAnalyze} disabled={empty || analyzing}>
          {analyzing ? 'Analyse en cours…' : 'Comprendre ce document'}
        </BigButton>
      </div>
    </section>
  );
}
