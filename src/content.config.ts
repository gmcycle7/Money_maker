import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /** 文章內要推薦的工具 slug */
    tools: z.array(z.string()).default([]),
    /** 側欄推薦的聯盟商品類別 */
    offers: z.enum(['creditCards', 'brokers', 'loans', 'insurance', 'savings']).default('creditCards'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { guides };
