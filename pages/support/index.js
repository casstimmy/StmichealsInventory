import { useEffect, useMemo, useRef, useState } from "react";
import Layout from "@/components/Layout";
import { apiClient } from "@/lib/api-client";
import { MessageCircle, Send, TicketIcon, ArrowLeft, ChevronDown, ChevronUp, HelpCircle, X } from "lucide-react";

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
    keywords: ["add product", "new product", "create product"],
    question: "How do I add a new product?",
    answer: "Go to **Products** from the sidebar, then click **Add Product**. Fill in the product name, price, category, and other details. Click **Save** to add it to your inventory.",
  },
  {
    keywords: ["stock", "inventory level", "low stock", "out of stock"],
    question: "How do I manage stock levels?",
    answer: "Navigate to **Stock Management** under the Manage menu. You can view current stock levels, add stock movements (receive, transfer, adjust), and set up low-stock alerts for each product.",
  },
  {
    keywords: ["expense", "add expense", "record expense"],
    question: "How do I record an expense?",
    answer: "Go to **Expenses** → **Expenses Entry**. Fill in the title, amount, category, location, and optional staff member. Click **Add Expense** to record it.",
  },
  {
    keywords: ["vendor", "supplier", "purchase order"],
    question: "How do I place a purchase order?",
    answer: "Navigate to **Manage** → **Vendors**. Select a vendor and click **Place Order**. Add the items you want to order, specify quantities and costs, then submit the order.",
  },
  {
    keywords: ["report", "sales report", "analytics", "reporting"],
    question: "How do I view sales reports?",
    answer: "Go to **Reporting** in the sidebar. You can view sales by time intervals, employees, products, and more. Use the date range and location filters to narrow down your data.",
  },
  {
    keywords: ["staff", "employee", "add staff", "onboarding"],
    question: "How do I add and manage staff?",
    answer: "Go to **Manage** → **Staff**. Click **Add New Staff** to create a staff member with their name, role, location, and password. Once created, you can copy their onboarding link for them to complete their profile.",
  },
  {
    keywords: ["transaction", "refund", "void", "edit transaction"],
    question: "How do I edit or refund a transaction?",
    answer: "Go to **Reporting** → **Completed Transactions**. Find the transaction, expand it, and use the action buttons to request an edit, void, or refund. All actions require a reason and may need manager approval.",
  },
  {
    keywords: ["location", "add location", "store location"],
    question: "How do I manage store locations?",
    answer: "Navigate to **Setup** from the sidebar. Under the store settings, you can add, edit, or remove locations. Each location can be assigned to staff and used for tracking sales and expenses.",
  },
  {
    keywords: ["asset", "equipment", "maintenance"],
    question: "How do I track assets and maintenance?",
    answer: "Go to **Manage** → **Assets** to add and manage equipment and assets. You can add custom properties, schedule maintenance, and track disposal. Maintenance expenses can be linked to specific assets through the Expenses page.",
  },
  {
    keywords: ["promotion", "discount", "promo code"],
    question: "How do I set up promotions?",
    answer: "Navigate to **Manage** → **Promotions**. Create new promotions with discount types (percentage or fixed), set date ranges, and assign them to specific products or categories.",
  },
  {
    keywords: ["password", "login", "access", "permission", "role"],
    question: "How do I manage access and permissions?",
    answer: "Staff roles determine access levels: **Admin** has full access, **Manager** can manage most operations, **Staff** handles day-to-day tasks, **Junior Staff** has limited access, and **Viewer** is read-only. Edit a staff member's role under **Manage** → **Staff**.",
  },
  {
    keywords: ["till", "pos", "point of sale", "checkout"],
    question: "How do I access the Point of Sale (Till)?",
    answer: "Click **Till** in the sidebar to open the Point of Sale application in a new tab. Use it to process sales, apply discounts, and handle split payments.",
  },
  {
    keywords: ["tax", "tax report", "tax analysis"],
    question: "How do I view tax reports?",
    answer: "Go to **Expenses** → **Tax Analysis** for business tax summaries, or **Personal Tax Calculator** for individual tax calculations. These tools help you track and plan for tax obligations.",
  },
  {
    keywords: ["eod", "end of day", "close day", "daily report"],
    question: "How does End of Day (EOD) work?",
    answer: "The EOD system automatically generates daily summaries of sales, expenses, and transactions. Navigate to **Reporting** to review daily performance. EOD reports help track cash flow and reconcile daily operations.",
  },
  {
    keywords: ["held", "hold transaction", "pending"],
    question: "What are held transactions?",
    answer: "Held transactions are sales that have been started but not yet completed (e.g., customer is still shopping). They are NOT counted in your sales totals or reports. You can find and complete them from the Till/POS system.",
  },
];

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
    setShowQuickTopics(false);

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
    }, 400);
  };

  const handleQuickTopic = (entry) => {
    const userMsg = { id: Date.now(), role: "user", text: entry.question };
    const answer = { id: Date.now() + 1, role: "system", text: entry.answer };
    setChatMessages(prev => [...prev, userMsg, answer]);
    setShowQuickTopics(false);
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === "chat" ? "bg-sky-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                Q&A
              </button>
              <button
                onClick={() => setView("tickets")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === "tickets" ? "bg-sky-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <TicketIcon className="w-4 h-4" />
                Tickets
              </button>
            </div>
          </div>

          {message && (
            <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              {message}
            </div>
          )}

          {/* ======== CHAT Q&A VIEW ======== */}
          {view === "chat" && (
            <div className="content-card flex flex-col" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-sky-600 text-white rounded-br-md"
                          : "bg-gray-100 text-gray-800 rounded-bl-md"
                      }`}
                    >
                      <p>{renderMarkdown(msg.text)}</p>

                      {/* Related questions */}
                      {msg.relatedQuestions?.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Related:</p>
                          {msg.relatedQuestions.map((q, i) => (
                            <button
                              key={i}
                              onClick={() => handleRelatedQuestion(q)}
                              className="block text-left text-xs text-sky-600 hover:text-sky-800 hover:underline mt-1"
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
                          className="mt-3 flex items-center gap-2 text-xs bg-white text-sky-700 px-3 py-2 rounded-lg hover:bg-sky-50 transition-colors border border-sky-200"
                        >
                          <TicketIcon className="w-3.5 h-3.5" />
                          Create Support Ticket
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Topics */}
              {showQuickTopics && (
                <div className="px-2 pb-3">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Common topics:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {KNOWLEDGE_BASE.slice(0, 6).map((entry, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickTopic(entry)}
                        className="text-xs px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors border border-sky-200"
                      >
                        {entry.question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input */}
              <div className="border-t border-gray-200 px-2 py-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleChatSend(); }}
                    placeholder="Ask a question..."
                    className="form-input flex-1"
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={!chatInput.trim()}
                    className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Can't find what you need?{" "}
                  <button onClick={() => { setView("tickets"); setShowNewTicket(true); }} className="text-sky-600 hover:underline">
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
