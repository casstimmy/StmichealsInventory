import { mongooseConnect } from "@/lib/mongodb";
import Store from "@/models/Store";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const {
    storeName,
    storePhone,
    country,
    locations = [],
    adminName,
    adminEmail,
    adminPassword,
  } = req.body;

  try {
    await mongooseConnect();

    // Only hash password if provided
    let passwordUpdate = {};
    if (adminPassword) {
      passwordUpdate.password = await bcrypt.hash(adminPassword, 10);
    }

    // Get or create store first
    let store = await Store.findOne({});
    
    // Prepare locations array with proper schema
    const preparedLocations = locations.map((loc) => ({
      name: loc.name || "Unnamed Location",
      address: loc.address || "",
      phone: loc.phone || "",
      email: loc.email || "",
      code: loc.code || "",
      isActive: loc.isActive !== false,
    }));

    if (!store) {
      // Create new store with properly formatted locations
      store = new Store({
        storeName,
        storePhone,
        country,
        locations: preparedLocations,
      });
    } else {
      // Update existing store
      store.storeName = storeName;
      store.storePhone = storePhone;
      store.country = country;
      store.locations = preparedLocations;
    }

    // Save store with locations
    const savedStore = await store.save();
    
    console.log("Store saved successfully:", {
      id: savedStore._id,
      storeName: savedStore.storeName,
      locationsCount: savedStore.locations.length,
      locations: savedStore.locations.map(l => l.name),
    });

    // Update admin
    const user = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: adminName,
        email: adminEmail,
        role: "admin",
        ...passwordUpdate,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      data: { store, user },
    });
  } catch (error) {
    console.error("Setup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

