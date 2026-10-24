import { Scale } from 'lucide-react';

export default function AppHeader({ onHome, showHome }) {
  return (
    <header className="topbar">
      <div className="brand-mark">
        <Scale size={28} aria-hidden="true" color="#1F5C4A" />
        <strong>JuriLex</strong>
      </div>
      {showHome ? (
        <button type="button" className="btn btn-ghost" onClick={onHome} style={{ width: 'auto', minHeight: '2.6rem' }}>
          Accueil
        </button>
      ) : null}
    </header>
  );
}
