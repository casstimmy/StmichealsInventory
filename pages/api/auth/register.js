import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';

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

    const totalUsers = await User.countDocuments({});
    const token = getTokenFromRequest(req);
    const requester = token ? verifyToken(token) : null;
    const requesterIsAdmin = requester?.role === 'admin';

    if (totalUsers > 0 && !requesterIsAdmin) {
      return res.status(403).json({
        error: 'Only an authenticated admin can create additional users',
      });
    }

    const allowedRoles = ['admin', 'manager', 'staff', 'viewer'];
    const requestedRole = allowedRoles.includes(role) ? role : 'staff';
    const safeRole = totalUsers === 0 ? 'admin' : requestedRole;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase() || 'email@example.com',
      password: hashedPassword,
      name,
      role: safeRole,
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
