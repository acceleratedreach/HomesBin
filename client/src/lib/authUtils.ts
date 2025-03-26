import { apiRequest } from "./queryClient";
import { queryClient } from "./queryClient";
import { User } from "@shared/schema";

// Token storage key
const TOKEN_KEY = 'auth_token';

/**
 * Get the stored auth token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Store the auth token
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Remove the auth token
 */
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Check if the current user is authenticated
 * @returns True if the user is authenticated, false otherwise
 */
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

/**
 * Get the current user data
 * @returns The user data or null if not authenticated
 */
export const getCurrentUser = async (): Promise<User | null> => {
  if (!isAuthenticated()) {
    return null;
  }
  
  try {
    const data = await queryClient.fetchQuery({
      queryKey: ['/api/auth/user'],
      staleTime: 1000 * 60, // 1 minute
    });
    return data || null;
  } catch (error) {
    // If the token is invalid, clear it
    if ((error as any)?.status === 401) {
      removeToken();
    }
    return null;
  }
};

/**
 * Login the user with username/email and password
 * @param username Username or email
 * @param password Password
 * @returns The user data
 */
export const login = async (username: string, password: string): Promise<User> => {
  const response = await apiRequest('POST', '/api/auth/login', { username, password });
  
  // Store the token
  if (response.token) {
    setToken(response.token);
  }
  
  // Invalidate any existing queries
  await queryClient.invalidateQueries();
  
  return response.user;
};

/**
 * Register a new user
 * @param userData User registration data
 * @returns The created user data
 */
export const register = async (userData: {
  username: string;
  email: string;
  password: string;
}): Promise<User> => {
  const response = await apiRequest('POST', '/api/auth/register', userData);
  
  // Store the token
  if (response.token) {
    setToken(response.token);
  }
  
  // Invalidate any existing queries
  await queryClient.invalidateQueries();
  
  return response.user;
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  // Simply remove the token
  removeToken();
  
  // Invalidate queries that require authentication
  await queryClient.invalidateQueries();
};

/**
 * Send email verification link
 * @returns True if successful
 */
export const sendVerificationEmail = async (): Promise<boolean> => {
  try {
    await apiRequest('POST', '/api/user/verify-email/send', {});
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Verify email with token
 * @param token Verification token
 * @returns True if verification succeeded
 */
export const verifyEmail = async (token: string): Promise<boolean> => {
  try {
    await apiRequest('GET', `/api/user/verify-email?token=${token}`, {});
    await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Update user password
 * @param currentPassword Current password
 * @param newPassword New password
 * @returns True if password was updated successfully
 */
export const updatePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<boolean> => {
  try {
    await apiRequest('POST', '/api/user/password', {
      currentPassword,
      newPassword,
    });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Update user profile information
 * @param userData User profile data to update
 * @returns Updated user data
 */
export const updateProfile = async (userData: Partial<User>): Promise<User> => {
  const response = await apiRequest('PATCH', '/api/user', userData);
  await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
  return response;
};
