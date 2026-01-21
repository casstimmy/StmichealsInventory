import { useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import { Loader } from "@/components/ui";

export default function ExpenseForm({ onSaved }) {
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    description: "",
    location: "",
  });

  const [customCategory, setCustomCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch("/api/expenses/expense-category");
      const data = await res.json();
      setCategories(data);
    }
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      setIsOtherCategory(value === "Other");
      if (value !== "Other") setCustomCategory("");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let categoryToSave = formData.category;

    // If "Other" was selected, create the custom category first
    if (isOtherCategory && customCategory) {
      const res = await fetch("/api/expenses/expense-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: customCategory }),
      });

      if (res.ok) {
        const updatedCats = await res.json();
        setCategories(updatedCats);
        const newCat = updatedCats.find((cat) => cat.name === customCategory)?._id;

        if (newCat) {
          categoryToSave = newCat;
        } else {
          alert("Failed to find new category after creation");
          setLoading(false);
          return;
        }
      } else {
        alert("Failed to create custom category");
        setLoading(false);
        return;
      }
    }

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.title,
        amount: formData.amount,
        category: categoryToSave,
        description: formData.description,
        location: formData.location || null,
      }),
    });

    if (res.ok) {
      setFormData({ title: "", amount: "", category: "", description: "", location: "" });
      setCustomCategory("");
      setIsOtherCategory(false);
      onSaved && onSaved();
    } else {
      alert("Failed to save expense");
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gradient-to-b from-white to-blue-50 p-6 rounded-2xl shadow-md border border-blue-100 space-y-5 transition-all duration-300 hover:shadow-lg"
    >
      {/* Header */}
      <h2 className="text-xl font-semibold text-blue-800 flex items-center gap-2 mb-2">
        <PlusCircle className="w-5 h-5 text-blue-500" />
        Add New Expense
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Record a new expense for St's Micheals operations
      </p>

      {/* Title */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-blue-800">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
          placeholder="e.g., Fabric purchase"
        />
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-blue-800">Amount (₦)</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          required
          className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
          placeholder="e.g., 15000"
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-blue-800">Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full p-3 border border-blue-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none"
        >
          <option value="" disabled>
            Select Category
          </option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Custom Category Input */}
      {isOtherCategory && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-blue-800">
            Enter Custom Category
          </label>
          <input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            required
            className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            placeholder="e.g., Tailor Supplies"
          />
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-blue-800">
          Description (Optional)
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
          placeholder="Add notes about this expense..."
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg flex items-center justify-center transition duration-300 disabled:opacity-50"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <Loader size="sm" text="Saving..." />
          </div>
        ) : (
          "Add Expense"
        )}
      </button>
    </form>
  );
}
