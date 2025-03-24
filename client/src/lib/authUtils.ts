import { apiRequest } from "./queryClient";
import { queryClient } from "./queryClient";
import { User } from "@shared/schema";

/**
 * Check if the current user is authenticated
 * @returns True if the user is authenticated, false otherwise
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const data = await queryClient.fetchQuery({
      queryKey: ['/api/auth/session'],
      staleTime: 1000 * 60, // 1 minute
    });
    return !!data?.user;
  } catch (error) {
    return false;
  }
};

/**
 * Get the current user data
 * @returns The user data or null if not authenticated
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const data = await queryClient.fetchQuery({
      queryKey: ['/api/user'],
      staleTime: 1000 * 60, // 1 minute
    });
    return data || null;
  } catch (error) {
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
  await queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
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
  await queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
  return response.user;
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  await apiRequest('POST', '/api/auth/logout', {});
  await queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
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
    await apiRequest('GET', `/api/user/verify-email/${token}`, {});
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
