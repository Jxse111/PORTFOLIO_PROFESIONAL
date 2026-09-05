import { Column, Heading, Meta, Schema } from "@once-ui-system/core";
import GalleryView from "@/components/gallery/GalleryView";
import GalleryUpload from "@/components/gallery/GalleryUpload";
import { getGalleryImages } from "@/lib/gallery/images";
import { baseURL, gallery, person } from "@/resources";

export async function generateMetadata() {
  return Meta.generate({
    title: gallery.title,
    description: gallery.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(gallery.title)}`,
    path: gallery.path,
  });
}

/** Las imágenes subidas se leen en cada visita, no en el build. */
export const dynamic = "force-dynamic";

export default async function Gallery() {
  const images = await getGalleryImages();

  return (
    <Column maxWidth="l" fillWidth paddingTop="24" gap="24">
      <Schema
        as="webPage"
        baseURL={baseURL}
        title={gallery.title}
        description={gallery.description}
        path={gallery.path}
        image={`/api/og/generate?title=${encodeURIComponent(gallery.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${gallery.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      <Heading as="h1" variant="display-strong-s" align="center">
        {gallery.title}
      </Heading>
      <GalleryUpload />
      <GalleryView images={images} />
    </Column>
  );
}
