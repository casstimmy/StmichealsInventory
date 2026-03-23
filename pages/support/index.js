import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { apiClient } from "@/lib/api-client";

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

function formatStatusLabel(value) {
  return String(value || "open").replace(/_/g, " ");
}

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
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
    fetchTickets();
  }, [filters.status, filters.priority, filters.mine]);

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
      setForm({
        subject: "",
        description: "",
        category: "general",
        priority: "medium",
        location: "",
      });
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
          <div className="page-header">
            <h1 className="page-title">Support Center</h1>
            <p className="page-subtitle">Create and manage internal support tickets for operations, tax, and technical issues.</p>
          </div>

          {message && (
            <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="content-card xl:col-span-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">New Ticket</h2>
              <form onSubmit={submitTicket} className="space-y-3">
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
            </div>

            <div className="content-card xl:col-span-2">
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <input
                  className="form-input md:flex-1"
                  placeholder="Search ticket number, subject, description..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchTickets();
                  }}
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
        </div>
      </div>
    </Layout>
  );
}
