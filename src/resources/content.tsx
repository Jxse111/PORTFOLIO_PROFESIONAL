import {
  About,
  Blog,
  Gallery,
  Home,
  Newsletter,
  Person,
  Social,
  Work,
} from "@/types";
import { Line, Logo, Row, Text } from "@once-ui-system/core";

const person: Person = {
  firstName: "José",
  lastName: "Martínez Estrada",
  name: `José`,
  role: "Desarrollador Web",
  avatar: "/images/avatar.png",
  email: "josemartinezestrada111@gmail.com",
  location: "Europe/Madrid",
  languages: ["Español(Nativo)", "Inglés(A2)", "Francés(A1)"],
};

const newsletter: Newsletter = {
  display: true,
  title: (
    <>
      Suscribete a mi boletín de información, para obtener las últimas noticias.
    </>
  ),
  description: (
    <>
      Mi boletín de noticias semanales sobre novedades en el mundo del
      desarrollo e informática.
    </>
  ),
};

const social: Social = [
  {
    name: "GitHub",
    icon: "github",
    link: "https://github.com/jxse111",
  },
  {
    name: "LinkedIn",
    icon: "linkedin",
    link: "https://www.linkedin.com/in/jos%C3%A9-mart%C3%ADnez-estrada-997b77208/",
  },
  {
    name: "Email",
    icon: "email",
    link: `mailto:${person.email}`,
  },
];

const home: Home = {
  path: "/",
  image: "/images/og/home.jpg",
  label: "Inicio",
  title: `Portfolio Profesional de ${person.name}`,
  description: `Portfolio profesional sobre mi trabajo como ${person.role}`,
  headline: <>Haciendo que el diseño cobre vida en cada línea de código.</>,
  featured: {
    display: true,
    title: (
      <Row gap="12" vertical="center">
        <strong className="ml-4">ESQUILS</strong>{" "}
        <Line background="brand-alpha-strong" vert height="20" />
        <Text marginRight="4" onBackground="brand-medium">
          Proyectos destacados
        </Text>
      </Row>
    ),
    href: "/work/Esquils",
  },
  subline: (
    <>
      Mi nombre es José, soy el desarrollador web. Creo y desarrollo proyectos
      web para empresas y clientes.
      <br /> Después del trabajo desarrollo mis propios proyectos y sigo
      formándome.
    </>
  ),
};

