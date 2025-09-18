"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Goftino?: {
      setUser?: (u: any) => void;
      open?: () => void;
      close?: () => void;
      toggle?: () => void;
    };
  }
}

export default function GoftinoWidget() {
  const id = process.env.NEXT_PUBLIC_GOFTINO_ID;
  if (!id) return null;

  // نمونه تنظیم کاربر (اختیاری) — می‌توانید حذف کنید
  useEffect(() => {
    const onReady = () => {
      // window.Goftino?.setUser?.({ name: "کاربر", email: "user@example.com" });
    };
    window.addEventListener("goftino_ready", onReady);
    return () => window.removeEventListener("goftino_ready", onReady);
  }, []);

  return (
    <Script
      id="goftino-loader"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
(function(){
  var i="${id}",a=window,d=document;
  function g(){
    var g=d.createElement("script"),
        s="https://www.goftino.com/widget/"+i,
        l=localStorage.getItem("goftino_"+i);
    g.async=!0; g.src=l?s+"?o="+l:s;
    d.getElementsByTagName("head")[0].appendChild(g);
  }
  if(d.readyState==="complete") g();
  else a.addEventListener("load",g,false);
})();
        `,
      }}
    />
  );
}
