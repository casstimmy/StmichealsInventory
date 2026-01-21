import Layout from "@/components/Layout";
import axios from "axios";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function DeleteCategoryPage() {
  const router = useRouter();
  const [categoryInfo, setCategoryInfo] = useState();
  const { id } = router.query;

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/categories?id=${id}`).then((res) => {
      setCategoryInfo(res.data);
    }).catch((err) => {
      console.error("Failed to fetch category:", err);
      alert("Could not fetch category details.");
    });
  }, [id]);

  function goBack() {
    router.push("/manage/categories");
  }

  // Handle Delete Categories
  const handleDeleteClick = async () => {
    try {
      await axios.delete(`/api/categories?id=${id}`);
      goBack();
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Failed to delete category. Please try again.");
    }
  };

  return (
    <Layout>
      <div>Categories Delete</div>
      <div className="flex items-center justify-center min-h-full">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">
            Confirm Deletion
          </h1>
          <p className="text-gray-600 mb-8">
            Are you sure you want to delete <strong>{categoryInfo?.name || "this category"}</strong>?
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleDeleteClick}
              className="py-2 px-6 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition duration-300"
            >
              Yes, Delete
            </button>
            <button
              onClick={goBack}
              className="py-2 px-6 bg-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-400 transition duration-300"
            >
              No, Cancel
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
