import { mongooseConnect } from "@/lib/mongodb";
import Store from "@/models/Store";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { authMiddleware, isAdmin, isStaff } from "@/lib/auth-middleware";

function sanitizeUser(user) {
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      await mongooseConnect();

      const [store, user] = await Promise.all([
        Store.findOne({}),
        User.findOne({ role: "admin" }).select(
          "name email role isActive createdAt updatedAt"
        ),
      ]);

      // Once setup exists, access requires authenticated staff.
      if (store || user) {
        const authError = authMiddleware(req, res);
        if (authError) return authError;
        if (!isStaff(req)) {
          return res
            .status(403)
            .json({ success: false, message: "Insufficient permissions" });
        }
      }

      return res.status(200).json({
        success: true,
        store: store ? store.toObject() : null,
        user: sanitizeUser(user),
      });
    } catch (error) {
      console.error("Setup GET error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch setup",
      });
    }
  }

  if (req.method === "POST") {
    return handlePost(req, res);
  }

  return res.status(405).json({ message: "Method not allowed" });
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
  } = req.body || {};

  try {
    await mongooseConnect();

    const [existingAdmin, existingStore] = await Promise.all([
      User.findOne({ role: "admin" }).select("_id"),
      Store.findOne({}).select("_id"),
    ]);
    const bootstrapMode = !existingAdmin || !existingStore;

    if (!storeName || !storePhone || !country || !adminName || !adminEmail) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: storeName, storePhone, country, adminName, adminEmail",
      });
    }

    if (bootstrapMode && !adminPassword) {
      return res.status(400).json({
        success: false,
        message: "adminPassword is required during initial setup",
      });
    }

    // After bootstrap, only admins can mutate setup.
    if (!bootstrapMode) {
      const authError = authMiddleware(req, res);
      if (authError) return authError;
      if (!isAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: "Only admin users can update setup configuration",
        });
      }
    }

    let passwordUpdate = {};
    if (adminPassword) {
      passwordUpdate.password = await bcrypt.hash(adminPassword, 10);
    }

    let store = await Store.findOne({});
    const preparedLocations = (Array.isArray(locations) ? locations : []).map((loc) => ({
      name: loc.name || "Unnamed Location",
      address: loc.address || "",
      phone: loc.phone || "",
      email: loc.email || "",
      code: loc.code || "",
      isActive: loc.isActive !== false,
    }));

    if (!store) {
      store = new Store({
        storeName,
        storePhone,
        country,
        logo: logo || "",
        locations: preparedLocations,
        devices: [],
        openingHours: [],
        tenderTypes: [],
        taxRates: [],
        pettyCashReasons: [],
      });
    } else {
      store.storeName = storeName;
      store.storePhone = storePhone;
      store.country = country;
      store.locations = preparedLocations;
      if (logo) store.logo = logo;
      if (!store.devices) store.devices = [];
      if (!store.openingHours) store.openingHours = [];
      if (!store.tenderTypes) store.tenderTypes = [];
      if (!store.taxRates) store.taxRates = [];
      if (!store.pettyCashReasons) store.pettyCashReasons = [];
    }

    const savedStore = await store.save();

    const user = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: adminName,
        email: adminEmail,
        role: "admin",
        ...passwordUpdate,
      },
      { upsert: true, new: true }
    ).select("name email role isActive createdAt updatedAt");

    return res.status(200).json({
      success: true,
      data: { store: savedStore, user: sanitizeUser(user) },
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
