// Schema meta chương: content/chapters/NN.md (SPEC §3).
import { z } from 'zod';

export const ChapterSchema = z.object({
  number: z.number().int().min(1).max(36),
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  entry_count: z.number().int().min(0),
});
