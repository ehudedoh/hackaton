import { Pause, Play, Volume2 } from 'lucide-react';
import BigButton from './BigButton.jsx';

export default function AudioScreen({
  eweText,
  audioUrl,
  loading,
  error,
  playing,
  onTogglePlay,
  onBack,
}) {
  return (
    <section className="screen">
      <h1>Traduction en éwé</h1>
      <p className="lead">
        Lisez la traduction, puis écoutez-la. La voix utilise le modèle
        éwé déjà préparé sur cet ordinateur.
      </p>

      <article className="card">
        <h2 className="status-row">
          <Volume2 size={22} aria-hidden="true" />
          Texte en éwé
        </h2>
        <p className="ewe-text">
          {eweText ||
            'La traduction en éwé apparaîtra ici après l’analyse.'}
        </p>
      </article>

      {loading ? (
        <p className="card">
          Préparation de la voix… Le premier chargement peut durer une à
          deux minutes.
        </p>
      ) : null}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="footer-actions">
        <BigButton
          onClick={onTogglePlay}
          disabled={loading || !eweText}
          icon={playing ? <Pause size={24} /> : <Play size={24} />}
        >
          {playing ? 'Mettre en pause' : 'Écouter'}
        </BigButton>
        <BigButton variant="ghost" onClick={onBack}>
          Revenir à l’explication
        </BigButton>
      </div>
    </section>
  );
}
