import type { APIRoute } from 'astro';
import { iconPaths, brandMark } from '../components/icons/paths';

// Sprite icon dùng chung cho cả site (xem components/icons/paths.ts): trình duyệt tải một lần rồi cache.
export const GET: APIRoute = () => {
  const groups = Object.entries(iconPaths).map(([name, d]) => `<g id="${name}">${d}</g>`).join('');
  const body = `<svg xmlns="http://www.w3.org/2000/svg">${groups}<g id="brand">${brandMark}</g></svg>`;
  return new Response(body, { headers: { 'Content-Type': 'image/svg+xml' } });
};
