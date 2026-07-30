"use client";

import { ImagePlus, Trash2, User } from "lucide-react";
import { useRef, useState } from "react";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui";
import { useLang } from "@/components/language-provider";

const OUT_W = 360;
const OUT_H = 480; // 3:4 portrait

function cropTo3x4(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.onload = () => {
        const targetRatio = OUT_W / OUT_H;
        const srcRatio = img.width / img.height;
        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;
        if (srcRatio > targetRatio) {
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }
        const canvas = document.createElement("canvas");
        canvas.width = OUT_W;
        canvas.height = OUT_H;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unsupported"));
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUT_W, OUT_H);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function PhotoUpload({ value, onChange }: { value: string; onChange: (dataUrl: string) => void }) {
  const { t } = useLang();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "error", title: "Unsupported file", description: "Please choose a JPG or PNG image." });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ variant: "error", title: "Image too large", description: "Please choose an image under 8MB." });
      return;
    }
    setBusy(true);
    try {
      const cropped = await cropTo3x4(file);
      onChange(cropped);
    } catch {
      toast({ variant: "error", title: "Could not process image" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-2"
        style={{ width: 66, height: 88 }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <User className="h-6 w-6 text-muted" />
        )}
        {busy && <div className="ai-shimmer absolute inset-0" />}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} loading={busy}>
            <ImagePlus className="h-3.5 w-3.5" />
            {value ? t("sec.photo.replace") : t("sec.photo.upload")}
          </Button>
          {value && (
            <Button type="button" variant="dangerSoft" size="sm" onClick={() => onChange("")}>
              <Trash2 className="h-3.5 w-3.5" />
              {t("sec.photo.remove")}
            </Button>
          )}
        </div>
        <p className="text-[11.5px] text-muted">{t("sec.photo.sub")}</p>
      </div>
    </div>
  );
}
