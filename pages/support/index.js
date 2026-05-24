import { useEffect, useMemo, useRef, useState } from "react";
import Layout from "@/components/Layout";
import { apiClient } from "@/lib/api-client";
import BizFaceLogo from "@/components/BizFaceLogo";
import { showToastMessage } from "@/lib/toast-state";
import { MessageCircle, Send, TicketIcon, ArrowLeft, ChevronDown, ChevronUp, HelpCircle, X, Check, CheckCheck } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending_customer", label: "Pending Customer" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "technical", label: "Technical" },
  { value: "tax", label: "Tax" },
  { value: "inventory", label: "Inventory" },
  { value: "billing", label: "Billing" },
  { value: "other", label: "Other" },
];

// Knowledge base for instant Q&A answers
const KNOWLEDGE_BASE = [
  {
    keywords: ["add product", "new product", "create product", "product list"],
    question: "How do I add a new product?",
    answer: "Go to **Manage** → **Product List** from the sidebar. Click **Add Product**, then fill in the product name, description, cost price, sale price (inc. tax), category, and optional details like barcode, stock levels, and expiry date. Upload product images if needed. Click **Save** to add it to your inventory. Products marked as **stock managed** will be tracked across locations.",
  },
  {
    keywords: ["stock", "inventory level", "low stock", "out of stock", "stock management", "restock"],
    question: "How do I manage stock levels?",
    answer: "Navigate to **Stock** → **Stock Management** to view current stock levels by product and location. To restock, go to **Stock** → **Stock Movement** and create a **Restock** movement from Vendor to a location. To transfer stock between locations, use a **Transfer** movement. You can set **min/max stock** alerts on each product so the system warns you when levels drop. The **Expiration Report** under Stock helps track products nearing expiry.",
  },
  {
    keywords: ["stock movement", "transfer", "restock", "return", "move stock"],
    question: "How do stock movements work?",
    answer: "Stock movements track all inventory changes. Go to **Stock** → **Stock Movement** to create one. There are three types: **Restock** (brings stock in from a vendor to a location), **Transfer** (moves stock between your locations), and **Return** (sends stock back to a vendor). Each movement requires a source, destination, products, and quantities. Movements automatically update stock levels at the relevant locations.",
  },
  {
    keywords: ["stock take", "count", "physical count", "inventory count", "cycle count"],
    question: "How do I perform a stock take?",
    answer: "Go to **Stock** → **Stock Take** to start a new count. You can do a **Full Count** (all products), **Partial Count** (specific products), or **Cycle Count** (by category). Select a location, then enter the actual counted quantities for each product. The system calculates the variance between expected and counted stock. Once submitted, review results in **Stock Take Report** which shows discrepancies and trends over time.",
  },
  {
    keywords: ["expense", "add expense", "record expense", "expense entry", "track expenses"],
    question: "How do I record an expense?",
    answer: "Go to **Expenses** → **Expenses Entry**. Fill in the expense title, amount, select a category (or create new ones), choose the location, and optionally assign a staff member. You can add notes for reference. Click **Add Expense** to save. View all expense summaries in **Expenses Analysis** which shows breakdowns by category, location, and time period with charts.",
  },
  {
    keywords: ["vendor", "supplier", "add vendor", "manage vendor", "vendor management"],
    question: "How do I manage vendors?",
    answer: "Navigate to **Manage** → **Procurement** → **Vendors**. Click **Add Vendor** to create a new supplier with their company name, contact person, phone, email, address, main product, and bank details. You can also attach specific products that the vendor supplies (with cost prices and pack types). To place an order, expand a vendor card and click **Place Order** — this lets you specify products, quantities, and costs, then submits a purchase order to the **Payment Tracker**.",
  },
  {
    keywords: ["purchase order", "payment tracker", "vendor payment", "pay vendor"],
    question: "How does the Vendor Payment Tracker work?",
    answer: "Go to **Manage** → **Procurement** → **Payment Tracker**. This page tracks all vendor purchase orders and their payment status (**Not Paid**, **Partly Paid**, **Paid**, **Credit**). Use the **Quick Entry** button for fast payment recording. The dashboard shows overdue orders, outstanding balances, credit orders, and total paid amounts. You can filter by vendor, time period, and status. Click **Edit** on any row to update payment amounts directly.",
  },
  {
    keywords: ["report", "sales report", "analytics", "reporting", "sales data"],
    question: "How do I view sales reports?",
    answer: "Go to **Reporting** in the sidebar. **Sales Report** gives you the main summary, while the reporting submenu breaks data down into **Time Intervals**, **Time Comparisons**, **Sales by Product**, **Employees**, **Locations**, and **Categories**. For transaction-level investigation, use **Completed Transactions** to search, expand, edit, void, or refund sales. Use the date filters before exporting or comparing figures so all charts and tables are working from the same period.",
  },
  {
    keywords: ["staff", "employee", "add staff", "onboarding", "staff management"],
    question: "How do I add and manage staff?",
    answer: "Go to **Manage** → **Staff** → **Staff Page**. Click **Add New Staff** to create a member with their name, 4-digit PIN, role, location, salary, and bank details. After creation, you'll see options to **Copy Onboarding Link** or **Send Onboarding Link** via email. The onboarding form collects personal details (DOB, address, state of origin, next of kin) and guarantor information. View completed profiles by clicking **View Profile** on any staff card.",
  },
  {
    keywords: ["staff role", "role", "permissions", "staff roles"],
    question: "How do staff roles work?",
    answer: "Go to **Manage** → **Staff** → **Staff Roles** to define custom POS roles. For admin system access, go to **Setup** → **Users** to create users with specific roles: **Admin** (full access), **Sub-Admin** (custom permissions), **Inventory** (manage & stock), **Account** (expenses & reporting), **Manager**, **Staff**, or **Viewer**. Each role can have granular submenu-level permissions — you can control exactly which pages each user can see.",
  },
  {
    keywords: ["transaction", "refund", "void", "edit transaction", "completed transaction"],
    question: "How do I edit or refund a transaction?",
    answer: "Go to **Reporting** → **Completed Transactions**. Find the transaction using search or filters. Expand it to see details. Use the action buttons to **Edit** (modify items/prices), **Void** (cancel entirely), or **Refund** (return payment). All actions require a reason and may need manager approval depending on your role. Voided and refunded transactions are tracked separately in reports.",
  },
  {
    keywords: ["location", "add location", "store location", "multi-location"],
    question: "How do I manage store locations?",
    answer: "Navigate to **Setup** → **Company Details**. Here you can add, edit, or remove locations for your business. Each location has a name and can be assigned to staff members, tenders, and stock. Locations are used throughout the system for filtering sales, tracking stock levels, and assigning expenses. Go to **Setup** → **Location Tenders** to configure payment methods available at each location.",
  },
  {
    keywords: ["asset", "equipment", "maintenance", "asset management"],
    question: "How do I track assets and maintenance?",
    answer: "Go to **Setup** → **Assets** to add and manage business equipment and assets. Each asset can have custom properties, purchase date, cost, and condition status. You can schedule maintenance tasks and track disposal. Maintenance costs can be linked to specific assets through the **Expenses** page by selecting the asset category when recording an expense.",
  },
  {
    keywords: ["promotion", "discount", "promo", "sale", "deal"],
    question: "How do I set up promotions?",
    answer: "Navigate to **Manage** → **Promotions**. Create promotions with: discount type (**Percentage** or **Fixed** amount), discount direction (**Discount** to reduce price or **Increment** to increase), date ranges (or set as **Indefinite** for ongoing promos), and assign to specific products. The promo price is calculated automatically. Customer-specific promotions can be created in **Manage** → **Customer Promotions** for targeted deals.",
  },
  {
    keywords: ["password", "login", "access", "permission", "user", "pin"],
    question: "How do I manage user access and permissions?",
    answer: "Go to **Setup** → **Users** to manage admin-app access. Create users with name, email, and a 4-digit PIN, then assign a role and page-level permissions. **Admin** gets full access, while **Sub-Admin**, **Manager**, **Staff**, and **Viewer** can be restricted down to individual submenu items. This is separate from POS staff access in **Manage** → **Staff**. If a permission change does not appear immediately, refresh the page or sign out and back in so the latest user profile is loaded.",
  },
  {
    keywords: ["till", "pos", "point of sale", "checkout", "register"],
    question: "How do I access the Point of Sale (Till)?",
    answer: "Click **Till** in the sidebar to open the POS application in a new tab. The POS system allows you to: ring up sales, search products by name or barcode, apply discounts, handle split payments across multiple tender types, hold transactions for later, and process customer-specific promotions. POS staff access is managed separately in **Manage** → **Staff** with POS-specific permissions.",
  },
  {
    keywords: ["tax", "tax report", "tax analysis", "vat", "tax calculator"],
    question: "How do I view tax reports?",
    answer: "Go to **Expenses** → **Tax Analysis** for a comprehensive business tax summary showing your sales tax collected, expense deductions, and net tax obligations. Use **Personal Tax Calculator** under Expenses for individual income tax calculations with Nigerian tax brackets. Products can have individual tax rates set during creation, and these are automatically applied during POS sales and reflected in tax reports.",
  },
  {
    keywords: ["eod", "end of day", "close day", "daily report", "reconciliation"],
    question: "How does End of Day (EOD) work?",
    answer: "Navigate to **Reporting** → **End of Day Reports** to review daily summaries by location. EOD reports show tender totals, expected closing balance, variance, transaction count, and other daily reconciliation metrics. This is the best place to review drawer performance and investigate mismatches after trading hours. If you need a fully guided till-closing flow with physical count entry and close-day actions, contact support or your system admin because the current admin app focuses mainly on viewing and analysing EOD data rather than a full cashier close-out wizard.",
  },
  {
    keywords: ["held", "hold transaction", "pending", "saved transaction"],
    question: "What are held transactions?",
    answer: "Held transactions are sales started on the POS/Till that haven't been completed yet — for example, when a customer is still shopping or needs to come back later. They are **NOT** counted in your sales totals or reports. You can find and resume them from the Till system. Multiple transactions can be held simultaneously, and each is tagged with the staff member who created it.",
  },
  {
    keywords: ["category", "product category", "categories", "organize"],
    question: "How do I manage product categories?",
    answer: "Go to **Manage** → **Categories** to create and edit product categories. Categories help organize your products for easier browsing in the POS and better reporting. You can create hierarchical categories (parent/child). Special categories like **Room** automatically set products as non-stock-managed. Categories are used in reporting for sales-by-category analysis.",
  },
  {
    keywords: ["customer", "customer management", "loyalty", "customer promotions"],
    question: "How do I manage customers?",
    answer: "Navigate to **Manage** → **Customers** to add and manage your customer database. Store customer details like name, phone, email, and address. Customers can be linked to transactions for purchase history tracking. Use **Manage** → **Customer Promotions** to create personalized promotions targeted at specific customers or customer groups.",
  },
  {
    keywords: ["campaign", "marketing", "email campaign"],
    question: "How do campaigns work?",
    answer: "Go to **Manage** → **Campaigns** to create marketing campaigns. Campaigns let you send promotional messages to your customer base. You can target specific customer segments, set campaign dates, and track engagement. Campaigns integrate with your customer database and promotion system for targeted marketing.",
  },
  {
    keywords: ["receipt", "print receipt", "receipt setup"],
    question: "How do I customize receipts?",
    answer: "Go to **Setup** → **Receipts** to configure your receipt template. You can customize the header (business name, address, phone), footer message, and choose what information to display (tax breakdown, staff name, location, etc.). Receipt settings apply to all POS transactions. Receipts can be printed or shared digitally from the Till system.",
  },
  {
    keywords: ["tender", "payment method", "pos tender", "cash", "card", "mobile money"],
    question: "How do I set up payment methods (tenders)?",
    answer: "Go to **Setup** → **POS Tenders** to create payment methods like Cash, Card, Mobile Money, Transfer, etc. Each tender can be toggled active/inactive. Use **Setup** → **Location Tenders** to configure which tenders are available at specific locations. Customers can split payments across multiple tender types during checkout at the POS.",
  },
  {
    keywords: ["order", "online order", "manage order", "order status"],
    question: "How do I manage orders?",
    answer: "Go to **Manage** → **Orders** to view and manage all orders. Orders can be filtered by status (Pending, Processing, Completed, Cancelled). Each order shows customer details, products, quantities, and total amount. You can update order status, add notes, and track fulfillment. Orders from the POS Till and online channels appear here.",
  },
  {
    keywords: ["archive", "archived product", "delete product", "remove product"],
    question: "How do I archive or restore products?",
    answer: "Instead of deleting products (which would destroy sales history), you can archive them. Go to **Manage** → **Product List**, find the product, and click **Archive**. Provide a reason for archiving. Archived products are moved to **Manage** → **Archived Products** where they can be viewed, restored, or permanently managed. Archived products don't appear in POS searches.",
  },
  {
    keywords: ["hero", "promo setup", "hero promo", "banner"],
    question: "What is Hero-Promo Setup?",
    answer: "Go to **Setup** → **Hero-Promo Setup** to configure promotional banners and featured content that displays on your customer-facing pages. You can upload hero images, set promotional text, link to specific products or categories, and control display timing. This is useful for highlighting seasonal sales, new arrivals, or special offers.",
  },
  {
    keywords: ["support", "ticket", "help", "issue", "support ticket"],
    question: "How do I create a support ticket?",
    answer: "If this Q&A doesn't solve the issue, open the **Tickets** tab at the top of this page and click **New Ticket**. Add a clear subject, detailed description, category, priority, and location if the issue is location-specific. The fastest tickets usually include what page you were on, what you expected to happen, what actually happened, and any screenshot or exact error message. After submitting, you can track status, add comments, and follow the full conversation from the same page.",
  },
  {
    keywords: ["pack", "bundle", "pack product", "child product", "unit"],
    question: "How do pack/bundle products work?",
    answer: "When adding products to a vendor in **Manage** → **Vendors**, you can set a product as type **Pack** and specify the quantity per pack. When saved, the system automatically creates a **child product** with the name appended (e.g., 'Rice (Pack of 12)'). The child product's cost price is calculated as the unit cost × quantity per pack. You can then set the sale price manually in the **Product List**. This allows you to sell both individual units and packs.",
  },
  {
    keywords: ["expiry", "expired", "expiration", "shelf life"],
    question: "How does expiry tracking work?",
    answer: "When adding or editing a product, you can set an **Expiry Date**. The system automatically marks products as expired when the date passes. View all products approaching or past expiry in **Stock** → **Expiration Report**. This report helps you identify products that need to be sold quickly, discounted, or removed from shelves. Expired flags update automatically on each page load.",
  },
  {
    keywords: ["accounting", "profit and loss", "p&l", "balance sheet", "trial balance", "general ledger", "journal entry", "chart of accounts"],
    question: "How do accounting reports and journals work?",
    answer: "Use the **Accounting** section for formal financial records. **Reports** gives you **Profit & Loss**, **Balance Sheet**, and **Trial Balance**. **Journal Entries** is where you create manual entries, save drafts, post them, or void them. **General Ledger** shows the running activity for a single account, and **Chart of Accounts** controls the account list. Operational activity such as sales, expenses, refunds, and purchase-order payments feeds accounting automatically, but owner capital, loans, depreciation, and corrections should still be entered manually as journal entries.",
  },
  {
    keywords: ["sync accounting", "accounting sync", "stale report", "refresh accounting", "journal not updated"],
    question: "How does accounting sync work?",
    answer: "Accounting pages now use a throttled background sync so they stay responsive. If a report, journal list, or ledger looks behind current sales or expenses, click **Sync Accounting** at the top of the accounting page you are on. That forces a fresh pull from transactions, expenses, and purchase orders, then updates the last-sync time shown on the page. Use manual sync before checking month-end figures, after bulk imports, or when investigating a mismatch.",
  },
  {
    keywords: ["receive purchase order", "confirm received", "po receipt", "goods received", "restock from po"],
    question: "How do I receive a purchase order into stock?",
    answer: "Open **Manage** → **Procurement** → **Payment Tracker** and locate the purchase order. Update payment details if needed, then use the receive/confirm action to mark the order as received. That receipt step is important because it is what creates the stock movement, updates inventory, and changes the purchase order's receiving status. If you only record payment without confirming receipt, the stock will not be added yet.",
  },
  {
    keywords: ["operational loss", "damaged stock", "waste", "expired stock", "missing stock", "write off"],
    question: "How do I record operational loss or damaged stock?",
    answer: "Use **Stock** → **Stock Movement** when stock leaves the business for a real operational reason such as damage, waste, expiry, or unexplained loss. Select the operational-loss style movement option, choose the location, add the affected products, and enter the quantities with a clear note. This keeps your stock on hand realistic and helps management separate normal sales from shrinkage or wastage.",
  },
  {
    keywords: ["split payment", "split tender", "multiple payment methods", "cash and card", "pay partly cash partly transfer"],
    question: "How do split payments work at the Till?",
    answer: "At the **Till**, you can complete one sale with more than one tender type, for example part cash and part transfer. First make sure the tender methods are active in **Setup** → **POS Tenders** and assigned to the location in **Setup** → **Location Tenders**. During checkout, enter the amounts against each tender until the full balance is covered. The completed transaction and reports will keep the tender breakdown so you can reconcile each payment method correctly.",
  },
  {
    keywords: ["order location", "fulfilment location", "fulfillment location", "assign order location", "online order location"],
    question: "How do order fulfilment locations work?",
    answer: "Go to **Manage** → **Orders** and open the order details to assign or clear a fulfilment location. This is useful for routing online or central orders to the branch that should handle them. The chosen location improves management visibility and reporting context, especially after delivery. If a delivered order's location changes later, the system keeps the transaction location in sync for reporting purposes.",
  },
  {
    keywords: ["offline", "internet down", "queued transaction", "offline pos", "sync later"],
    question: "What happens if the Till goes offline?",
    answer: "The system supports offline POS queueing, so temporary internet loss should not mean lost sales. Transactions created while offline can be held locally and synced when the connection returns. If staff believe a sale may have been queued, avoid ringing it twice immediately. First confirm whether the transaction appears as held, completed, or synced after connectivity is restored, then escalate to support if the count still looks wrong.",
  },
  {
    keywords: ["hotel", "reservation", "room booking", "guest", "hotel reservations"],
    question: "How do hotel reservations work?",
    answer: "Use **Manage** → **Hotel Reservations** to view, update, and track guest bookings. Reservations store guest details, booking dates, room or room-product information, and reservation status. The system can also send reservation-related guest communications from the reservation workflow. If a room-related booking behaves unexpectedly, include the reservation status, guest name, room, and dates when raising a support ticket so the issue can be traced quickly.",
  },
];

