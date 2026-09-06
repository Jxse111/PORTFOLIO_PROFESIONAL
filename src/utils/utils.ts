import fs from "fs";
import path from "path";
import matter from "gray-matter";

type Team = {
  name: string;
  role: string;
  avatar: string;
  linkedIn: string;
};

type Metadata = {
  title: string;
  publishedAt: string;
  summary: string;
  image?: string;
  images: string[];
  tag?: string;
  team: Team[];
  link?: string;
  /** Tecnologías del proyecto, declaradas en el frontmatter del .mdx */
  technologies?: string[];
};

/**
 * Leer contenido que falta NO puede tumbar la página.
 *
 * Antes, si el directorio de proyectos no estaba disponible, esto llamaba a
 * `notFound()` y convertía en 404 cualquier página que listara proyectos.
 * Eso fue exactamente lo que rompió la portada: al ser ISR se regeneraba en
 * una función serverless donde los .mdx no estaban incluidos, y cada
 * regeneración la dejaba en 404 aunque el HTML del build fuese correcto.
 *
 * Ahora la ausencia de contenido devuelve una lista vacía: como mucho se deja
 * de ver una sección, pero la página sigue en pie. El fallo real (que los .mdx
 * lleguen a la función) se corrige con `outputFileTracingIncludes` en
 * next.config.mjs; esto es la red de seguridad.
 */
function getMDXFiles(dir: string) {
  if (!fs.existsSync(dir)) {
    console.warn(`[content] directorio no encontrado: ${dir}`);
    return [];
  }

  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

function readMDXFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[content] archivo no encontrado: ${filePath}`);
    return null;
  }

  const rawContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(rawContent);

  const metadata: Metadata = {
    title: data.title || "",
    publishedAt: data.publishedAt,
    summary: data.summary || "",
    image: data.image || "",
    images: data.images || [],
    tag: data.tag || [],
    team: data.team || [],
    link: data.link || "",
    technologies: Array.isArray(data.technologies) ? data.technologies : [],
  };

  return { metadata, content };
}

function getMDXData(dir: string) {
  const mdxFiles = getMDXFiles(dir);
  return mdxFiles.flatMap((file) => {
    const parsed = readMDXFile(path.join(dir, file));
    if (!parsed) return [];

    return [
      {
        metadata: parsed.metadata,
        slug: path.basename(file, path.extname(file)),
        content: parsed.content,
      },
    ];
  });
}

export function getPosts(customPath = ["", "", "", ""]) {
  const postsDir = path.join(process.cwd(), ...customPath);
  return getMDXData(postsDir);
}
