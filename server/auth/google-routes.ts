import type { Express } from "express";
import passport from "passport";
import type { User } from "../../shared/schema";

export function registerGoogleAuthRoutes(app: Express) {
  // Initiate Google OAuth flow
  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );

  // Google OAuth callback
  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login?error=google_auth_failed",
    }),
    (req, res) => {
      // Successful authentication
      console.log("✅ Google authentication successful:", req.user);

      // Set session and explicitly save it
      if (req.session && req.user) {
        const user = req.user as User;
        req.session.userId = user.id;

        // Explicitly save session before redirecting
        req.session.save((err) => {
          if (err) {
            console.error("❌ Error saving session:", err);
            return res.redirect("/login?error=session_error");
          }

          console.log("✅ Session saved successfully. User ID:", user.id);
          // Redirect to home page or dashboard
          res.redirect("/");
        });
      } else {
        console.error("❌ No session or user found");
        res.redirect("/login?error=no_session");
      }
    }
  );

  console.log("✅ Google auth routes registered");
}

