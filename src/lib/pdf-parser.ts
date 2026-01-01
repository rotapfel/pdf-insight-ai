import * as pdfjsLib from 'pdfjs-dist';
import type { ExtractionProgress } from './types';

// Set the worker source using unpkg CDN which has better CORS support
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  charCount: number;
}

export async function extractTextFromPDF(
  file: File,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<PDFExtractionResult> {
  if (!file.type.includes('pdf')) {
    throw new Error('Invalid file type. Please upload a PDF file.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);

  onProgress?.({
    current: 0,
    total: 0,
    status: 'extracting',
    message: 'Loading PDF...',
  });

  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
  const pageCount = pdf.numPages;

  onProgress?.({
    current: 0,
    total: pageCount,
    status: 'extracting',
    message: `Extracting text from ${pageCount} pages...`,
  });

  const textParts: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    textParts.push(pageText);

    onProgress?.({
      current: i,
      total: pageCount,
      status: 'extracting',
      message: `Extracting page ${i} of ${pageCount}...`,
    });
  }

  const fullText = textParts.join('\n\n');

  onProgress?.({
    current: pageCount,
    total: pageCount,
    status: 'complete',
    message: 'Extraction complete!',
  });

  return {
    text: fullText,
    pageCount,
    charCount: fullText.length,
  };
}
