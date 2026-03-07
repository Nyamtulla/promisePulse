import chokidar from 'chokidar';
import { join } from 'path';

const ARTIFACTS_PATH = process.env.ARTIFACTS_PATH || './artifacts';
const INCOMING_DIR = join(process.cwd(), ARTIFACTS_PATH, 'incoming');
const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const DEBOUNCE_MS = 2500;

const processedFiles = new Set<string>();
const pendingFiles = new Map<string, NodeJS.Timeout>();

function shouldIgnore(filename: string): boolean {
  if (!filename) return true;
  if (filename.startsWith('.') || filename.endsWith('~')) return true;
  if (filename.endsWith('.tmp') || filename.endsWith('.swp')) return true;
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext || !['txt', 'md', 'pdf'].includes(ext)) return true;
  return false;
}

async function processFile(filePath: string) {
  const filename = filePath.split(/[/\\]/).pop() || '';
  const key = filename.toLowerCase();
  if (processedFiles.has(key)) return;
  processedFiles.add(key);

  try {
    const res = await fetch(`${API_BASE}/api/internal/process-artifact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, filename }),
    });
    const data = await res.json();
    if (data.error) {
      console.error(`[Watcher] Error processing ${filename}:`, data.error);
    } else {
      console.log(`[Watcher] Processed ${filename} -> artifact ${data.artifactId}`);
    }
  } catch (err) {
    console.error(`[Watcher] Failed to process ${filename}:`, err);
  } finally {
    processedFiles.delete(key);
  }
}

function scheduleProcess(filePath: string) {
  const filename = filePath.split(/[/\\]/).pop() || '';
  if (shouldIgnore(filename)) return;

  const existing = pendingFiles.get(filePath);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    pendingFiles.delete(filePath);
    processFile(filePath);
  }, DEBOUNCE_MS);
  pendingFiles.set(filePath, timer);
}

function main() {
  console.log(`[Watcher] Watching ${INCOMING_DIR}`);
  chokidar
    .watch(INCOMING_DIR, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 1000 },
    })
    .on('add', (path) => {
      scheduleProcess(path);
    });
}

main();
