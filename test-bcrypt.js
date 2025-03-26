import bcrypt from 'bcryptjs';

async function generateHash() {
  const password = 'testpass123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  
  // Test verify
  const isValid = await bcrypt.compare(password, hash);
  console.log(`Verification result: ${isValid}`);
}

generateHash();