import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/login
 * Login with username/email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Try to find user by username first
    let user = await storage.getUserByUsername(username);
    
    // If not found, try by email
    if (!user) {
      user = await storage.getUserByEmail(username);
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email
    });
    
    // Send user data and token
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        fullName: user.fullName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/auth/user
 * Get authenticated user's data
 */
router.get('/user', authenticate(), async (req: Request, res: Response) => {
  try {
    console.log('GET /api/auth/user - User ID from token:', req.user?.id);
    
    // req.user is set by authenticate middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized - no user in request' });
    }
    
    const user = await storage.getUser(req.user.id);
    
    if (!user) {
      console.log(`User with ID ${req.user.id} not found in database`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`Returning user data for ${user.username} (ID: ${user.id})`);
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      fullName: user.fullName,
      title: user.title,
      phone: user.phone,
      location: user.location, 
      experience: user.experience,
      bio: user.bio,
      specialties: user.specialties,
      licenses: user.licenses,
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, fullName } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }
    
    // Check if username already exists
    const existingUsername = await storage.getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Check if email already exists
    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await storage.createUser({
      username,
      email,
      password: hashedPassword,
      fullName
    });
    
    // Generate verification token
    const verificationToken = await storage.generateVerificationToken(user.id);
    
    // Send verification email (we'll implement this later)
    // await emailService.sendVerificationEmail(user.email, verificationToken);
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email
    });
    
    // Send user data and token
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        fullName: user.fullName
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/logout
 * Logout the user - with JWT this is primarily handled client-side
 */
router.post('/logout', async (req: Request, res: Response) => {
  // With JWT, we don't need to do anything server-side for logout
  // The client will remove the token
  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/session
 * Return the current auth state based on JWT (for backwards compatibility)
 */
router.get('/session', authenticate(true), async (req: Request, res: Response) => {
  console.log('GET /api/auth/session - Checking session state');
  
  // If user was set by authenticate middleware, they're authenticated
  if (req.user) {
    console.log(`Session check - User ID from token: ${req.user.id}`);
    
    const user = await storage.getUser(req.user.id);
    if (user) {
      console.log(`Session valid for ${user.username} (ID: ${user.id})`);
      return res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          emailVerified: user.emailVerified,
          fullName: user.fullName
        }
      });
    } else {
      console.log(`Session has valid token but user ID ${req.user.id} not found in database`);
    }
  } else {
    console.log('Session check - No authenticated user');
  }
  
  // Not authenticated
  return res.status(401).json({ message: 'Not authenticated' });
});

export default router;