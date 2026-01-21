// models/StockMovement.js
import mongoose, { Schema, models } from "mongoose";

const StockMovementSchema = new Schema(
  {
    transRef: { 
      type: String, 
      required: true,
      unique: true,
      index: true 
    },

    fromLocationId: { 
      type: Schema.Types.ObjectId,
      ref: "Store.locations",
    },

    toLocationId: { 
      type: Schema.Types.ObjectId,
      ref: "Store.locations",
    },

    staffId: { 
      type: Schema.Types.ObjectId, 
      ref: "Staff" 
    },

    reason: { 
      type: String, 
      required: true,
      enum: ["Restock", "Transfer", "Return", "Adjustment"],
    },

    status: {
      type: String,
      enum: ["Pending", "Sent", "Received"],
      default: "Received",
      index: true
    },

    totalCostPrice: { 
      type: Number, 
      default: 0 
    },
    
    barcode: {
      type: String,
      index: true
    },

    dateSent: {
      type: Date,
      default: Date.now,
      index: true
    },
    
    dateReceived: Date,

    products: [
      {
        productId: { 
          type: Schema.Types.ObjectId, 
          ref: "Product" 
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        expiryDate: {
          type: Date,
          default: null
        },
        costPrice: Number,
        notes: String,
      },
    ],

    notes: String,
    
    approvedBy: { 
      type: Schema.Types.ObjectId, 
      ref: "Staff" 
    },
    
    approvalDate: Date,
  },
  { timestamps: true }
);

// Index for common queries
StockMovementSchema.index({ dateSent: -1, status: 1 });
StockMovementSchema.index({ fromLocationId: 1, toLocationId: 1 });
StockMovementSchema.index({ reason: 1 });

export default models.StockMovement || 
  mongoose.model("StockMovement", StockMovementSchema);

export const StockMovement = 
  models.StockMovement || mongoose.model("StockMovement", StockMovementSchema);
