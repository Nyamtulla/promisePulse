import { readFile } from 'fs/promises';
import { extname } from 'path';

const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.pdf'];

export interface ReadResult {
  filename: string;
  fileType: string;
  extractedText: string;
  size: number;
}

export function isSupportedFile(filename: string): boolean {
  const ext = extname(filename).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

export async function readArtifact(filePath: string, filename: string): Promise<ReadResult> {
  const ext = extname(filename).toLowerCase();
  const buffer = await readFile(filePath);
  const size = buffer.length;

  if (ext === '.txt' || ext === '.md') {
    const extractedText = buffer.toString('utf-8');
    return {
      filename,
      fileType: ext.slice(1),
      extractedText,
      size,
    };
  }

  if (ext === '.pdf') {
    // Dynamic import to avoid loading pdfjs-dist (requires canvas/DOMMatrix) until needed.
    // This prevents upload-artifact route from crashing on Vercel cold start.
    try {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const result = await parser.getText();
        await parser.destroy();
        return {
          filename,
          fileType: 'pdf',
          extractedText: result.text || '',
          size,
        };
      } catch (e) {
        await parser.destroy();
        throw e;
      }
    } catch (loadErr) {
      const msg =
        loadErr instanceof Error ? loadErr.message : String(loadErr);
      if (msg.includes('DOMMatrix') || msg.includes('canvas') || msg.includes('@napi-rs/canvas')) {
        throw new Error(
          'PDF parsing is unavailable in this environment. Please upload .txt or .md files instead, or convert your PDF to text before uploading.'
        );
      }
      throw loadErr;
    }
  }

  throw new Error(`Unsupported file type: ${ext}`);
}
