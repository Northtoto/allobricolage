import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface GoogleSignInButtonProps {
  text?: string;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

/**
 * Google Sign-In via Google Identity Services. Obtains a verified ID token
 * (credential) client-side and sends it to the backend, which verifies it.
 * Renders nothing when VITE_GOOGLE_CLIENT_ID is not configured (feature off),
 * so we never ship a non-functional button.
 */
export function GoogleSignInButton(_props: GoogleSignInButtonProps) {
  const { googleLogin } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="w-full flex justify-center">
        <GoogleLogin
          onSuccess={async (response) => {
            if (!response.credential) {
              toast({ title: "Erreur", description: "Jeton Google manquant", variant: "destructive" });
              return;
            }
            try {
              await googleLogin(response.credential);
              setLocation("/");
            } catch {
              toast({ title: "Erreur", description: "Échec de la connexion Google", variant: "destructive" });
            }
          }}
          onError={() => {
            toast({ title: "Erreur", description: "Connexion Google annulée", variant: "destructive" });
          }}
          width="100%"
        />
      </div>
    </GoogleOAuthProvider>
  );
}
