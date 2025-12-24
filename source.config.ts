import { defineCollections, frontmatterSchema } from "fumadocs-mdx/config";
import z from "zod";

export const blogPosts = defineCollections({
  type: "doc",
  dir: "content/blog",
  schema: frontmatterSchema.extend({
    author: z.string(),
    date: z.date(),
  }),
});
