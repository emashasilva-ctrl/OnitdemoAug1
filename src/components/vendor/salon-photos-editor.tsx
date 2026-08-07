"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImageFile } from "@/lib/image";
import { updateSalonPhotos } from "@/lib/actions/vendor";

const MAX_GALLERY_IMAGES = 6;
const fileInputClass =
  "text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/70";

export function SalonPhotosEditor({
  salonId,
  initialCoverImage,
  initialGalleryImages,
}: {
  salonId: string;
  initialCoverImage: string | null;
  initialGalleryImages: string[];
}) {
  const router = useRouter();
  const [coverImage, setCoverImage] = useState(initialCoverImage);
  const [galleryImages, setGalleryImages] = useState(initialGalleryImages);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);

  const isDirty =
    coverImage !== initialCoverImage ||
    JSON.stringify(galleryImages) !== JSON.stringify(initialGalleryImages);

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setProcessing(true);
    try {
      setCoverImage(await compressImageFile(file, 1600, 0.85));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't process that photo.");
    }
    setProcessing(false);
  }

  async function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const remaining = MAX_GALLERY_IMAGES - galleryImages.length;
    if (remaining <= 0) {
      toast.error(`You can upload up to ${MAX_GALLERY_IMAGES} gallery photos.`);
      return;
    }

    setProcessing(true);
    try {
      const compressed = await Promise.all(
        files.slice(0, remaining).map((file) => compressImageFile(file, 1200, 0.82))
      );
      setGalleryImages((prev) => [...prev, ...compressed]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't process those photos.");
    }
    setProcessing(false);
  }

  function removeGalleryImage(index: number) {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateSalonPhotos(salonId, { coverImage, galleryImages });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Photos updated");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div>
        <p className="font-heading font-semibold text-foreground">Photos</p>
        <p className="text-sm text-muted-foreground">
          A cover photo and gallery shots for your public salon page. Without one, we show a
          placeholder graphic instead.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">Cover photo</p>
        {coverImage && (
          <div className="relative w-full max-w-xs overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL preview */}
            <img src={coverImage} alt="Salon cover" className="aspect-4/3 w-full object-cover" />
            <button
              type="button"
              onClick={() => setCoverImage(null)}
              aria-label="Remove cover photo"
              className="absolute top-2 right-2 rounded-full bg-background/90 p-1 text-foreground hover:bg-background"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleCoverChange} className={fileInputClass} />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">
          Gallery photos ({galleryImages.length}/{MAX_GALLERY_IMAGES})
        </p>
        {galleryImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {galleryImages.map((src, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element -- data URL preview */}
                <img src={src} alt={`Gallery photo ${i + 1}`} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(i)}
                  aria-label={`Remove gallery photo ${i + 1}`}
                  className="absolute top-1.5 right-1.5 rounded-full bg-background/90 p-1 text-foreground hover:bg-background"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {galleryImages.length < MAX_GALLERY_IMAGES && (
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryChange}
            className={fileInputClass}
          />
        )}
      </div>

      <Button onClick={handleSave} disabled={saving || processing || !isDirty} className="w-fit">
        {saving ? "Saving…" : processing ? "Processing photos…" : "Save photos"}
      </Button>
    </div>
  );
}
