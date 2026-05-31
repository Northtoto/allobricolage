import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useLocation } from "wouter";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (typeof window !== "undefined" && (window as Record<string, unknown>).__allobricolage_errors) {
      const errors = (window as Record<string, unknown[]>).__allobricolage_errors;
      errors.push({ error: error.message, stack: error.stack, info: errorInfo.componentStack, time: new Date().toISOString() });
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error }: { error?: Error }) {
  const [, setLocation] = useLocation();
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto animate-pulse">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-yellow-900">
            !
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Oups, quelque chose a mal tourne
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Nous avons rencontre une erreur inattendue. Pas de panique, nos equipes sont alertees.
          </p>
        </div>

        {isDev && error && (
          <div className="text-left bg-slate-900 rounded-xl p-4 overflow-auto max-h-48">
            <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">
              {error.message}
              {error.stack}
            </pre>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="rounded-full px-8"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Recharger la page
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full px-8"
            onClick={() => setLocation("/")}
          >
            <Home className="w-4 h-4 mr-2" />
            Retour a l accueil
          </Button>
        </div>

        <p className="text-sm text-slate-400 dark:text-slate-600">
          Code erreur: E{Math.floor(Math.random() * 9000) + 1000}
        </p>
      </div>
    </div>
  );
}
