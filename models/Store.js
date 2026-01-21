// models/Store.js
import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },        
    address: { type: String },                    
    phone: { type: String },                       
    email: { type: String },                       
    code: { type: String },                        
    isActive: { type: Boolean, default: true },
    // Tenders and Categories specific to this location
    tenders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tender" }],
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  },
  { _id: true } 
);

const StoreSchema = new mongoose.Schema(
  {
    companyName: String,
    email: String,
    logo: { type: String, default: "" }, // Company logo URL for receipts
    currency: String,
    timezone: String,

    devices: [String],
    orderFooter: String,

    openingHours: [{ day: String, open: String, close: String }],
    tenderTypes: [String],
    taxRates: [{ name: String, percentage: Number }],
    pettyCashReasons: [String],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    storeName: { type: String, required: true },
    storePhone: { type: String, required: true },
    country: { type: String, required: true },

    // 🔥 UPGRADED LOCATIONS
    locations: [LocationSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Store ||
  mongoose.model("Store", StoreSchema);
