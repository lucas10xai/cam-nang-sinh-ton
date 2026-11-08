import type { APIRoute } from 'astro';
import { SITE_INDEXABLE } from '../lib/site';
import { url } from '../lib/url';

export const GET: APIRoute = ({ site }) => {
  const body = SITE_INDEXABLE
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL(url('/sitemap-index.xml'), site)}\n`
    : `User-agent: *\nDisallow: /\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
