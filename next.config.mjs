import mdx from "@next/mdx";

const withMDX = mdx({
  extension: /\.mdx?$/,
  options: {},
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  transpilePackages: ["next-mdx-remote"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
        pathname: "**",
      },
      {
        // Imágenes de la galería subidas a Vercel Blob.
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "**",
      },
    ],
  },
  /**
   * Los proyectos se leen del sistema de archivos en tiempo de ejecución, y el
   * trazado automático de Next no detecta esas rutas dinámicas. Sin esto, las
   * páginas que se regeneran (la portada es ISR por el feed de noticias) se
   * ejecutan en una función donde los .mdx no existen.
   */
  outputFileTracingIncludes: {
    "/": ["./src/app/work/projects/**/*"],
    "/work": ["./src/app/work/projects/**/*"],
    "/work/[slug]": ["./src/app/work/projects/**/*"],
    "/sitemap.xml": ["./src/app/work/projects/**/*"],
    "/llms.txt": ["./src/app/work/projects/**/*"],
  },

  // El blog se retiró en favor de /noticias: redirigimos las URLs ya indexadas.
  async redirects() {
    return [
      { source: "/blog", destination: "/noticias", permanent: true },
      { source: "/blog/:slug", destination: "/noticias", permanent: true },
    ];
  },
  sassOptions: {
    compiler: "modern",
    silenceDeprecations: ["legacy-js-api"],
  },
};

export default withMDX(nextConfig);
