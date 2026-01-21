"use client";

import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faEdit,
  faPlus,
  faImages,
  faSave,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import Loader from "@/components/Loader";

export default function Categories() {
  const [name, setName] = useState("");
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parentCategory, setParentCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editedCategory, setEditedCategory] = useState({
    name: "",
    parentCategory: "",
    images: [],
    properties: [],
  });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch categories once
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/api/categories");
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch categories");
      }
    })();
  }, []);

  // ✅ Image upload handler
  const uploadImage = async (e, isEdit = false) => {
    const files = e.target.files;
    if (!files?.length) return;

    const previews = Array.from(files).map((file) => ({
      full: URL.createObjectURL(file),
      thumb: URL.createObjectURL(file),
      isTemp: true,
    }));

    if (isEdit)
      setEditedCategory((prev) => ({ ...prev, images: previews }));
    else setImages(previews);

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("file", f));

    setLoading(true);
    try {
      const res = await axios.post("/api/upload", formData);
      const uploaded = res.data?.links || [];
      const formatted = uploaded.map((link) => ({
        full: link.full || link,
        thumb: link.thumb || link,
      }));

      if (isEdit)
        setEditedCategory((prev) => ({ ...prev, images: formatted }));
      else setImages(formatted);
    } catch (err) {
      console.error(err);
      alert("Image upload failed");
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index, isEdit = false) => {
    if (isEdit)
      setEditedCategory((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    else setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ Add, remove, and edit property pairs
  const addProperty = (isEdit = false) => {
    const newProp = { propName: "", propValue: "" };
    if (isEdit)
      setEditedCategory((prev) => ({
        ...prev,
        properties: [...prev.properties, newProp],
      }));
    else setProperties((prev) => [...prev, newProp]);
  };

  const handlePropertyChange = (index, key, value, isEdit = false) => {
    if (isEdit) {
      setEditedCategory((prev) => {
        const updated = [...prev.properties];
        updated[index][key] = value;
        return { ...prev, properties: updated };
      });
    } else {
      setProperties((prev) => {
        const updated = [...prev];
        updated[index][key] = value;
        return updated;
      });
    }
  };

  const removeProperty = (index, isEdit = false) => {
    if (isEdit)
      setEditedCategory((prev) => ({
        ...prev,
        properties: prev.properties.filter((_, i) => i !== index),
      }));
    else setProperties((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ Save New Category
  const saveCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Category name is required");
    if (!images.length) return alert("Please upload at least one image");

    const formattedImages = images.map((img) => ({
      full: img.full,
      thumb: img.thumb,
    }));

    try {
      const res = await axios.post("/api/categories", {
        name,
        parentCategory: parentCategory || null,
        images: formattedImages,
        properties,
      });
      setCategories((prev) => [...prev, res.data]);
      setName("");
      setParentCategory("");
      setImages([]);
      setProperties([]);
    } catch (err) {
      console.error(err);
      alert("Failed to save category");
    }
  };

  // ✅ Edit & Update
  const handleEditClick = (index, cat) => {
    setEditIndex(index);
    setEditedCategory({
      _id: cat._id,
      name: cat.name,
      parentCategory: cat.parent?._id || "",
      images: cat.images || [],
      properties: cat.properties || [],
    });
  };

  const handleUpdateClick = async (id) => {
    if (!editedCategory.name.trim())
      return alert("Category name is required");
    if (!editedCategory.images.length)
      return alert("Please upload at least one image");

    const formattedImages = editedCategory.images.map((img) => ({
      full: img.full,
      thumb: img.thumb,
    }));

    try {
      const res = await axios.put("/api/categories", {
        _id: id,
        ...editedCategory,
        images: formattedImages,
      });
      setCategories((prev) =>
        prev.map((cat) => (cat._id === id ? res.data : cat))
      );
      setEditIndex(null);
      setEditedCategory({
        name: "",
        parentCategory: "",
        images: [],
        properties: [],
      });
    } catch (err) {
      console.error(err);
      alert("Failed to update category");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await axios.delete("/api/categories?id=" + id);
      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="px-6 py-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <input
              type="text"
              placeholder="Search categories..."
              className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-64 mt-4 sm:mt-0 focus:outline-none focus:ring-2 focus:ring-cyan-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Add Category */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <form onSubmit={saveCategory} className="space-y-6">
              <div className="flex items-center gap-2 border-b pb-3">
                <FontAwesomeIcon icon={faPlus} className="text-cyan-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Add New Category
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-cyan-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-700 mb-1">
                    Parent Category
                  </label>
                  <select
                    value={parentCategory}
                    onChange={(e) => setParentCategory(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                  >
                    <option value="">No Parent</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images
                </label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg cursor-pointer hover:bg-cyan-700 transition">
                    <FontAwesomeIcon icon={faImages} />
                    Upload
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={uploadImage}
                    />
                  </label>
                  {loading && <Loader />}
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={img.thumb || img.full}
                        className="w-16 h-16 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg hover:opacity-90 transition"
              >
                Save Category
              </button>
            </form>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-medium">
                <tr>
                  <th className="p-3">Image</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Parent</th>
                  <th className="p-3">Properties</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat, i) => (
                  <tr key={cat._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      {cat.images && cat.images.length > 0 ? (
                        <img
                          src={cat.images[0].thumb || cat.images[0].full}
                          alt={cat.name}
                          className="w-12 h-12 object-cover rounded-md border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center text-gray-400">
                          <FontAwesomeIcon icon={faImages} />
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-medium text-gray-900">{cat.name}</td>
                    <td className="p-3">{cat.parent?.name || "-"}</td>
                    <td className="p-3">
                      {(cat.properties || []).map((p, k) => (
                        <span
                          key={k}
                          className="bg-cyan-100 text-cyan-700 text-xs px-2 py-1 rounded-md border border-cyan-300 mr-2"
                        >
                          {p.propName}: {p.propValue}
                        </span>
                      ))}
                    </td>
                    <td className="p-3 flex justify-center gap-3">
                      <button
                        onClick={() => handleEditClick(i, cat)}
                        className="text-cyan-600 hover:text-gray-900"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCategories.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="p-4 text-center text-gray-400"
                    >
                      No categories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Edit Modal */}
          {editIndex !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Edit Category</h2>
                    <button
                      onClick={() => setEditIndex(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                  </div>

                  {/* Form */}
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-cyan-700 mb-2">
                          Category Name
                        </label>
                        <input
                          type="text"
                          value={editedCategory.name}
                          onChange={(e) =>
                            setEditedCategory((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Enter category name"
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-cyan-700 mb-2">
                          Parent Category
                        </label>
                        <select
                          value={editedCategory.parentCategory}
                          onChange={(e) =>
                            setEditedCategory((prev) => ({
                              ...prev,
                              parentCategory: e.target.value,
                            }))
                          }
                          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                        >
                          <option value="">No Parent</option>
                          {categories
                            .filter((c) => c._id !== editedCategory._id)
                            .map((cat) => (
                              <option key={cat._id} value={cat._id}>
                                {cat.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Images
                      </label>
                      <div className="flex flex-wrap gap-3 mb-3">
                        <label className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg cursor-pointer hover:bg-cyan-700 transition">
                          <FontAwesomeIcon icon={faImages} />
                          Upload
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => uploadImage(e, true)}
                          />
                        </label>
                        {loading && <Loader />}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {editedCategory.images?.map((img, i) => (
                          <div key={i} className="relative group">
                            <img
                              src={img.thumb || img.full}
                              alt={`Category ${i}`}
                              className="w-16 h-16 object-cover rounded-md border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(i, true)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Properties */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-gray-700">
                          Properties
                        </label>
                        <button
                          type="button"
                          onClick={() => addProperty(true)}
                          className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                        >
                          + Add Property
                        </button>
                      </div>
                      <div className="space-y-3">
                        {editedCategory.properties?.map((prop, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Property name"
                              value={prop.propName || ""}
                              onChange={(e) =>
                                handlePropertyChange(
                                  i,
                                  "propName",
                                  e.target.value,
                                  true
                                )
                              }
                              className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                            />
                            <input
                              type="text"
                              placeholder="Property value"
                              value={prop.propValue || ""}
                              onChange={(e) =>
                                handlePropertyChange(
                                  i,
                                  "propValue",
                                  e.target.value,
                                  true
                                )
                              }
                              className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => removeProperty(i, true)}
                              className="text-red-500 hover:text-red-700 px-3 py-2"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex gap-3 border-t pt-4">
                    <button
                      onClick={() => setEditIndex(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateClick(editedCategory._id)}
                      className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <FontAwesomeIcon icon={faSave} />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

