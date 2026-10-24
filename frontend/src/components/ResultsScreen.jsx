import {
  Banknote,
  Calendar,
  CircleAlert,
  Handshake,
  ListChecks,
  User,
} from 'lucide-react';
import BigButton from './BigButton.jsx';

const SECTIONS = [
  {
    id: 'summary',
    title: 'En résumé',
    icon: ListChecks,
    placeholder: 'De quoi parle le document ? Cette partie sera remplie après l’analyse.',
  },
  {
    id: 'you',
    title: 'Ce que vous devez faire',
    icon: User,
    placeholder: 'Les obligations qui vous concernent apparaîtront ici.',
  },
  {
    id: 'other',
    title: 'Ce que l’autre partie doit faire',
    icon: Handshake,
    placeholder: 'Les obligations de l’autre signataire ou de l’organisme apparaîtront ici.',
  },
  {
    id: 'money',
    title: 'Argent',
    icon: Banknote,
    placeholder: 'Montants, paiements et pénalités explicitement écrits dans le document.',
  },
  {
    id: 'dates',
    title: 'Dates importantes',
    icon: Calendar,
    placeholder: 'Échéances et durées présentes dans le document.',
  },
  {
    id: 'checks',
    title: 'Points à vérifier',
    icon: CircleAlert,
    placeholder: 'Clauses peu claires, risques possibles et questions à poser avant de signer.',
  },
];

export default function ResultsScreen({ analysis, onListen, onBack }) {
  return (
    <section className="screen">
      <h1>Explication du document</h1>
      <p className="lead">
        Ces informations viendront du texte que vous avez vérifié. Rien
        ne sera inventé.
      </p>

      <div className="result-grid">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const content = analysis?.[section.id] || section.placeholder;
          return (
            <article className="card result-block" key={section.id}>
              <h2>
                <Icon size={22} aria-hidden="true" />
                {section.title}
              </h2>
              <p>{content}</p>
            </article>
          );
        })}
      </div>

      <div className="footer-actions">
        <BigButton onClick={onListen}>Écouter en éwé</BigButton>
        <BigButton variant="ghost" onClick={onBack}>
          Modifier le texte
        </BigButton>
      </div>
    </section>
  );
}
