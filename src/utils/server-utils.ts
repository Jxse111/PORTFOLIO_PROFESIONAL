import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { notFound } from "next/navigation";

export type ServerPost = {
  slug: string;
  metadata: {
    title: string;
    publishedAt: string;
    summary: string;
    image?: string;
    images?: string[];
    tags?: string[];
    team?: Array<{
      name: string;
      role: string;
      avatar: string;
      linkedIn: string;
    }>;
    link?: string;
  };
  content: string;
};

export function getServerPosts(): ServerPost[] {
  const postsDirectory = path.join(process.cwd(), "src", "app", "blog", "posts");

  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory).filter(file => file.endsWith('.mdx'));

  const posts: ServerPost[] = fileNames.map(fileName => {
    const filePath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug: fileName.replace(/\.mdx$/, ""),
      metadata: {
        title: data.title || "",
        publishedAt: data.publishedAt || "",
        summary: data.summary || "",
        image: data.image || undefined,
        images: Array.isArray(data.images) ? data.images : [],
        tags: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
        team: Array.isArray(data.team) ? data.team : [],
        link: data.link || undefined,
      },
      content: content || "",
    };
  });

  return posts;
}
