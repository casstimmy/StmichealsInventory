import { mongooseConnect } from "@/lib/mongodb";
import Customer from "@/models/Customer";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "PUT") {
    // Update customer
    try {
      await mongooseConnect();

      const { name, email, phone, address } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({
          success: false,
          message: "Name, email, and phone are required",
        });
      }

      const customer = await Customer.findByIdAndUpdate(
        id,
        { name, email, phone, address: address || "" },
        { new: true }
      );

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Customer updated successfully",
        customer,
      });
    } catch (error) {
      console.error("Error updating customer:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to update customer",
      });
    }
  } else if (req.method === "DELETE") {
    // Delete customer
    try {
      await mongooseConnect();

      const customer = await Customer.findByIdAndDelete(id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Customer deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to delete customer",
      });
    }
  } else {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
}
