import * as schema from './schema.mjs';
import * as unique from './unique.mjs';
import * as sections from './sections.mjs';
import * as related from './related.mjs';
import * as legalRefs from './legal-refs.mjs';
import * as verification from './verification.mjs';
import * as keywords from './keywords.mjs';
import * as numbers from './numbers.mjs';
import * as links from './links.mjs';

// Thêm kiểm tra mới: tạo file trong checks/ rồi đăng ký ở đây.
export const checks = [schema, unique, sections, related, legalRefs, verification, keywords, numbers, links];
