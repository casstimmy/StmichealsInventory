import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name, role = 'staff' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, PIN, and name are required' });
    }

    // Validate PIN is 4 digits
    if (!/^\d{4}$/.test(password)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: role || 'staff',
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
}
