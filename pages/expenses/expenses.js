import ExpenseForm from "@/components/ExpenseForm";
import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import { CalendarDays, CircleDollarSign, MapPin } from "lucide-react";

export default function ManageExpenses() {
  const [expenses, setExpenses] = useState([]);

  const fetchExpenses = async () => {
    const res = await fetch("/api/expenses");
    if (res.ok) {
      const data = await res.json();
      // Ensure it's an array
      setExpenses(Array.isArray(data) ? data : []);
    } else {
      console.error("Failed to fetch expenses");
      setExpenses([]);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <Layout>
      <div className="page-container">
        <div className="page-content">
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">Expense Management</h1>
            <p className="page-subtitle">Track and manage all business expenses</p>
          </div>

          {/* Add Expense Form */}
          <div className="mb-6">
            <ExpenseForm onSaved={fetchExpenses} />
          </div>

          {/* Expenses List */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Recent Expenses</h2>
              <p className="text-gray-600 text-sm mt-1">Total expenses: {expenses.length}</p>
            </div>

            {expenses.length === 0 ? (
              <div className="content-card empty-state">
                <CircleDollarSign className="empty-state-icon" />
                <p className="empty-state-title">No expenses recorded yet.</p>
                <p className="empty-state-description">Add your first expense to get started.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {expenses.map((exp) => (
                  <div
                    key={exp._id}
                    className="content-card hover:shadow-md transition-shadow"
                  >
                    {/* Header with Title and Amount */}
                    <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-start gap-3">
                        <CircleDollarSign className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <h3 className="text-lg font-bold text-gray-900 flex-1">{exp.title}</h3>
                      </div>
                      <span className="text-xl font-bold text-green-600 whitespace-nowrap ml-2">
                        ₦{exp.amount?.toLocaleString()}
                      </span>
                    </div>

                    {/* Category Badge */}
                    <div className="mb-4">
                      <span className="inline-block bg-cyan-100 text-cyan-800 px-3 py-1.5 rounded-full text-xs font-bold uppercase">
                        {exp?.category?.name || "Uncategorized"}
                      </span>
                    </div>

                    {/* Location and Date */}
                    <div className="space-y-2 mb-4 text-sm">
                      {exp.location && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{exp.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarDays className="w-4 h-4 text-gray-500" />
                        <span>
                          {new Date(exp.createdAt).toLocaleDateString("en-NG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {exp.description && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mt-4">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

