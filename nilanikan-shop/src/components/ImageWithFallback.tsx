'use client';

import Image from 'next/image';
import type { ImageProps } from 'next/image'; // 👈 اینجا تغییر دادیم
import { useState } from 'react';

export default function ImageWithFallback(props: ImageProps) {
  const { alt, onError, ...rest } = props;
  const [src, setSrc] = useState(
    typeof rest.src === 'string' ? rest.src : (rest.src as any)
  );

  return (
    <Image
      {...rest}
      alt={alt}
      src={src}
      onError={(e) => {
        setSrc('/placeholder.svg');
        if (onError) onError(e as any);
      }}
    />
  );
}
