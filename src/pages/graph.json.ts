import type { APIRoute } from 'astro';
import { graphData } from '../lib/graph';

// Bố cục tính sẵn lúc build (tools/graph/layout.mjs); trình duyệt chỉ vẽ, không mô phỏng.
export const GET: APIRoute = async () => {
  const { json } = await graphData();
  return new Response(JSON.stringify(json), { headers: { 'Content-Type': 'application/json' } });
};
