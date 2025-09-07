"use client";
import React from "react";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
};

/** اگر src خالی باشد، هیچ چیزی رندر نمی‌شود. همیشه <img> بومی رندر می‌کنیم (نه SafeImg). */
export default function SafeImg({ src, fallbackSrc, ...rest }: Props) {
  const s = (typeof src === "string" ? src : ((src as unknown) ?? "") as string).toString().trim();
  if (!s) return null;
  return <img src={s} {...rest} />;
}
