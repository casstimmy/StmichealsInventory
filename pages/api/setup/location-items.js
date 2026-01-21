import mongoose from "mongoose";
import Store from "@/models/Store";
import Tender from "@/models/Tender";
import { Category } from "@/models/Category";
import { mongooseConnect } from "@/lib/mongodb";

async function connectDB() {
  await mongooseConnect();
}

export default async function handler(req, res) {
  try {
    await connectDB();

    // GET - Retrieve tenders and categories for a specific location
    if (req.method === "GET") {
      const { locationId } = req.query;

      if (!locationId) {
        return res.status(400).json({
          success: false,
          message: "Location ID is required",
        });
      }

      const store = await Store.findOne(
        { "locations._id": locationId },
        { "locations.$": 1 }
      ).populate({
        path: "locations.tenders",
        select: "_id name"
      }).populate({
        path: "locations.categories",
        select: "_id name"
      });

      if (!store || !store.locations || store.locations.length === 0) {
        console.error(`❌ Location not found: ${locationId}`);
        return res.status(404).json({
          success: false,
          message: "Location not found",
        });
      }

      const location = store.locations[0];
      console.log(`✅ GET: Retrieved location ${location.name}. Tenders: ${location.tenders?.length || 0}, Categories: ${location.categories?.length || 0}`);

      return res.status(200).json({
        success: true,
        location: {
          _id: location._id,
          name: location.name,
          tenders: location.tenders || [],
          categories: location.categories || [],
        },
      });
    }

    // PUT - Update tenders and categories for a location
    if (req.method === "PUT") {
      const { locationId } = req.query;
      const { tenderIds, categoryIds } = req.body;

      if (!locationId) {
        return res.status(400).json({
          success: false,
          message: "Location ID is required",
        });
      }

      // Validate tender IDs if provided
      if (tenderIds && Array.isArray(tenderIds)) {
        const invalidTenderIds = tenderIds.filter(
          (id) => !mongoose.Types.ObjectId.isValid(id)
        );
        if (invalidTenderIds.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid tender IDs",
          });
        }
      }

      // Validate category IDs if provided
      if (categoryIds && Array.isArray(categoryIds)) {
        const invalidCategoryIds = categoryIds.filter(
          (id) => !mongoose.Types.ObjectId.isValid(id)
        );
        if (invalidCategoryIds.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid category IDs",
          });
        }
      }

      const updateData = {};
      if (tenderIds) {
        updateData["locations.$.tenders"] = tenderIds.map(id => 
          mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
        );
      }
      if (categoryIds) {
        updateData["locations.$.categories"] = categoryIds.map(id => 
          mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
        );
      }

      const store = await Store.findOneAndUpdate(
        { "locations._id": new mongoose.Types.ObjectId(locationId) },
        { $set: updateData },
        { new: true }
      ).populate({
        path: "locations.tenders",
        select: "_id name"
      }).populate({
        path: "locations.categories",
        select: "_id name"
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: "Location not found",
        });
      }

      const location = store.locations.find(
        (loc) => loc._id.toString() === locationId.toString()
      );

      if (!location) {
        console.error(`❌ Location not found in store array: ${locationId}`);
        return res.status(404).json({
          success: false,
          message: "Location not found",
        });
      }

      console.log(`✅ PUT: Successfully updated location. Tenders: ${location.tenders.length}, Categories: ${location.categories.length}`);

      return res.status(200).json({
        success: true,
        message: "Location tenders and categories updated successfully",
        location: {
          _id: location._id,
          name: location.name,
          tenders: location.tenders || [],
          categories: location.categories || [],
        },
      });
    }

    // POST - Add single tender or category to location
    if (req.method === "POST") {
      const { locationId } = req.query;
      const { tenderId, categoryId } = req.body;

      if (!locationId) {
        return res.status(400).json({
          success: false,
          message: "Location ID is required",
        });
      }

      if (!tenderId && !categoryId) {
        return res.status(400).json({
          success: false,
          message: "Either tenderId or categoryId is required",
        });
      }

      if (tenderId && !mongoose.Types.ObjectId.isValid(tenderId)) {
        console.warn("❌ Invalid tender ID format:", tenderId);
        return res.status(400).json({
          success: false,
          message: "Invalid tender ID format",
        });
      }

      if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
        console.warn("❌ Invalid category ID format:", categoryId);
        return res.status(400).json({
          success: false,
          message: "Invalid category ID format",
        });
      }

      const updateQuery = {};
      if (tenderId) {
        const tenderObjectId = new mongoose.Types.ObjectId(tenderId);
        updateQuery.$addToSet = { "locations.$.tenders": tenderObjectId };
        console.log(`📌 POST: Adding tender ${tenderId} to location ${locationId}`);
      } else if (categoryId) {
        const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
        updateQuery.$addToSet = { "locations.$.categories": categoryObjectId };
        console.log(`📌 POST: Adding category ${categoryId} to location ${locationId}`);
      }

      const store = await Store.findOneAndUpdate(
        { "locations._id": new mongoose.Types.ObjectId(locationId) },
        updateQuery,
        { new: true }
      ).populate("locations.tenders").populate("locations.categories");

      if (!store) {
        console.error(`❌ Location not found with ID: ${locationId}`);
        return res.status(404).json({
          success: false,
          message: "Location not found",
        });
      }

      const location = store.locations.find(
        (loc) => loc._id.toString() === locationId.toString()
      );

      if (!location) {
        console.error(`❌ Location not found in store array: ${locationId}`);
        return res.status(404).json({
          success: false,
          message: "Location not found",
        });
      }

      console.log(`✅ POST: Successfully added to location. Tenders count: ${location.tenders.length}`);

      return res.status(200).json({
        success: true,
        message: "Item added to location successfully",
        location: {
          _id: location._id,
          name: location.name,
          tenders: location.tenders || [],
          categories: location.categories || [],
        },
      });
    }

    // DELETE - Remove tender or category from location
    if (req.method === "DELETE") {
      const { locationId } = req.query;
      const { tenderId, categoryId } = req.body;

      if (!locationId) {
        return res.status(400).json({
          success: false,
          message: "Location ID is required",
        });
      }

      if (!tenderId && !categoryId) {
        return res.status(400).json({
          success: false,
          message: "Either tenderId or categoryId is required",
        });
      }

      if (tenderId && !mongoose.Types.ObjectId.isValid(tenderId)) {
        console.warn("❌ Invalid tender ID format for deletion:", tenderId);
        return res.status(400).json({
          success: false,
          message: "Invalid tender ID format",
        });
      }

      if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
        console.warn("❌ Invalid category ID format for deletion:", categoryId);
        return res.status(400).json({
          success: false,
          message: "Invalid category ID format",
        });
      }

      const updateQuery = {};
      if (tenderId) {
        const tenderObjectId = new mongoose.Types.ObjectId(tenderId);
        updateQuery.$pull = { "locations.$.tenders": tenderObjectId };
        console.log(`🗑️ DELETE: Removing tender ${tenderId} from location ${locationId}`);
      } else if (categoryId) {
        const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
        updateQuery.$pull = { "locations.$.categories": categoryObjectId };
        console.log(`🗑️ DELETE: Removing category ${categoryId} from location ${locationId}`);
      }

      const store = await Store.findOneAndUpdate(
        { "locations._id": new mongoose.Types.ObjectId(locationId) },
        updateQuery,
        { new: true }
      ).populate("locations.tenders").populate("locations.categories");

      if (!store) {
        console.error(`❌ Location not found for deletion with ID: ${locationId}`);
        return res.status(404).json({
          success: false,
          message: "Location not found",
        });
      }

      const location = store.locations.find(
        (loc) => loc._id.toString() === locationId.toString()
      );

      if (!location) {
        console.error(`❌ Location not found in store array for deletion: ${locationId}`);
        return res.status(404).json({
          success: false,
          message: "Location not found",
        });
      }

      console.log(`✅ DELETE: Successfully removed from location. Tenders count: ${location.tenders.length}`);

      return res.status(200).json({
        success: true,
        message: "Item removed from location successfully",
        location: {
          _id: location._id,
          name: location.name,
          tenders: location.tenders || [],
          categories: location.categories || [],
        },
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error) {
    console.error("Error in location items API:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
