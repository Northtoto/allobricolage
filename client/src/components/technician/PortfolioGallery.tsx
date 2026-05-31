import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Camera } from "lucide-react";

interface PortfolioImage {
  id: string;
  imageUrl: string;
  title: string | null;
  description: string | null;
  isBeforeAfter: boolean;
  category: string | null;
}

interface PortfolioGalleryProps {
  technicianId: string;
}

export function PortfolioGallery({ technicianId }: PortfolioGalleryProps) {
  const { data: images, isLoading } = useQuery<PortfolioImage[]>({
    queryKey: ["/api/portfolio/technician", technicianId],
  });
  const [selectedImage, setSelectedImage] = useState<PortfolioImage | null>(null);

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Portfolio</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Portfolio ({images.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => setSelectedImage(img)}
            >
              <img
                src={img.imageUrl}
                alt={img.title ?? "Portfolio"}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              {img.isBeforeAfter && (
                <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                  Before / After
                </div>
              )}
              {img.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs font-medium truncate">{img.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title ?? ""}
                className="w-full max-h-[70vh] object-contain bg-black"
              />
              {(selectedImage.title || selectedImage.description) && (
                <div className="p-4 bg-white">
                  {selectedImage.title && (
                    <h3 className="font-semibold text-lg">{selectedImage.title}</h3>
                  )}
                  {selectedImage.description && (
                    <p className="text-muted-foreground text-sm mt-1">{selectedImage.description}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
