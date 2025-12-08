import { toFumadocsSource } from 'fumadocs-mdx/runtime/server';
import { loader } from "fumadocs-core/source";
import { blogPosts } from 'fumadocs-mdx:collections/server';

export const blog = loader({
  baseUrl: "/blog",
  source: toFumadocsSource(blogPosts, [])
});