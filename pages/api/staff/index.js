import { mongooseConnect } from "@/lib/mongodb";
import Staff from "@/models/Staff";
import bcrypt from "bcryptjs";

let staffIndexesSynced = false;

async function ensureStaffIndexes() {
  if (staffIndexesSynced) return;
  // Only sync if not already done - fire and forget to not block the request
  staffIndexesSynced = true;
  Staff.syncIndexes().catch((err) => {
    console.error("Staff index sync error (background):", err);
    staffIndexesSynced = false; // retry next time
  });
}

export default async function handler(req, res) {
  try {
    await mongooseConnect();
  } catch (err) {
    console.error("MongoDB connection error:", err);
    return res.status(500).json({ error: "Failed to connect to DB", details: err.message });
  }

  // Fire and forget - don't block the request
  ensureStaffIndexes();

  if (req.method === "GET") {
    try {
      const staff = await Staff.find().lean();
      return res.status(200).json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      return res.status(500).json({ error: "Failed to fetch staff", details: error.message });
    }
  }

  if (req.method === "POST") {
    const { name, password, location, role, accountName, accountNumber, bankName, salary } = req.body;

    if (!name || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const staff = await Staff.create({
        name,
        password: hashedPassword,
        location: location || "",
        role: role || "staff",
        accountName: accountName || "",
        accountNumber: accountNumber || "",
        bankName: bankName || "",
        salary: salary ? parseInt(salary) : 0,
      });
      return res.status(201).json(staff);
    } catch (error) {
      console.error("Error creating staff:", error);
      return res.status(500).json({ error: "Error creating staff", details: error.message });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}

