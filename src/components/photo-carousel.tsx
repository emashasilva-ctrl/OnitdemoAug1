import Image from "next/image";

export interface CarouselPhoto {
  src: string;
  alt: string;
}

const SLOT_SECONDS = 6;

export function PhotoCarousel({ photos }: { photos: CarouselPhoto[] }) {
  const duration = photos.length * SLOT_SECONDS;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {photos.map((photo, i) => (
        <div
          key={photo.src}
          className="carousel-slide absolute inset-0"
          style={{
            animationDuration: `${duration}s`,
            animationDelay: `${i * SLOT_SECONDS}s`,
          }}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover grayscale contrast-[1.15] brightness-[0.85]"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75" />
    </div>
  );
}
