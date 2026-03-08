import { Readable } from 'stream';

let pinata: Awaited<ReturnType<typeof loadPinata>> | null = null;

async function loadPinata() {
  const { default: PinataClient } = await import('@pinata/sdk');
  const apiKey = process.env.PINATA_API_KEY;
  const secret = process.env.PINATA_SECRET;
  if (!apiKey || !secret) {
    throw new Error('PINATA_API_KEY and PINATA_SECRET must be set');
  }
  return new PinataClient(apiKey, secret);
}

async function getPinata() {
  if (!pinata) {
    pinata = await loadPinata();
  }
  return pinata;
}

export async function uploadFileToPinata(filePath: string, filename: string): Promise<string> {
  const client = await getPinata();
  const result = await client.pinFromFS(filePath, {
    pinataMetadata: { name: filename },
  });
  return result.IpfsHash;
}

export async function uploadBufferToPinata(buffer: Buffer, filename: string): Promise<string> {
  const client = await getPinata();
  const stream = Readable.from(buffer);
  const result = await client.pinFileToIPFS(stream, {
    pinataMetadata: { name: filename },
  });
  return result.IpfsHash;
}
