import { mongooseConnect } from "@/lib/mongodb";
import Store from "@/models/Store";
import User from "@/models/User";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await mongooseConnect();

    const store = await Store.findOne({});
    const user = await User.findOne({ role: "admin" });

    // Debug: Log what we're getting
    console.log("Store from DB:", store ? `Found - has ${store.locations?.length || 0} locations` : "Not found");
    if (store && store.locations) {
      console.log("Locations:", JSON.stringify(store.locations, null, 2));
    }

    // Ensure locations are included in the response
    const storeData = store ? store.toObject() : null;
    const userData = user ? user.toObject() : null;

    return res.status(200).json({ store: storeData, user: userData });
  } catch (err) {
    console.error("Fetch setup error:", err);
    res.status(500).json({ 
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
}

