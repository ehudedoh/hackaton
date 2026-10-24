import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import AppHeader from './components/AppHeader.jsx';
import AudioScreen from './components/AudioScreen.jsx';
import BigButton from './components/BigButton.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import ImportScreen from './components/ImportScreen.jsx';
import OfflineBanner from './components/OfflineBanner.jsx';
import ResultsScreen from './components/ResultsScreen.jsx';
import ReviewScreen from './components/ReviewScreen.jsx';
import { analyzeDocument } from './services/api.js';
import { revokeAudioUrl } from './services/audioService.js';
import {
  ACCEPT_ATTRIBUTE,
  extractText,
  isAcceptedFile,
  rejectMessage,
} from './services/documentService.js';

const EMPTY_ANALYSIS = {
  summary: '',
  you: '',
  other: '',
  money: '',
  dates: '',
  checks: '',
};

export default function App() {
  const [screen, setScreen] = useState('home');
  const [fileName, setFileName] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [progress, setProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('idle');
  const [importError, setImportError] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [extractWarning, setExtractWarning] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [analysis, setAnalysis] = useState(EMPTY_ANALYSIS);
  const [eweText, setEweText] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [online, setOnline] = useState(
    () => (typeof navigator === 'undefined' ? true : navigator.onLine),
  );
  const [installEvent, setInstallEvent] = useState(null);

  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const audioRef = useRef(null);
  const jobRef = useRef(0);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const onInstall = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    window.addEventListener('beforeinstallprompt', onInstall);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeinstallprompt', onInstall);
    };
  }, []);

  useEffect(() => {
    return () => {
      revokeAudioUrl(audioUrl);
    };
  }, [audioUrl]);

  const resetSession = () => {
    jobRef.current += 1;
    revokeAudioUrl(audioUrl);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
    setScreen('home');
    setFileName('');
    setExtractedText('');
    setProgress(0);
    setImportStatus('idle');
    setImportError('');
    setProgressMessage('');
    setExtractWarning('');
    setAnalyzing(false);
    setAnalyzeError('');
    setAnalysis(EMPTY_ANALYSIS);
    setEweText('');
    setAudioUrl(null);
    setAudioLoading(false);
    setAudioError('');
    setPlaying(false);
  };

  const openFilePicker = () => {
    setImportError('');
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    setImportError('');
    photoInputRef.current?.click();
  };

  const handleFile = async (file) => {
    if (!isAcceptedFile(file)) {
      setFileName(file?.name || '');
      setImportError(rejectMessage(file));
      setImportStatus('error');
      setScreen('import');
      return;
    }

    const job = jobRef.current + 1;
    jobRef.current = job;
    setFileName(file.name);
    setImportError('');
    setExtractWarning('');
    setExtractedText('');
    setImportStatus('reading');
    setProgress(4);
    setProgressMessage('Ouverture du fichier…');
    setScreen('import');

    try {
      const result = await extractText(
        file,
        ({ percent, message }) => {
          if (jobRef.current !== job) {
            return;
          }
          setProgress(percent);
          setProgressMessage(message);
        },
        () => jobRef.current !== job,
      );
      if (jobRef.current !== job) {
        return;
      }
      setExtractedText(result.text);
      setExtractWarning(result.warning);
      setImportStatus('ready');
      setProgress(100);
      setScreen('review');
    } catch {
      if (jobRef.current !== job) {
        return;
      }
      setImportStatus('error');
      setImportError(
        'La lecture a échoué. Réessayez avec un autre fichier, ou recopiez le texte.',
      );
    }
  };

  const onFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current || !audioUrl) {
      setAudioError('La voix n’est pas encore disponible.');
      return;
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    setAudioLoading(true);
    try {
      await audioRef.current.play();
      setPlaying(true);
      setAudioError('');
    } catch {
      setAudioError('Impossible de lancer l’écoute pour le moment.');
    } finally {
      setAudioLoading(false);
    }
  };

  return (
    <div className="app">
      {!online ? <OfflineBanner /> : null}
      <AppHeader showHome={screen !== 'home'} onHome={() => setScreen('home')} />

      <input
        ref={fileInputRef}
        className="hidden-input"
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        onChange={onFileChange}
      />
      <input
        ref={photoInputRef}
        className="hidden-input"
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        capture="environment"
        onChange={onFileChange}
      />
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onEnded={() => setPlaying(false)}
      />

      {screen === 'home' ? (
        <HomeScreen
          onAddDocument={openFilePicker}
          onTakePhoto={openCamera}
          canInstall={Boolean(installEvent)}
          onInstall={async () => {
            await installEvent?.prompt();
            setInstallEvent(null);
          }}
        />
      ) : null}
      {screen === 'import' ? (
        <ImportScreen
          fileName={fileName}
          progress={progress}
          progressMessage={progressMessage}
          status={importStatus}
          error={importError}
          onChooseAnother={openFilePicker}
          onContinue={() => setScreen('review')}
        />
      ) : null}
      {screen === 'review' ? (
        <ReviewScreen
          text={extractedText}
          fileName={fileName}
          onChangeText={setExtractedText}
          warning={extractWarning}
          analyzing={analyzing}
          analyzeError={analyzeError}
          onAnalyze={async () => {
            setAnalyzeError('');
            setAnalyzing(true);
            try {
              const result = await analyzeDocument(extractedText);
              setAnalysis({
                summary: result.summary,
                you: result.you,
                other: result.other,
                money: result.money,
                dates: result.dates,
                checks: result.checks,
              });
              setEweText(result.ewe || '');
              setScreen('results');
            } catch (error) {
              setAnalyzeError(
                error.message ||
                  'L’analyse n’a pas fonctionné. Vérifiez la connexion et la clé API.',
              );
            } finally {
              setAnalyzing(false);
            }
          }}
        />
      ) : null}
      {screen === 'results' ? (
        <ResultsScreen
          analysis={analysis}
          onListen={() => setScreen('audio')}
          onBack={() => setScreen('review')}
        />
      ) : null}
      {screen === 'audio' ? (
        <AudioScreen
          eweText={eweText}
          audioUrl={audioUrl}
          loading={audioLoading}
          error={audioError}
          playing={playing}
          onTogglePlay={togglePlay}
          onBack={() => setScreen('results')}
        />
      ) : null}

      {screen !== 'home' ? (
        <div className="screen" style={{ paddingTop: 0 }}>
          <BigButton
            variant="danger"
            onClick={resetSession}
            icon={<RotateCcw size={22} aria-hidden="true" />}
          >
            Effacer et recommencer
          </BigButton>
        </div>
      ) : null}
    </div>
  );
}
