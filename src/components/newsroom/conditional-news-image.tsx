"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type ConditionalNewsImageProps = {
  src?: string | null;
  alt: string;
  sizes: string;
  containerClassName: string;
  imageClassName: string;
  priority?: boolean;
  quality?: number;
  fill?: boolean;
};

function normalizeImageSrc(src?: string | null) {
  if (!src) {
    return null;
  }

  if (src.startsWith("/") || src.startsWith("https://") || src.startsWith("blob:") || src.startsWith("data:")) {
    return src;
  }

  return null;
}

export function ConditionalNewsImage({
  src,
  alt,
  sizes,
  containerClassName,
  imageClassName,
  priority,
  quality,
  fill = true,
}: ConditionalNewsImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(() => normalizeImageSrc(src));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImageSrc(normalizeImageSrc(src));
    setHasError(false);
  }, [src]);

  if (!imageSrc || hasError) {
    return null;
  }

  return (
    <div className={containerClassName}>
      <Image
        src={imageSrc}
        alt={alt}
        fill={fill}
        sizes={sizes}
        quality={quality}
        priority={priority}
        unoptimized={imageSrc.startsWith("https://") || imageSrc.startsWith("blob:") || imageSrc.startsWith("data:")}
        className={imageClassName}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
