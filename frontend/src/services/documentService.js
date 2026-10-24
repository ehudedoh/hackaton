import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { createWorker } from 'tesseract.js';

GlobalWorkerOptions.workerSrc = pdfWorker;

export const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

export const ACCEPT_ATTRIBUTE =
  'application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png';

const MIN_TEXT_CHARS = 40;

export function isAcceptedFile(file) {
  if (!file) {
    return false;
  }
  const name = file.name.toLowerCase();
  const byExtension =
    name.endsWith('.pdf') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png');
  return ACCEPTED_TYPES.includes(file.type) || byExtension;
}

export function rejectMessage(file) {
  if (!file) {
    return 'Choisissez un PDF, une photo JPG ou une photo PNG.';
  }
  return `Le fichier « ${file.name} » n’est pas accepté. Utilisez un PDF, un JPG ou un PNG.`;
}

function isPdf(file) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function report(onProgress, percent, message) {
  onProgress?.({ percent, message });
}

function pageText(content) {
  const lines = [];
  let lastY = null;
  for (const item of content.items) {
    const value = item.str || '';
    if (!value) {
      continue;
    }
    const y = item.transform ? item.transform[5] : lastY;
    if (lastY !== null && Math.abs(y - lastY) > 4) {
      lines.push('\n');
    } else if (lines.length && !lines[lines.length - 1].endsWith('\n')) {
      lines.push(' ');
    }
    lines.push(value);
    lastY = y;
  }
  return lines.join('').replace(/[ \t]+\n/g, '\n').trim();
}

async function renderPage(page) {
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  return canvas;
}

export async function extractText(file, onProgress, isCancelled) {
  if (isCancelled?.()) {
    return { text: '', warning: '', method: 'none' };
  }
  report(onProgress, 5, 'Ouverture du fichier…');
  if (isPdf(file)) {
    return extractPdf(file, onProgress, isCancelled);
  }
  return extractImage(file, onProgress, isCancelled);
}

async function extractPdf(file, onProgress, isCancelled) {
  const data = await file.arrayBuffer();
  const pdf = await getDocument({ data }).promise;
  const pageTexts = [];
  let usedOcr = false;
  let ocrWorker = null;

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      if (isCancelled?.()) {
        break;
      }
      const base = Math.round(((pageNumber - 1) / pdf.numPages) * 90) + 5;
      report(onProgress, base, `Lecture de la page ${pageNumber} sur ${pdf.numPages}…`);
      const page = await pdf.getPage(pageNumber);
      let text = pageText(await page.getTextContent());
      if (text.replace(/\s/g, '').length < MIN_TEXT_CHARS) {
        usedOcr = true;
        report(
          onProgress,
          base + 5,
          `Texte peu lisible, lecture de la page ${pageNumber}…`,
        );
        if (!ocrWorker) {
          ocrWorker = await createWorker('fra');
        }
        const canvas = await renderPage(page);
        const result = await ocrWorker.recognize(canvas);
        canvas.width = 1;
        canvas.height = 1;
        text = (result.data?.text || '').trim();
      }
      if (text) {
        pageTexts.push(text);
      }
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    }
  } finally {
    if (ocrWorker) {
      await ocrWorker.terminate();
    }
  }

  const text = pageTexts.join('\n\n').trim();
  report(onProgress, 100, 'Lecture terminée.');
  let warning = '';
  if (!text) {
    warning =
      'Aucun texte n’a pu être lu. Vérifiez la photo, ou recopiez le texte.';
  } else if (usedOcr) {
    warning =
      'Une partie du document a été lue comme une image. Relisez et corrigez le texte.';
  }
  return { text, warning, method: usedOcr ? 'ocr' : 'pdf' };
}

async function extractImage(file, onProgress, isCancelled) {
  report(onProgress, 15, 'Lecture de la photo…');
  const worker = await createWorker('fra', 1, {
    logger: (info) => {
      if (info.status === 'recognizing text' && typeof info.progress === 'number') {
        report(onProgress, 20 + Math.round(info.progress * 75), 'Lecture de la photo…');
      }
    },
  });
  try {
    if (isCancelled?.()) {
      return { text: '', warning: '', method: 'none' };
    }
    const result = await worker.recognize(file);
    const text = (result.data?.text || '').trim();
    const confidence = result.data?.confidence ?? 0;
    report(onProgress, 100, 'Lecture terminée.');
    let warning = '';
    if (!text) {
      warning =
        'Aucun texte n’a pu être lu. Prenez une photo plus nette, ou recopiez le texte.';
    } else if (confidence < 55) {
      warning =
        'Le texte semble incomplet ou peu lisible. Corrigez-le avant de continuer.';
    }
    return { text, warning, method: 'ocr' };
  } finally {
    await worker.terminate();
  }
}
