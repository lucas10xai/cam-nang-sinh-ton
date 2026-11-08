import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL: gốc tuyệt đối của site (mặc định https://2k.io.vn).
// BASE_PATH: đường dẫn con (mặc định "/"); github.io dùng "/cam-nang-sinh-ton".
// SITE_INDEXABLE: "true" mới cho công cụ tìm kiếm lập chỉ mục (mặc định false: noindex, robots Disallow, không sitemap).
const site = (process.env.SITE_URL || 'https://2k.io.vn').replace(/\/+$/, '');
const rawBase = (process.env.BASE_PATH || '/').trim();
const base = '/' + rawBase.replace(/^\/+|\/+$/g, '');
const indexable = process.env.SITE_INDEXABLE === 'true';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: indexable ? [sitemap()] : [],
});
