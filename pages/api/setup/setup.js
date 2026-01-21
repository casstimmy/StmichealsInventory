import { mongooseConnect } from "@/lib/mongodb";
import Store from "@/models/Store";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // GET - Retrieve store configuration
    try {
      await mongooseConnect();
      const store = await Store.findOne({});
      const user = await User.findOne({ role: "admin" });

      if (store) {
        console.log("✅ Store found:", {
          storeName: store.storeName,
          locationsCount: store.locations?.length || 0,
          locations: store.locations?.map((loc) => ({ id: loc._id, name: loc.name })) || [],
        });
      } else {
        console.log("⚠️ Store not found in database");
      }

      const storeData = store ? store.toObject() : null;
      const userData = user ? user.toObject() : null;

      return res.status(200).json({ 
        success: true,
        store: storeData, 
        user: userData 
      });
    } catch (error) {
      console.error("Setup GET error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch setup",
      });
    }
  } else if (req.method === "POST") {
    // POST - Save store configuration
    return handlePost(req, res);
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}

async function handlePost(req, res) {
  const {
    storeName,
    storePhone,
    country,
    logo,
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
      // Create new store with properly formatted locations and default arrays
      store = new Store({
        storeName,
        storePhone,
        country,
        logo: logo || "",
        locations: preparedLocations,
        // Initialize default empty arrays for these fields
        devices: [],
        openingHours: [],
        tenderTypes: [],
        taxRates: [],
        pettyCashReasons: [],
      });
    } else {
      // Update existing store
      store.storeName = storeName;
      store.storePhone = storePhone;
      store.country = country;
      store.locations = preparedLocations;
      if (logo) store.logo = logo; // Update logo if provided
      
      // Ensure arrays exist even if undefined
      if (!store.devices) store.devices = [];
      if (!store.openingHours) store.openingHours = [];
      if (!store.tenderTypes) store.tenderTypes = [];
      if (!store.taxRates) store.taxRates = [];
      if (!store.pettyCashReasons) store.pettyCashReasons = [];
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
      data: { store: savedStore, user },
    });
  } catch (error) {
    console.error("Setup POST error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

