"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCodeGenerator from "qrcode";

export default function QRCode({ value, className = "" }: { value: string; className?: string }) {
  const [source, setSource] = useState("");
  useEffect(() => {
    let active = true;
    void QRCodeGenerator.toDataURL(value, { errorCorrectionLevel: "M", margin: 1, width: 240 })
      .then((url) => { if (active) setSource(url); });
    return () => { active = false; };
  }, [value]);
  if (!source) return <span className={className} aria-label="جاري إنشاء رمز QR" />;
  return <Image unoptimized width={240} height={240} src={source} alt={`QR ${value}`} className={className} />;
}
