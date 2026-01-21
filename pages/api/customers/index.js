import { mongooseConnect } from "@/lib/mongodb";
import Customer from "@/models/Customer";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // Get all customers
    try {
      await mongooseConnect();
      const customers = await Customer.find({}).lean();
      return res.status(200).json({ success: true, customers });
    } catch (error) {
      console.error("Error fetching customers:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch customers" });
    }
  } else if (req.method === "POST") {
    // Create new customer
    try {
      await mongooseConnect();

      const { name, email, phone, address } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({
          success: false,
          message: "Name, email, and phone are required",
        });
      }

      // Check if customer with this email already exists
      const existing = await Customer.findOne({ email });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Customer with this email already exists",
        });
      }

      const customer = await Customer.create({
        name,
        email,
        phone,
        address: address || "",
      });

      return res.status(201).json({
        success: true,
        message: "Customer created successfully",
        customer,
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to create customer",
      });
    }
  } else {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
}
