import { defineCollection, z } from 'astro:content';

const blog = defineCollection({ type: 'content' }); // 或带 schema
const rooms = defineCollection({ type: 'content' });
const people = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

export const collections = { blog, rooms, people };