const about: About = {
  path: "/about",
  label: "Sobre Mí",
  title: `Sobre mí – ${person.name}`,
  description: `Meet ${person.name}, ${person.role} from ${person.location}`,
  tableOfContent: {
    display: true,
    subItems: false,
  },
  avatar: {
    display: true,
  },
  calendar: {
    display: true,
    link: "https://cal.com",
  },
  intro: {
    display: true,
    title: "Introduction",
    description: (
      <>
        Apasionado por la tecnología y el desarrollo web Siempre estoy en busca
        de aprender y mejorar, tanto en el ámbito de la programación como en el
        de la informática, abarcando desde el hardware hasta el software. Soy
        perseverante y disfruto viendo los resultados de mi esfuerzo,
        compartiendo ideas y aprendiendo de los demás.
      </>
    ),
  },
  work: {
    display: true, // set to false to hide this section
    title: "Experiencia laboral",
    experiences: [
      {
        company: "Berdea SAT",
        timeframe: "currently working",
        role: "Full-stack Developer",
        achievements: [
          <>
            Actualmente trabajo como desarrollador full-stack en Berdea SAT,
            donde colaboro en el desarrollo de aplicaciones web y la gestión de
            proyectos.
          </>,
        ],
      },
      {
        company: "TECH LINKU GROUP SL",
        timeframe: "03/2025 - 06/2025",
        role: "Técnico en prácticas",
        achievements: [
          <>
            Colaboré con los departamentos de IT, comercial y técnico en la
            gestión de productos electrónicos, control de inventario y
            desarrollo web, así como en el diseño de elementos visuales
            publicitarios para la página.
          </>,
        ],
      },
      {
        company: "Updigital Almeria",
        timeframe: "03/2022 - 06/2022",
        role: "Técnico en reparación de equipos informáticos",
        achievements: [
          <>
            Realicé la parte de montaje, reparación y mantenimiento de equipos
            informáticos.
          </>,
        ],
        images: [],
      },
    ],
  },
  studies: {
    display: true, // set to false to hide this section
    title: "Estudios",
    institutions: [
      {
        name: "IES Aguadulce",
        description: (
          <>
            DAW: Formación de grado superior en Desarrollo de Aplicaciones Web.
          </>
        ),
      },
      {
        name: "IES Campos de Níjar",
        description: (
          <>
            SMR: Formación de grado medio en Sistemas Microinformáticos y Redes.
          </>
        ),
      },
    ],
  },
  technical: {
    display: true, // set to false to hide this section
    title: "Habilidades técnicas",
    skills: [
      {
        title: "Primer año académico (DAW)",
        description: (
          <>
            Experiencia en programación en Java, diseño y gestión de bases de
            datos con MySQL/SQL Live, desarrollo de interfaces básicas con HTML
            y CSS, y creación de pruebas unitarias utilizando JUnit.
          </>
        ),
        tags: [
          {
            name: "java",
            icon: "java",
          },
          {
            name: "MySQL",
            icon: "MySQL",
          },
          {
            name: "HTML",
            icon: "HTML",
          },
          {
            name: "CSS",
            icon: "CSS",
          },
          {
            name: "JUnit",
            icon: "JUnit",
          },
        ],
      },
      {
        title: "Segundo año académico (DAW)",
        description: (
          <>
            Experiencia en desarrollo con PHP y gestión de bases de datos
            mediante PhpMyAdmin. Manejo de entornos locales con XAMPP,
            desarrollo de APIs RESTful y uso del framework Angular 17. Durante
            mi proyecto de fin de curso adquirí conocimientos prácticos en
            Docker, incluyendo Docker Compose y la creación de Dockerfiles.
          </>
        ),
        tags: [
          {
            name: "php",
            icon: "php",
          },
          {
            name: "angular",
            icon: "angular",
          },
          {
            name: "phpmyadmin",
            icon: "phpmyadmin",
          },
          {
            name: "docker",
            icon: "docker",
          },
        ],
        // optional: leave the array empty if you don't want to display images
        images: [
          {
            src: "/images/projects/algrano/ALGRANO.png",
            alt: "Imagen Algrano",
            width: 16,
            height: 9,
          },
        ],
      },
      {
        title:
          "Habilidades adquiridas en Sistemas Microinformáticos y Redes (SMR)",
        description: (
          <>
            Experiencia en ensamblaje y mantenimiento de equipos de sobremesa y
            portátiles, incluyendo la instalación, configuración y optimización
            del sistema para un rendimiento eficiente. Conocimientos en
            ciberseguridad básica y administración de redes locales (LAN/WLAN),
            así como en la detección y resolución de incidencias técnicas.
            Durante la formación adquirí competencias en instalación de sistemas
            operativos, gestión de servidores, configuración de dispositivos de
            red, soporte técnico a usuarios y seguridad informática a nivel
            básico.
          </>
        ),
        tags: [
          {
            name: "apache tomcat",
            icon: "apache Tomcat",
          },
          {
            name: "ubuntu server",
            icon: "ubuntu server",
          },
          {
            name: "windows server",
            icon: "windows server",
          },
        ],
      },
    ],
  },
};

const blog: Blog = {
  path: "/blog",
  label: "Blog",
  title: "Escribiendo sobre desarrollo y nuevas tecnologías...",
  description: `ee lo que ${person.name} ha estado haciendo recientemente.`,
  // Create new blog posts by adding a new .mdx file to app/blog/posts
  // All posts will be listed on the /blog route
};

const work: Work = {
  path: "/work",
  label: "Proyectos",
  title: `Mis proyectos`,
  description: `Proyectos creados y desarrollados por ${person.name}`,
  // Create new project pages by adding a new .mdx file to app/blog/posts
  // All projects will be listed on the /home and /work routes
};

const gallery: Gallery = {
  path: "/gallery",
  label: "Galería de imágenes",
  title: `Galería de imágenes – ${person.name}`,
  description: `Album creado por ${person.name}`,
  // Images by https://lorant.one
  // These are placeholder images, replace with your own
  images: [
    {
      src: "/images/gallery/Paisaje2.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/Paisaje1.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/Paisaje4.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/Paisaje3.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/Paisaje5.jpg",
      alt: "image",
      orientation: "vertical",
    },
  ],
};

export { person, social, newsletter, home, about, blog, work, gallery };
