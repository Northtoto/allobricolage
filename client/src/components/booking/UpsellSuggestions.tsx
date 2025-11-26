import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { Plus, Sparkles, Percent } from "lucide-react";
import type { UpsellSuggestion } from "@shared/schema";

interface UpsellSuggestionsProps {
  suggestions: UpsellSuggestion[];
  onAdd: (suggestion: UpsellSuggestion) => void;
}

export function UpsellSuggestions({ suggestions, onAdd }: UpsellSuggestionsProps) {
  const { t } = useI18n();

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 border-chart-4/20 bg-chart-4/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-chart-4/10">
          <Sparkles className="h-5 w-5 text-chart-4" />
        </div>
        <div>
          <h3 className="font-semibold">{t("upsell.title")}</h3>
          <p className="text-sm text-muted-foreground">Suggestions IA personnalisées</p>
        </div>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
            data-testid={`upsell-suggestion-${index}`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{suggestion.service}</span>
                {suggestion.discount > 0 && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20 border text-xs">
                    <Percent className="h-3 w-3 mr-1" />
                    -{suggestion.discount}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{suggestion.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-chart-4 rounded-full"
                    style={{ width: `${suggestion.probability * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round(suggestion.probability * 100)}% recommandé
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAdd(suggestion)}
              data-testid={`button-add-upsell-${index}`}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("upsell.add")}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
