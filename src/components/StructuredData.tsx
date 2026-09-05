import { baseURL } from "@/resources";
import { about, blog, home, person, social, work } from "@/resources/content";

/**
 * Datos estructurados (JSON-LD) de schema.org.
 *
 * Es la forma de decirle a Google —y a los buscadores con IA, que leen esto
 * antes que el diseño— quién eres, a qué te dedicas, dónde estás y cómo
 * contactarte. Sin esto, un buscador solo ve texto suelto y tiene que adivinar.
 */
export function StructuredData() {
  const personSchema = {
    "@type": "Person",
    "@id": `${baseURL}/#persona`,
    name: `${person.firstName} ${person.lastName}`,
    givenName: person.firstName,
    familyName: person.lastName,
    jobTitle: person.role,
    description:
      "Desarrollador web full-stack especializado en aplicaciones a medida con Next.js, Angular, PHP y Java.",
    email: `mailto:${person.email}`,
    image: `${baseURL}${person.avatar}`,
    url: baseURL,
    sameAs: social.filter((s) => s.link?.startsWith("http")).map((s) => s.link),
    // Ubicación: lo que permite aparecer en búsquedas del tipo
    // "desarrollador web en Almería".
    address: {
      "@type": "PostalAddress",
      addressLocality: person.city.split(",")[0].trim(),
      addressRegion: person.region,
      addressCountry: person.countryCode,
    },
    worksFor: {
      "@type": "Organization",
      name: "Berdea SAT",
    },
    alumniOf: about.studies.institutions.map((i) => ({
      "@type": "EducationalOrganization",
      name: i.name,
    })),
    knowsAbout: [
      "Desarrollo web",
      "Next.js",
      "React",
      "TypeScript",
      "Angular",
      "PHP",
      "Java",
      "MySQL",
      "Docker",
      "APIs REST",
      "Administración de sistemas y redes",
    ],
    knowsLanguage: [
      { "@type": "Language", name: "Español" },
      { "@type": "Language", name: "Inglés" },
      { "@type": "Language", name: "Francés" },
    ],
  };

  const websiteSchema = {
    "@type": "WebSite",
    "@id": `${baseURL}/#web`,
    url: baseURL,
    name: home.title,
    description: home.description,
    inLanguage: "es-ES",
    publisher: { "@id": `${baseURL}/#persona` },
  };

  const profileSchema = {
    "@type": "ProfilePage",
    "@id": `${baseURL}${about.path}#perfil`,
    url: `${baseURL}${about.path}`,
    name: about.title,
    description: about.description,
    inLanguage: "es-ES",
    mainEntity: { "@id": `${baseURL}/#persona` },
  };

  const breadcrumbSchema = {
    "@type": "BreadcrumbList",
    "@id": `${baseURL}/#navegacion`,
    itemListElement: [
      { name: home.label, path: home.path },
      { name: about.label, path: about.path },
      { name: work.label, path: work.path },
      { name: blog.label, path: blog.path },
    ].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseURL}${item.path === "/" ? "" : item.path}`,
    })),
  };

  const graph = {
    "@context": "https://schema.org",
    "@graph": [personSchema, websiteSchema, profileSchema, breadcrumbSchema],
  };

  return (
    <script
      type="application/ld+json"
      // Única forma de emitir JSON-LD en React. El contenido es propio y estático.
      // biome-ignore lint/security/noDangerouslySetInnerHtml: no entra nada del usuario
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
