// source.config.ts
import { defineCollections, frontmatterSchema } from "fumadocs-mdx/config";
import z from "zod";
var blogPosts = defineCollections({
  type: "doc",
  dir: "content/blog",
  schema: frontmatterSchema.extend({
    author: z.string(),
    date: z.date()
  })
});
export {
  blogPosts
};
