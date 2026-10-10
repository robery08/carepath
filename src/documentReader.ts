import type { VoiceLanguage } from "./voice";

export type DocumentProgress = (message: string, progress?: number) => void;
export type DocumentTextResult = {
  text: string;
  pagesRead: number;
  totalPages: number;
  truncated: boolean;
  usedOcr: boolean;
};

const MAX_PDF_PAGES = 8;

export async function readDocumentText(file: File, language: VoiceLanguage, progress: DocumentProgress): Promise<DocumentTextResult> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return readPdf(file, language, progress);
  }
  if (!file.type.startsWith("image/")) throw new Error("Choose a photo or PDF file.");
  const worker = await createOcrWorker(language, progress);
  let preparedImage: Blob = file;
  let canvas: HTMLCanvasElement | null = null;
  try {
    progress("Reading the photo on this device…", 0.15);
    if ("createImageBitmap" in window) {
      const bitmap = await createImageBitmap(file);
      try {
        const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
        if (scale < 1) {
          canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(bitmap.width * scale));
          canvas.height = Math.max(1, Math.round(bitmap.height * scale));
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) throw new Error("This browser could not prepare the photo for reading.");
          context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          preparedImage = await new Promise<Blob>((resolve, reject) => canvas?.toBlob((blob) => blob ? resolve(blob) : reject(new Error("This browser could not resize the photo.")), "image/jpeg", 0.9));
        }
      } finally {
        bitmap.close();
      }
    }
    const result = await worker.recognize(preparedImage);
    progress("Text extraction finished. Review every word.", 1);
    return { text: result.data.text.trim(), pagesRead: 1, totalPages: 1, truncated: false, usedOcr: true };
  } finally {
    if (canvas) { canvas.width = 0; canvas.height = 0; }
    await worker.terminate();
  }
}

async function readPdf(file: File, language: VoiceLanguage, progress: DocumentProgress): Promise<DocumentTextResult> {
  const [{ GlobalWorkerOptions, getDocument }, workerModule] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  const pdfWorkerUrl = workerModule.default;
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const loading = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await loading.promise;
  const pageCount = Math.min(pdf.numPages, MAX_PDF_PAGES);
  const textPages: string[] = [];
  let worker: Awaited<ReturnType<typeof createOcrWorker>> | null = null;
  let usedOcr = false;

  try {
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      progress(`Reading PDF page ${pageNumber} of ${pageCount}…`, (pageNumber - 1) / pageCount);
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => "str" in item ? item.str : "").filter(Boolean).join(" ").trim();
      if (pageText) {
        textPages.push(`[Page ${pageNumber}]\n${pageText}`);
        continue;
      }

      // Scanned PDFs have no selectable text. Render at a bounded size and OCR one page at a time.
      worker ??= await createOcrWorker(language, progress);
      usedOcr = true;
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(1.65, 1400 / Math.max(baseViewport.width, baseViewport.height));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("This browser could not prepare a PDF page for reading.");
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const result = await worker.recognize(canvas);
      const scannedText = result.data.text.trim();
      if (scannedText) textPages.push(`[Page ${pageNumber} · OCR]\n${scannedText}`);
      canvas.width = 0;
      canvas.height = 0;
    }
  } finally {
    await worker?.terminate();
    await loading.destroy();
  }

  progress("Text extraction finished. Review every word.", 1);
  return { text: textPages.join("\n\n"), pagesRead: pageCount, totalPages: pdf.numPages, truncated: pdf.numPages > MAX_PDF_PAGES, usedOcr };
}

async function createOcrWorker(language: VoiceLanguage, progress: DocumentProgress) {
  const { createWorker } = await import("tesseract.js");
  progress("Preparing on-device text reading. First use may download the language model…", 0.05);
  const worker = await createWorker(language === "kn" ? "kan" : "eng", undefined, {
    cacheMethod: "write",
    logger: (message) => {
      if (message.status) progress(`On-device OCR: ${message.status}`, message.progress);
    },
  });
  return worker;
}