const FEATURED_TOPIC_QUESTIONS = [
  "How do I add a new product?",
  "How do I manage stock levels?",
  "How do I perform a stock take?",
  "How do I manage vendors?",
  "How do I receive a purchase order into stock?",
  "How do split payments work at the Till?",
  "How do I view sales reports?",
  "How do accounting reports and journals work?",
  "How does accounting sync work?",
  "How does End of Day (EOD) work?",
  "How do I manage user access and permissions?",
  "How do I create a support ticket?",
  "How do hotel reservations work?",
  "How do I record operational loss or damaged stock?",
];

const FEATURED_TOPICS = FEATURED_TOPIC_QUESTIONS
  .map((question) => KNOWLEDGE_BASE.find((entry) => entry.question === question))
  .filter(Boolean);

function formatStatusLabel(value) {
  return String(value || "open").replace(/_/g, " ");
}

function searchKnowledgeBase(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter(w => w.length > 1);
  
  return KNOWLEDGE_BASE
    .map(entry => {
      let score = 0;
      // Check keywords
      entry.keywords.forEach(kw => {
        if (q.includes(kw)) score += 10;
        words.forEach(w => { if (kw.includes(w)) score += 3; });
      });
      // Check question text
      words.forEach(w => {
        if (entry.question.toLowerCase().includes(w)) score += 2;
        if (entry.answer.toLowerCase().includes(w)) score += 1;
      });
      return { ...entry, score };
    })
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function renderMarkdown(text) {
  // Simple markdown: bold
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
  );
}

