import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { EntrySchema } from '../schema/entry.mjs';
import { ChapterSchema } from '../schema/chapter.mjs';

// Nội dung đọc từ CONTENT_DIR (mặc định "content"); chạy fixtures: CONTENT_DIR=src/fixtures/content
const root = (process.env.CONTENT_DIR ?? 'content').replace(/\/$/, '');

const entries = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: `${root}/entries`,
    generateId: ({ data }) => String(data.id),
  }),
  schema: EntrySchema,
});

const chapters = defineCollection({
  loader: glob({
    pattern: '*.md',
    base: `${root}/chapters`,
    generateId: ({ data }) => String(data.number),
  }),
  schema: ChapterSchema,
});

export const collections = { entries, chapters };
