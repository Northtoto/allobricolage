import { Star, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReviewCardProps {
  review: {
    id: string;
    clientName?: string;
    rating: number;
    comment: string;
    serviceQuality?: number;
    punctuality?: number;
    professionalism?: number;
    valueForMoney?: number;
    isVerified: boolean;
    technicianResponse?: string;
    createdAt: Date | string | null;
  };
}

export function ReviewCard({ review }: ReviewCardProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Date inconnue";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-900">
                {review.clientName || "Client"}
              </span>
              {review.isVerified && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Vérifié
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              {renderStars(review.rating)}
              <span className="text-sm text-gray-500">
                {formatDate(review.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-gray-700 mb-4">{review.comment}</p>

        {/* Detailed ratings */}
        {(review.serviceQuality ||
          review.punctuality ||
          review.professionalism ||
          review.valueForMoney) && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg mb-4">
            {review.serviceQuality && (
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 mb-1">
                  Qualité du service
                </span>
                {renderStars(review.serviceQuality)}
              </div>
            )}
            {review.punctuality && (
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 mb-1">Ponctualité</span>
                {renderStars(review.punctuality)}
              </div>
            )}
            {review.professionalism && (
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 mb-1">
                  Professionnalisme
                </span>
                {renderStars(review.professionalism)}
              </div>
            )}
            {review.valueForMoney && (
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 mb-1">
                  Rapport qualité/prix
                </span>
                {renderStars(review.valueForMoney)}
              </div>
            )}
          </div>
        )}

        {/* Technician response */}
        {review.technicianResponse && (
          <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded">
            <p className="text-sm font-semibold text-blue-900 mb-1">
              Réponse du technicien
            </p>
            <p className="text-sm text-blue-800">{review.technicianResponse}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}




