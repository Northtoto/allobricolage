import type { Express } from "express";
import passport from "passport";

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
      
      // Set session
      if (req.session) {
        req.session.userId = req.user?.id;
      }
      
      // Redirect to home page or dashboard
      res.redirect("/");
    }
  );

  console.log("✅ Google auth routes registered");
}

