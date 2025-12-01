import type { User, InsertUser } from "@shared/schema";
import { localStorageService, STORAGE_KEYS } from "./localStorage";

// Simple Base64 encoding for demo purposes (NOT production-safe)
function hashPassword(password: string): string {
  return btoa(password);
}

function verifyPassword(password: string, hash: string): boolean {
  try {
    return btoa(password) === hash;
  } catch {
    return false;
  }
}

export class LocalAuthService {
  
  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<User> {
    const user = await localStorageService.getUserByUsername(username);
    
    if (!user) {
      throw new Error("Invalid username or password");
    }
    
    if (!user.password) {
      throw new Error("This account uses OAuth login");
    }
    
    if (!verifyPassword(password, user.password)) {
      throw new Error("Invalid username or password");
    }
    
    // Store current user session
    this.setCurrentUser(user);
    
    return user;
  }
  
  /**
   * Signup new user
   */
  async signup(data: InsertUser & { password: string }): Promise<User> {
    // Check if username already exists
    const existingUser = await localStorageService.getUserByUsername(data.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }
    
    // Check if email already exists (if provided)
    if (data.email) {
      const existingEmail = await localStorageService.getUserByEmail(data.email);
      if (existingEmail) {
        throw new Error("Email already exists");
      }
    }
    
    // Hash password
    const hashedPassword = hashPassword(data.password);
    
    // Create user
    const user = await localStorageService.createUser({
      ...data,
      password: hashedPassword,
    });
    
    // Store current user session
    this.setCurrentUser(user);
    
    return user;
  }
  
  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
  
  /**
   * Get currently logged in user
   */
  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!stored) return null;
      
      const user = JSON.parse(stored);
      
      // Validate that user still exists in storage
      localStorageService.getUser(user.id).then(existingUser => {
        if (!existingUser) {
          // User was deleted, clear session
          this.logout();
        }
      });
      
      return user;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
  
  /**
   * Update current user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error("Not authenticated");
    }
    
    const updatedUser = await localStorageService.updateUser(currentUser.id, updates);
    if (!updatedUser) {
      throw new Error("Failed to update profile");
    }
    
    // Update session
    this.setCurrentUser(updatedUser);
    
    return updatedUser;
  }
  
  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }
    
    if (!user.password) {
      throw new Error("Cannot change password for OAuth accounts");
    }
    
    // Verify current password
    if (!verifyPassword(currentPassword, user.password)) {
      throw new Error("Current password is incorrect");
    }
    
    // Hash new password
    const hashedPassword = hashPassword(newPassword);
    
    // Update password
    await localStorageService.updateUser(user.id, { password: hashedPassword });
  }
  
  /**
   * Google OAuth login (mock for demo)
   */
  async loginWithGoogle(googleId: string, profile: {
    name: string;
    email: string;
    picture?: string;
  }): Promise<User> {
    // Check if user exists with this Google ID
    let user = await localStorageService.getUserByGoogleId(googleId);
    
    if (!user) {
      // Check if email exists
      const existingEmail = await localStorageService.getUserByEmail(profile.email);
      if (existingEmail) {
        // Link Google account to existing user
        user = await localStorageService.updateUser(existingEmail.id, {
          googleId,
          profilePicture: profile.picture || existingEmail.profilePicture,
        });
      } else {
        // Create new user
        user = await localStorageService.createUser({
          username: profile.email.split('@')[0] + '_' + Date.now(),
          password: null, // OAuth users don't have passwords
          name: profile.name,
          email: profile.email,
          role: "client",
          googleId,
          profilePicture: profile.picture,
          phone: null,
          city: null,
        });
      }
    }
    
    if (!user) {
      throw new Error("Failed to create user");
    }
    
    // Store current user session
    this.setCurrentUser(user);
    
    return user;
  }
  
  /**
   * Store current user in session
   */
  private setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }
}

// Export singleton instance
export const localAuth = new LocalAuthService();