export default function SupportPage() {
  const [view, setView] = useState("chat"); // "chat" or "tickets"
  const [chatMessages, setChatMessages] = useState([
    { id: 1, role: "system", text: "Hi! I'm your Support Assistant. Ask me anything about using the system, or browse common topics below. If I can't help, you can create a support ticket." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [showQuickTopics, setShowQuickTopics] = useState(true);
  const [isTalking, setIsTalking] = useState(false);
  const chatEndRef = useRef(null);

  // Ticket state
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [comment, setComment] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    search: "",
    mine: false,
  });
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "general",
    priority: "medium",
    location: "",
  });

  const selectedTicket = useMemo(
    () => tickets.find((t) => t._id === selectedTicketId) || null,
    [tickets, selectedTicketId]
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (!message) return;
    showToastMessage({ title: "Support center", text: message });
    setMessage("");
  }, [message]);

  async function fetchTickets() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== "all") params.set("status", filters.status);
      if (filters.priority !== "all") params.set("priority", filters.priority);
      if (filters.search.trim()) params.set("search", filters.search.trim());
      if (filters.mine) params.set("mine", "true");

      const res = await apiClient.get(`/api/support?${params.toString()}`);
      const list = res.data?.tickets || [];
      setTickets(list);
      if (!selectedTicketId && list.length) setSelectedTicketId(list[0]._id);
      if (selectedTicketId && !list.find((t) => t._id === selectedTicketId)) {
        setSelectedTicketId(list[0]?._id || null);
      }
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to fetch support tickets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (view === "tickets") fetchTickets();
  }, [view, filters.status, filters.priority, filters.mine]);

  const handleChatSend = () => {
    const text = chatInput.trim();
    if (!text) return;

    const userMsg = { id: Date.now(), role: "user", text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsTalking(true);

    // Search knowledge base
    const results = searchKnowledgeBase(text);

    setTimeout(() => {
      if (results.length > 0) {
        const answer = {
          id: Date.now() + 1,
          role: "system",
          text: results[0].answer,
          relatedQuestions: results.slice(1).map(r => r.question),
        };
        setChatMessages(prev => [...prev, answer]);
      } else {
        const noMatch = {
          id: Date.now() + 1,
          role: "system",
          text: "I don't have a specific answer for that. You can try rephrasing your question, or create a support ticket for personalized help from the team.",
          showTicketPrompt: true,
        };
        setChatMessages(prev => [...prev, noMatch]);
      }
      setIsTalking(false);
    }, 400);
  };

  const handleQuickTopic = (entry) => {
    const userMsg = { id: Date.now(), role: "user", text: entry.question };
    setIsTalking(true);
    setChatMessages(prev => [...prev, userMsg]);
    setTimeout(() => {
      const answer = { id: Date.now() + 1, role: "system", text: entry.answer };
      setChatMessages(prev => [...prev, answer]);
      setIsTalking(false);
    }, 300);
  };

  const handleRelatedQuestion = (question) => {
    const entry = KNOWLEDGE_BASE.find(e => e.question === question);
    if (entry) handleQuickTopic(entry);
  };

  const startTicketFromChat = () => {
    // Pre-fill the ticket with the last user message
    const lastUserMsg = [...chatMessages].reverse().find(m => m.role === "user");
    setForm(prev => ({
      ...prev,
      subject: lastUserMsg?.text?.slice(0, 100) || "",
      description: lastUserMsg?.text || "",
    }));
    setShowNewTicket(true);
    setView("tickets");
  };

  const submitTicket = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      setMessage("Subject and description are required.");
      return;
    }
    try {
      setSaving(true);
      setMessage("");
      await apiClient.post("/api/support", form);
      setForm({ subject: "", description: "", category: "general", priority: "medium", location: "" });
      setShowNewTicket(false);
      setMessage("Support ticket created successfully.");
      await fetchTickets();
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to create support ticket");
    } finally {
      setSaving(false);
    }
  };

  const updateTicket = async (payload) => {
    if (!selectedTicket) return;
    try {
      setSaving(true);
      setMessage("");
      await apiClient.put(`/api/support/${selectedTicket._id}`, payload);
      if (payload.comment) setComment("");
      await fetchTickets();
      setMessage("Ticket updated.");
    } catch (error) {
      setMessage(error?.response?.data?.error || "Failed to update ticket");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="page-container">
        <div className="page-content">
          {/* Header */}
          <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="page-title">Support Center</h1>
              <p className="page-subtitle">Ask questions or create support tickets</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView("chat")}
                className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === "chat" ? "theme-toggle-active" : "theme-toggle-neutral"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                Q&A
              </button>
              <button
                onClick={() => setView("tickets")}
                className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === "tickets" ? "theme-toggle-active" : "theme-toggle-neutral"
                }`}
              >
                <TicketIcon className="w-4 h-4" />
                Tickets
              </button>
            </div>
          </div>

          {/* ======== CHAT Q&A VIEW ======== */}
          {view === "chat" && (
            <div className="flex flex-col rounded-xl overflow-hidden shadow-lg border border-gray-200" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
              {/* WhatsApp-style Header */}
              <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "var(--table-header-bg)", borderBottom: "1px solid var(--table-header-border)" }}>
                <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md ring-2 ring-white/30 flex items-center justify-center">
                  <BizFaceLogo size={40} isTalking={isTalking} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm">BizSuits Support</h3>
                  <p className="text-white/70 text-xs">Online • Always here to help</p>
                </div>
              </div>

              {/* Chat Messages - WhatsApp wallpaper style */}
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3" style={{ backgroundColor: "#e5ddd5", backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8bfb0' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}>
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "system" && (
                      <div className="w-7 h-7 rounded-xl overflow-hidden shadow-sm shrink-0 mr-2 mt-auto mb-1">
                        <BizFaceLogo size={28} isTalking={isTalking && msg.id === chatMessages[chatMessages.length - 1]?.id} />
                      </div>
                    )}
                    <div className="relative max-w-[85%] sm:max-w-[70%]">
                      <div
                        className={`rounded-lg px-3 py-2 text-sm leading-relaxed shadow-sm ${
                          msg.role === "user"
                            ? "bg-[#dcf8c6] text-gray-800 rounded-tr-none"
                            : "bg-white text-gray-800 rounded-tl-none"
                        }`}
                      >
                        <p>{renderMarkdown(msg.text)}</p>

                        {/* Related questions */}
                        {msg.relatedQuestions?.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-[11px] text-gray-500 mb-1">Related:</p>
                            {msg.relatedQuestions.map((q, i) => (
                              <button
                                key={i}
                                onClick={() => handleRelatedQuestion(q)}
                                className="block text-left text-xs text-[#4c63ae] hover:text-[#3a4f8c] hover:underline mt-1"
                              >
                                → {q}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Ticket prompt */}
                        {msg.showTicketPrompt && (
                          <button
                            onClick={startTicketFromChat}
                            className="mt-2 flex items-center gap-2 text-xs bg-[#4c63ae]/10 text-[#4c63ae] px-3 py-1.5 rounded-lg hover:bg-[#4c63ae]/20 transition-colors border border-[#4c63ae]/20"
                          >
                            <TicketIcon className="w-3.5 h-3.5" />
                            Create Support Ticket
                          </button>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 mt-0.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <span className="text-[10px] text-gray-500">{new Date(msg.id).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {msg.role === "user" && <CheckCheck size={12} className="text-[#53bdeb]" />}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Topics - Always visible */}
              <div className="px-3 py-2 bg-white border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Common topics:
                </p>
                <div className="flex flex-wrap gap-2">
                  {FEATURED_TOPICS.map((entry, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickTopic(entry)}
                      className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-[#4c63ae]/10 hover:text-[#4c63ae] transition-colors border border-gray-200"
                    >
                      {entry.question}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input - WhatsApp style */}
              <div className="bg-[#f0f0f0] px-3 py-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleChatSend(); }}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full px-4 py-2 text-sm bg-white border-0 focus:ring-2 focus:ring-[#4c63ae]/30 outline-none shadow-sm"
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={!chatInput.trim()}
                    className="w-10 h-10 rounded-full bg-[#4c63ae] text-white flex items-center justify-center hover:bg-[#3a4f8c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 text-center">
                  Can't find what you need?{" "}
                  <button onClick={() => { setView("tickets"); setShowNewTicket(true); }} className="text-[#4c63ae] hover:underline">
                    Create a support ticket
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ======== TICKETS VIEW ======== */}
          {view === "tickets" && (
            <div>
              {/* New Ticket Form (collapsible) */}
              <div className="content-card mb-4">
                <button
                  onClick={() => setShowNewTicket(!showNewTicket)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h2 className="text-lg font-semibold text-gray-900">New Ticket</h2>
                  {showNewTicket ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </button>
                {showNewTicket && (
                  <form onSubmit={submitTicket} className="space-y-3 mt-4">
                    <input
                      className="form-input"
                      placeholder="Subject"
                      value={form.subject}
                      onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                    />
                    <textarea
                      className="form-input min-h-28"
                      placeholder="Describe the issue in detail"
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        className="form-select"
                        value={form.category}
                        onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                      >
                        {CATEGORY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <select
                        className="form-select"
                        value={form.priority}
                        onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                      >
                        {PRIORITY_OPTIONS.filter((p) => p.value !== "all").map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      className="form-input"
                      placeholder="Location (optional)"
                      value={form.location}
                      onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                    />
                    <button type="submit" className="btn-action btn-action-primary w-full" disabled={saving}>
                      {saving ? "Submitting..." : "Create Ticket"}
                    </button>
                  </form>
                )}
              </div>

              {/* Ticket Filters */}
              <div className="content-card">
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                  <input
                    className="form-input md:flex-1"
                    placeholder="Search ticket number, subject, description..."
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") fetchTickets(); }}
                  />
                  <select
                    className="form-select md:w-48"
                    value={filters.status}
                    onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <select
                    className="form-select md:w-44"
                    value={filters.priority}
                    onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <button
                    className={`btn-action ${filters.mine ? "btn-action-primary" : "btn-action-secondary"}`}
                    onClick={() => setFilters((prev) => ({ ...prev, mine: !prev.mine }))}
                  >
                    {filters.mine ? "My Tickets" : "All Tickets"}
                  </button>
                  <button className="btn-action btn-action-secondary" onClick={fetchTickets}>
                    Refresh
                  </button>
                </div>

                {loading ? (
                  <div className="text-sm text-gray-500 py-8 text-center">Loading support tickets...</div>
                ) : tickets.length === 0 ? (
                  <div className="text-sm text-gray-500 py-8 text-center">No tickets found for current filters.</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Ticket List */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[620px] overflow-y-auto">
                      {tickets.map((ticket) => (
                        <button
                          key={ticket._id}
                          onClick={() => setSelectedTicketId(ticket._id)}
                          className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                            selectedTicketId === ticket._id ? "bg-sky-50" : "bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm text-gray-900">{ticket.ticketNumber}</span>
                            <span className="text-xs rounded-full px-2 py-0.5 bg-gray-100 text-gray-700">{formatStatusLabel(ticket.status)}</span>
                          </div>
                          <p className="text-sm text-gray-800 mt-1">{ticket.subject}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {ticket.priority} • {ticket.category} • {new Date(ticket.createdAt).toLocaleString()}
                          </p>
                        </button>
                      ))}
                    </div>

                    {/* Ticket Detail */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-white">
                      {!selectedTicket ? (
                        <div className="text-sm text-gray-500">Select a ticket to view details.</div>
                      ) : (
                        <div>
                          <h3 className="font-semibold text-gray-900">{selectedTicket.subject}</h3>
                          <p className="text-xs text-gray-500 mt-1">{selectedTicket.ticketNumber}</p>
                          <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{selectedTicket.description}</p>

                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <select
                              className="form-select"
                              value={selectedTicket.status}
                              onChange={(e) => updateTicket({ status: e.target.value })}
                              disabled={saving}
                            >
                              {STATUS_OPTIONS.filter((s) => s.value !== "all").map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                            <select
                              className="form-select"
                              value={selectedTicket.priority}
                              onChange={(e) => updateTicket({ priority: e.target.value })}
                              disabled={saving}
                            >
                              {PRIORITY_OPTIONS.filter((p) => p.value !== "all").map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>

                          <div className="mt-4">
                            <textarea
                              className="form-input min-h-24"
                              placeholder="Add update/comment..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                            />
                            <button
                              className="btn-action btn-action-primary mt-2"
                              disabled={saving || !comment.trim()}
                              onClick={() => updateTicket({ comment })}
                            >
                              {saving ? "Saving..." : "Add Comment"}
                            </button>
                          </div>

                          <div className="mt-4 border-t border-gray-200 pt-3 max-h-56 overflow-y-auto">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Timeline</h4>
                            {(selectedTicket.comments || []).length === 0 ? (
                              <p className="text-xs text-gray-500">No comments yet.</p>
                            ) : (
                              <div className="space-y-2">
                                {selectedTicket.comments.map((c) => (
                                  <div key={c._id} className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                                    <p className="text-sm text-gray-800">{c.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {c.byName || c.byEmail || "System"} • {new Date(c.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
