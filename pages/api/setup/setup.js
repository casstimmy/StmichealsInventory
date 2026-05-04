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
    email,
    logo,
    locations = [],
    receiptSettings,
    adminName,
    adminEmail,
    adminPassword,
  } = req.body || {};

  try {
    await mongooseConnect();

    const [existingAdmin, existingStore] = await Promise.all([
      User.findOne({ role: "admin" }).select("_id name email"),
      Store.findOne({}).select("_id"),
    ]);
    const bootstrapMode = !existingAdmin || !existingStore;

    if (bootstrapMode && (!storeName || !storePhone || !country || !adminName || !adminEmail)) {
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
    const nextStoreName = storeName || store?.storeName;
    const nextStorePhone = storePhone || store?.storePhone;
    const nextCountry = country || store?.country;

    if (!nextStoreName || !nextStorePhone || !nextCountry) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: storeName, storePhone, country",
      });
    }

    const existingLocations = Array.isArray(store?.locations) ? store.locations : [];
    const existingLocationsById = new Map(
      existingLocations
        .filter((loc) => loc?._id)
        .map((loc) => [String(loc._id), loc])
    );
    const preparedLocations = [];

    for (const loc of Array.isArray(locations) ? locations : []) {
      const locationId = loc?._id ? String(loc._id) : "";

      if (locationId && !existingLocationsById.has(locationId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid location reference: ${locationId}`,
        });
      }

      const existingLocation = locationId ? existingLocationsById.get(locationId) : null;

      preparedLocations.push({
        ...(locationId ? { _id: loc._id } : {}),
        name: loc.name || "Unnamed Location",
        address: loc.address || "",
        phone: loc.phone || "",
        email: loc.email || "",
        code: loc.code || "",
        isActive: loc.isActive !== false,
        // Preserve location-linked references when saving company details.
        tenders: Array.isArray(loc.tenders) ? loc.tenders : existingLocation?.tenders || [],
        categories: Array.isArray(loc.categories) ? loc.categories : existingLocation?.categories || [],
      });
    }

    const normalizedReceiptSettings = receiptSettings && typeof receiptSettings === "object"
      ? {
          companyDisplayName: receiptSettings.companyDisplayName || store?.companyDisplayName || "St's Michael Hub",
          taxNumber: receiptSettings.taxNumber || "",
          website: receiptSettings.website || "",
          refundDays: Number(receiptSettings.refundDays) || 0,
          receiptMessage: receiptSettings.receiptMessage || "Thank you for shopping with us!",
          fontSize: String(receiptSettings.fontSize || store?.fontSize || "8.0"),
          barcodeType: receiptSettings.barcodeType || store?.barcodeType || "Default - Code 39",
          qrUrl: receiptSettings.qrUrl || "",
          qrDescription: receiptSettings.qrDescription || "",
          qrDataUrl: receiptSettings.qrDataUrl || "",
          paymentStatus: receiptSettings.paymentStatus || "paid",
        }
      : null;

    if (!store) {
      store = new Store({
        storeName: nextStoreName,
        storePhone: nextStorePhone,
        country: nextCountry,
        email: email || "",
        logo: logo || "",
        locations: preparedLocations,
        devices: [],
        openingHours: [],
        tenderTypes: [],
        taxRates: [],
        pettyCashReasons: [],
        ...(normalizedReceiptSettings || {}),
      });
    } else {
      store.storeName = nextStoreName;
      store.storePhone = nextStorePhone;
      store.country = nextCountry;
      if (Array.isArray(locations) && locations.length > 0) {
        store.locations = preparedLocations;
      }
      if (typeof email === "string") store.email = email;
      if (typeof logo === "string") store.logo = logo;
      if (normalizedReceiptSettings) {
        Object.assign(store, normalizedReceiptSettings);
      }
      if (!store.devices) store.devices = [];
      if (!store.openingHours) store.openingHours = [];
      if (!store.tenderTypes) store.tenderTypes = [];
      if (!store.taxRates) store.taxRates = [];
      if (!store.pettyCashReasons) store.pettyCashReasons = [];
    }

    const savedStore = await store.save();

    let user = existingAdmin ? sanitizeUser(existingAdmin) : null;
    const nextAdminName = adminName || existingAdmin?.name;
    const nextAdminEmail = adminEmail || existingAdmin?.email;

    if (nextAdminName && nextAdminEmail && (bootstrapMode || adminName || adminEmail || adminPassword)) {
      user = await User.findOneAndUpdate(
        { email: nextAdminEmail },
        {
          name: nextAdminName,
          email: nextAdminEmail,
          role: "admin",
          ...passwordUpdate,
        },
        { upsert: true, new: true }
      ).select("name email role isActive createdAt updatedAt");
    }

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
