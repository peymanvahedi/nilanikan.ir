// src/components/SizeGuideModal.tsx
"use client";
import React from "react";

export default function SizeGuideModal({
  open,
  onClose,
  title,
  html,
  imageUrl,
  linkUrl,
}: {
  open: boolean;
  onClose: () => void;
  title?: string | null;
  html?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      dir="rtl"
    >
      <div
        className="absolute inset-0 grid place-items-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white ring-1 ring-zinc-200 shadow-xl">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b bg-white">
            <h3 className="text-base md:text-lg font-extrabold text-zinc-900">
              {title || "راهنمای سایز"}
            </h3>
            <button
              onClick={onClose}
              className="h-9 w-9 grid place-items-center rounded-full bg-zinc-100 text-zinc-700"
              aria-label="بستن"
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M18.3 5.71 12 12l-6.29-6.29-1.42 1.42L10.59 13.4l-6.3 6.29 1.42 1.42L12 14.83l6.29 6.28 1.42-1.41-6.3-6.3 6.3-6.29z"
                />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            {html ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : null}

            {imageUrl ? (
              <div className="mt-3 rounded-xl overflow-hidden ring-1 ring-zinc-200">
                <img src={imageUrl} alt="راهنمای سایز" className="w-full h-auto" />
              </div>
            ) : null}

            {linkUrl && !html && !imageUrl ? (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-pink-700 hover:underline"
              >
                مشاهده راهنمای سایز
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42L17.59 5H14V3Z"
                  />
                  <path
                    fill="currentColor"
                    d="M5 5h5V3H3v7h2V5Z"
                  />
                </svg>
              </a>
            ) : null}

            {!html && !imageUrl && !linkUrl ? (
              <div className="text-sm text-zinc-500">راهنمای سایزی ثبت نشده است.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
