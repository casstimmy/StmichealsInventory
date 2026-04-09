import User from "@/models/User";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

function requireAdmin(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") return null;
  return decoded;
}

export default async function handler(req, res) {
  await connectToDatabase();
  const admin = requireAdmin(req);
  if (!admin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  // GET - List all users
  if (req.method === "GET") {
    try {
      const users = await User.find({}, "-password").sort({ createdAt: -1 }).lean();
      return res.status(200).json({ users });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch users" });
    }
  }

  // POST - Create a new user
  if (req.method === "POST") {
    try {
      const { name, email, password, role, permissions } = req.body;
      const normalizedEmail = String(email || "").trim().toLowerCase();

      if (!normalizedEmail || !password || !name) {
        return res.status(400).json({ error: "Name, email, and PIN are required" });
      }

      if (!/^\d{4}$/.test(password)) {
        return res.status(400).json({ error: "PIN must be exactly 4 digits" });
      }

      const allowedRoles = ["admin", "sub-admin", "inventory", "account", "manager", "staff", "viewer"];
      const safeRole = allowedRoles.includes(role) ? role : "staff";

      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // For admin role, grant all permissions. For others, use provided permissions.
      let safePermissions = Array.isArray(permissions) ? permissions : [];
      if (safeRole === "admin") {
        safePermissions = ["setup", "manage", "stock", "reporting", "expenses", "support", "staff", "assets", "users"];
      } else if (safeRole === "inventory") {
        safePermissions = ["manage", "stock"];
      } else if (safeRole === "account") {
        safePermissions = ["expenses", "reporting"];
      }

      const user = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: safeRole,
        permissions: safePermissions,
        isActive: true,
      });

      return res.status(201).json({
        success: true,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.permissions, isActive: user.isActive },
      });
    } catch (err) {
      console.error("Create user error:", err);
      return res.status(500).json({ error: "Failed to create user" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
