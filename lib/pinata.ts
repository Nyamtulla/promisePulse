import PinataClient from '@pinata/sdk';
import { Readable } from 'stream';

let pinata: PinataClient | null = null;

function getPinata(): PinataClient {
  const apiKey = process.env.PINATA_API_KEY;
  const secret = process.env.PINATA_SECRET;
  if (!apiKey || !secret) {
    throw new Error('PINATA_API_KEY and PINATA_SECRET must be set');
  }
  if (!pinata) {
    pinata = new PinataClient(apiKey, secret);
  }
  return pinata;
}

export async function uploadFileToPinata(filePath: string, filename: string): Promise<string> {
  const client = getPinata();
  const result = await client.pinFromFS(filePath, {
    pinataMetadata: { name: filename },
  });
  return result.IpfsHash;
}

export async function uploadBufferToPinata(buffer: Buffer, filename: string): Promise<string> {
  const client = getPinata();
  const stream = Readable.from(buffer);
  const result = await client.pinFileToIPFS(stream, {
    pinataMetadata: { name: filename },
  });
  return result.IpfsHash;
}
