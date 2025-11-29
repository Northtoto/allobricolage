import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { IStorage } from "../storage";
import { randomUUID } from "crypto";

export function configureGoogleAuth(storage: IStorage) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5003/api/auth/google/callback";

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️ Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("🔵 Google OAuth callback triggered");
          console.log("📧 Google email:", profile.emails?.[0]?.value);
          console.log("👤 Google profile name:", profile.displayName);
          console.log("🆔 Google ID:", profile.id);

          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || email?.split("@")[0] || "User";
          const profilePicture = profile.photos?.[0]?.value;

          // Check if user already exists with this Google ID
          let user = await storage.getUserByGoogleId(googleId);

          if (!user) {
            // Check if user exists by email (for linking accounts)
            if (email) {
              user = await storage.getUserByEmail(email);

              if (user) {
                // Link Google account to existing user
                user = await storage.updateUser(user.id, {
                  googleId,
                  profilePicture: profilePicture || user.profilePicture,
                });
                console.log(`✅ Linked Google account to existing user: ${user?.username}`);
              }
            }

            if (!user) {
              // Create new user with Google OAuth (SIGN-UP)
              // Generate unique username from email
              let baseUsername = email?.split("@")[0] || `google_${googleId.substring(0, 8)}`;
              let username = baseUsername;
              let counter = 1;

              // Ensure username is unique
              while (await storage.getUserByUsername(username)) {
                username = `${baseUsername}_${counter}`;
                counter++;
              }

              user = await storage.createUser({
                username,
                name,
                email,
                googleId,
                profilePicture,
                role: "client",
                password: undefined, // No password for OAuth users
              });

              console.log(`✅ New Google user created (SIGN-UP): ${user.username} (${user.email})`);
            }
          } else {
            // User exists - update profile picture if changed
            if (profilePicture && user.profilePicture !== profilePicture) {
              const updatedUser = await storage.updateUser(user.id, {
                profilePicture,
              });
              if (updatedUser) {
                user = updatedUser;
              }
            }
            console.log(`✅ Google user signed in: ${user.username}`);
          }

          console.log("✅ User authenticated successfully via Google OAuth");
          return done(null, user);
        } catch (error) {
          console.error("❌ Google OAuth error:", error);
          return done(error as Error);
        }
      }
    )
  );

  console.log("✅ Google OAuth configured");
}

