// This script will be injected into the routes file to log the password reset tokens
import { passwordResetTokens } from './server/routes/email.js';
console.log('Current password reset tokens:');
console.log(Array.from(passwordResetTokens.entries()));