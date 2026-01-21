const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = "mongodb+srv://stmichealsfoods_db_user:1t148jD3Mn1YlXxG@cluster0.z4yj0gu.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Product schema
const productSchema = new mongoose.Schema({
  name: String,
  sku: String,
  barcode: String,
  description: String,
  category: String,
  quantity: Number,
  minStock: Number,
  unitPrice: Number,
  expiryDate: Date,
  isExpired: Boolean,
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model('Product', productSchema);

const dummyProducts = [
  {
    name: "Yogurt Plain",
    sku: "YOG001",
    barcode: "1234567890001",
    description: "Plain yogurt 500ml",
    category: "Dairy",
    quantity: 45,
    minStock: 10,
    unitPrice: 2.50,
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    isExpired: false,
  },
  {
    name: "Milk Fresh",
    sku: "MLK001",
    barcode: "1234567890002",
    description: "Fresh whole milk 1L",
    category: "Dairy",
    quantity: 120,
    minStock: 20,
    unitPrice: 3.00,
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
    isExpired: false,
  },
  {
    name: "Cheese Cheddar",
    sku: "CHE001",
    barcode: "1234567890003",
    description: "Aged cheddar cheese 250g",
    category: "Dairy",
    quantity: 30,
    minStock: 5,
    unitPrice: 5.50,
    expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
    isExpired: false,
  },
  {
    name: "Bread Wheat",
    sku: "BRD001",
    barcode: "1234567890004",
    description: "Whole wheat bread 500g",
    category: "Bakery",
    quantity: 25,
    minStock: 5,
    unitPrice: 2.00,
    expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
    isExpired: false,
  },
  {
    name: "Butter Salted",
    sku: "BUT001",
    barcode: "1234567890005",
    description: "Salted butter 200g",
    category: "Dairy",
    quantity: 60,
    minStock: 10,
    unitPrice: 4.00,
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    isExpired: false,
  },
  {
    name: "Orange Juice",
    sku: "OJ001",
    barcode: "1234567890006",
    description: "Fresh orange juice 1L",
    category: "Beverages",
    quantity: 80,
    minStock: 15,
    unitPrice: 2.75,
    expiryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // -1 days (EXPIRED)
    isExpired: true,
  },
  {
    name: "Apple Red",
    sku: "APP001",
    barcode: "1234567890007",
    description: "Fresh red apples per lb",
    category: "Produce",
    quantity: 200,
    minStock: 30,
    unitPrice: 1.50,
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    isExpired: false,
  },
  {
    name: "Yogurt Greek",
    sku: "YOG002",
    barcode: "1234567890008",
    description: "Greek yogurt 400ml",
    category: "Dairy",
    quantity: 35,
    minStock: 8,
    unitPrice: 3.50,
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    isExpired: false,
  },
  {
    name: "Tomato Fresh",
    sku: "TOM001",
    barcode: "1234567890009",
    description: "Fresh tomatoes per lb",
    category: "Produce",
    quantity: 150,
    minStock: 25,
    unitPrice: 1.25,
    expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
    isExpired: false,
  },
  {
    name: "Banana Yellow",
    sku: "BAN001",
    barcode: "1234567890010",
    description: "Fresh yellow bananas per lb",
    category: "Produce",
    quantity: 250,
    minStock: 40,
    unitPrice: 0.60,
    expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days
    isExpired: false,
  }
];

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connection;

    console.log("Clearing existing products...");
    await Product.deleteMany({});

    console.log("Adding dummy products...\n");
    const result = await Product.insertMany(dummyProducts);

    console.log("✅ Successfully added products:\n");
    result.forEach(product => {
      const days = Math.ceil((product.expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
      console.log(`  ✅ ${product.name} - Expires in ${days} days (${product.expiryDate.toISOString().split('T')[0]})`);
    });

    console.log("\n✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
