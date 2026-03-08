import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { processArtifact } from '@/lib/artifactProcessor';

const ARTIFACTS_PATH = process.env.ARTIFACTS_PATH || './artifacts';
const UPLOAD_DIR = 'uploaded';
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

interface GNewsArticle {
  title: string;
  description?: string;
  content?: string;
  url?: string;
  publishedAt?: string;
  source?: { name?: string };
}

export async function POST(request: Request) {
  try {
    if (!GNEWS_API_KEY) {
      return NextResponse.json(
        { error: 'GNEWS_API_KEY not configured. Add it to .env to fetch news.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const location = (body.location || '').trim();
    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    const query = `government pledge commitment ${location}`;
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=us&max=10&apikey=${GNEWS_API_KEY}`;

    const newsRes = await fetch(url, { next: { revalidate: 0 } });
    const newsData = await newsRes.json();

    if (!newsRes.ok) {
      return NextResponse.json(
        { error: newsData.message || 'Failed to fetch news' },
        { status: 502 }
      );
    }

    const articles = (newsData.articles || []) as GNewsArticle[];
    if (articles.length === 0) {
      return NextResponse.json({
        processed: 0,
        total: 0,
        message: 'No articles found for this location.',
      });
    }

    const uploadDir = join(process.cwd(), ARTIFACTS_PATH, UPLOAD_DIR);
    await mkdir(uploadDir, { recursive: true });

    let processed = 0;
    const errors: string[] = [];

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const text = [
        article.title || '',
        article.description || '',
        article.content || '',
        article.url ? `Source: ${article.url}` : '',
        article.source?.name ? `From: ${article.source.name}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      if (text.length < 50) continue;

      const safeTitle = (article.title || 'article').replace(/[^a-z0-9]/gi, '-').slice(0, 40);
      const filename = `news-${safeTitle}-${Date.now()}-${i}.txt`;
      const filePath = join(uploadDir, filename);

      try {
        await writeFile(filePath, text, 'utf-8');
        const result = await processArtifact(filePath);
        if (!result.error) processed++;
        else errors.push(`${safeTitle}: ${result.error}`);
      } catch (err) {
        errors.push(`${safeTitle}: ${err instanceof Error ? err.message : 'Failed'}`);
      }
    }

    return NextResponse.json({
      processed,
      total: articles.length,
      errors: errors.slice(0, 5),
      message: `Processed ${processed} of ${articles.length} articles.`,
    });
  } catch (err) {
    console.error('Fetch news error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
