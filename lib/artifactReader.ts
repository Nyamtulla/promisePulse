import { readFile } from 'fs/promises';
import { extname } from 'path';
import { PDFParse } from 'pdf-parse';

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
  }

  throw new Error(`Unsupported file type: ${ext}`);
}
