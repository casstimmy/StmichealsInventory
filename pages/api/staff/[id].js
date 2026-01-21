import { mongooseConnect } from "@/lib/mongodb";
import { Staff } from "@/models/Staff";

export default async function handler(req, res) {
  await mongooseConnect();

  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      const { name, password, location, role, accountName, accountNumber, bankName, salary, isActive } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Name is required." });
      }

      const updateData = {
        name,
        location: location || "",
        role: role || "staff",
        accountName: accountName || "",
        accountNumber: accountNumber || "",
        bankName: bankName || "",
        salary: salary ? parseInt(salary) : 0,
        isActive: isActive !== undefined ? isActive : true,
      };

      // Only hash password if provided
      if (password) {
        const bcrypt = require("bcryptjs");
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updated = await Staff.findByIdAndUpdate(id, updateData, { new: true });

      if (!updated) {
        return res.status(404).json({ error: "Staff not found." });
      }

      res.status(200).json(updated);
    } catch (err) {
      console.error("Update failed:", err);
      res.status(500).json({ error: "Server error." });
    }
  } else {
    res.setHeader("Allow", ["PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
