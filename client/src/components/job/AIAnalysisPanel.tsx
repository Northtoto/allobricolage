import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n";
import { Cpu, Sparkles, AlertTriangle, Clock, Wrench, Loader2 } from "lucide-react";
import type { JobAnalysis } from "@shared/schema";

interface AIAnalysisPanelProps {
  analysis: JobAnalysis | null;
  isLoading: boolean;
}

export function AIAnalysisPanel({ analysis, isLoading }: AIAnalysisPanelProps) {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold">Analyse IA en cours</h3>
            <p className="text-sm text-muted-foreground">{t("job.analyzing")}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="p-6 border-dashed">
        <div className="text-center text-muted-foreground">
          <Cpu className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">L'IA analysera votre demande automatiquement</p>
        </div>
      </Card>
    );
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "emergency": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "high": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "normal": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-green-500/10 text-green-500 border-green-500/20";
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "complex": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "moderate": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-green-500/10 text-green-500 border-green-500/20";
    }
  };

  const urgencyLabels: Record<string, string> = {
    emergency: "Urgence",
    high: "Urgent",
    normal: "Normal",
    low: "Pas pressé",
  };

  const complexityLabels: Record<string, string> = {
    complex: "Complexe",
    moderate: "Modéré",
    simple: "Simple",
  };

  const serviceLabels: Record<string, string> = {
    plomberie: "Plomberie",
    electricite: "Électricité",
    peinture: "Peinture",
    menuiserie: "Menuiserie",
    climatisation: "Climatisation",
    maconnerie: "Maçonnerie",
    carrelage: "Carrelage",
    serrurerie: "Serrurerie",
    jardinage: "Jardinage",
    nettoyage: "Nettoyage",
  };

  return (
    <Card className="p-6 border-primary/20 bg-primary/5">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Analyse IA</h3>
          <p className="text-sm text-muted-foreground">Résultats de l'analyse automatique</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Service Detected */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wrench className="h-4 w-4" />
            {t("ai.service")}
          </div>
          <Badge variant="secondary" className="font-medium">
            {serviceLabels[analysis.service] || analysis.service}
          </Badge>
        </div>

        {/* Sub-services */}
        {analysis.subServices && analysis.subServices.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {analysis.subServices.map((sub, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {sub}
              </Badge>
            ))}
          </div>
        )}

        {/* Urgency */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            {t("ai.urgency")}
          </div>
          <Badge className={`${getUrgencyColor(analysis.urgency)} border`}>
            {urgencyLabels[analysis.urgency] || analysis.urgency}
          </Badge>
        </div>

        {/* Complexity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cpu className="h-4 w-4" />
            {t("ai.complexity")}
          </div>
          <Badge className={`${getComplexityColor(analysis.complexity)} border`}>
            {complexityLabels[analysis.complexity] || analysis.complexity}
          </Badge>
        </div>

        {/* Estimated Duration */}
        {analysis.estimatedDuration && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {t("ai.duration")}
            </div>
            <span className="text-sm font-medium">{analysis.estimatedDuration}</span>
          </div>
        )}

        {/* Confidence Score */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{t("ai.confidence")}</span>
            <span className="text-sm font-semibold text-primary">
              {Math.round(analysis.confidence * 100)}%
            </span>
          </div>
          <Progress value={analysis.confidence * 100} className="h-2" />
        </div>

        {/* Keywords */}
        {analysis.extractedKeywords && analysis.extractedKeywords.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2">Mots-clés détectés:</p>
            <div className="flex flex-wrap gap-1">
              {analysis.extractedKeywords.map((keyword, idx) => (
                <Badge key={idx} variant="outline" className="text-xs bg-background">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
