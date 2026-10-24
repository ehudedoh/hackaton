import { Camera, FileUp, Info } from 'lucide-react';
import BigButton from './BigButton.jsx';

export default function HomeScreen({ onAddDocument, onTakePhoto, canInstall, onInstall }) {
  return (
    <section className="screen">
      <div className="hero">
        <p className="kicker">JuriLex</p>
        <h1>Comprendre avant de signer.</h1>
        <p className="lead">
          Ajoutez votre document pour comprendre ce qu’il signifie.
        </p>
      </div>

      <div className="stack">
        <BigButton onClick={onAddDocument} icon={<FileUp size={26} aria-hidden="true" />}>
          Ajouter mon document
        </BigButton>
        <BigButton
          variant="secondary"
          onClick={onTakePhoto}
          icon={<Camera size={26} aria-hidden="true" />}
        >
          Prendre une photo
        </BigButton>
        {canInstall ? (
          <BigButton variant="ghost" onClick={onInstall}>
            Installer l’application
          </BigButton>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: '1.4rem' }}>
        <p className="legal status-row">
          <Info size={22} aria-hidden="true" />
          <span>
            JuriLex aide à comprendre un document. Ce n’est pas un avocat
            et cela ne remplace pas un professionnel du droit. L’explication
            envoie le texte à Gemma 4 (Google). La lecture du fichier reste
            dans votre navigateur.
          </span>
        </p>
      </div>
    </section>
  );
}
