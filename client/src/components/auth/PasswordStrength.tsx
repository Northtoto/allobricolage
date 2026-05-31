import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";

interface PasswordRequirement {
  label: string;
  met: boolean;
}

export interface PasswordStrengthResult {
  score: number;
  isValid: boolean;
  requirements: PasswordRequirement[];
}

const MIN_LENGTH = 8;

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const requirements: PasswordRequirement[] = [];
  let score = 0;

  const hasMinLength = password.length >= MIN_LENGTH;
  requirements.push({ label: `Au moins ${MIN_LENGTH} caractères`, met: hasMinLength });
  if (hasMinLength) score++;

  const hasUpper = /[A-Z]/.test(password);
  requirements.push({ label: "Une majuscule (A-Z)", met: hasUpper });
  if (hasUpper) score++;

  const hasLower = /[a-z]/.test(password);
  requirements.push({ label: "Une minuscule (a-z)", met: hasLower });
  if (hasLower) score++;

  const hasDigit = /\d/.test(password);
  requirements.push({ label: "Un chiffre (0-9)", met: hasDigit });
  if (hasDigit) score++;

  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  requirements.push({ label: "Un caractère spécial (!@#$...)", met: hasSpecial });
  if (hasSpecial) score++;

  const hasNoRepeat = !/(.)(\1{2,})/.test(password);
  if (!hasNoRepeat) {
    score = Math.max(0, score - 1);
    requirements.push({ label: "Pas de répétitions" });
  }

  return {
    score,
    isValid: score >= 3 && hasMinLength,
    requirements,
  };
}

function getScoreColor(score: number): string {
  if (score <= 1) return "bg-red-500";
  if (score <= 2) return "bg-orange-500";
  if (score <= 3) return "bg-yellow-500";
  if (score <= 4) return "bg-blue-500";
  return "bg-green-500";
}

function getScoreLabel(score: number): string {
  if (score <= 1) return "Très faible";
  if (score <= 2) return "Faible";
  if (score <= 3) return "Moyen";
  if (score <= 4) return "Fort";
  return "Excellent";
}

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const { score, isValid, requirements } = checkPasswordStrength(password);
  const percentage = (score / 5) * 100;

  return (
    <div className="space-y-3 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Force du mot de passe</span>
        <span className={`text-xs font-semibold ${
          isValid ? "text-green-600" : "text-orange-500"
        }`}>
          {getScoreLabel(score)}
        </span>
      </div>
      <Progress value={percentage} className={`h-1.5 ${getScoreColor(score)}`} />

      <ul className="space-y-1">
        {requirements.filter((r) => r.label).map((req, i) => (
          <li key={i} className="flex items-center gap-1.5 text-xs">
            {req.met ? (
              <Check className="w-3 h-3 text-green-500 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-red-400 shrink-0" />
            )}
            <span className={req.met ? "text-green-600" : "text-muted-foreground"}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
