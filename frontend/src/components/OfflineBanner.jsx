import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  return (
    <div className="banner banner-offline" role="status">
      <WifiOff size={22} aria-hidden="true" />
      <p>
        Pas de connexion. Vous pouvez préparer un document, mais
        l’explication, la traduction et la voix ont besoin d’internet.
      </p>
    </div>
  );
}
