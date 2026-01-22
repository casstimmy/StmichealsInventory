import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";

export default function MovementDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [movement, setMovement] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    const movementId = router.query.id;

    async function fetchMovement() {
      try {
        const res = await fetch(`/api/stock-movement/${movementId}`);
        const data = await res.json();
        setMovement(data);
      } catch (err) {
        console.error("Failed to fetch movement:", err);
      }
    }

    fetchMovement();
  }, [router.isReady, router.query.id]);

  function exportToCSV() {
    if (!movement || !Array.isArray(movement.products)) return;

    const rows = [["Product", "Cost Price", "Quantity", "Subtotal"]];
    movement.products.forEach((p) => {
      const name = p?.id?.name || "N/A";
      const cost = p?.id?.costPrice || 0;
      const qty = p.quantity || 0;
      const subtotal = cost * qty;
      rows.push([name, cost, qty, subtotal]);
    });

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stock_movement_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportToExcel() {
    const html = document.getElementById("movement-report")?.outerHTML || "";
    const blob = new Blob([html], {
      type: "application/vnd.ms-excel",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stock_movement_${id}.xls`;
    link.click();
  }

if (!movement)
  return (
    <Layout>
      <div className="p-8 text-gray-600">Loading movement details...</div>
    </Layout>
  );

  const totalCost =
    typeof movement.totalCostPrice === "number"
      ? movement.totalCostPrice.toLocaleString(undefined, {
          minimumFractionDigits: 2,
        })
      : "0.00";

  const products = Array.isArray(movement.products) ? movement.products : [];


  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-3 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Stock Movement Details{" "}
            <span className="text-sm text-cyan-600 ml-2 cursor-pointer hover:underline">
              HELP
            </span>
          </h1>
          <button className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 text-sm font-semibold transition">
            PRINT LABELS
          </button>
        </div>
        <div id="print-section">
          <div className="bg-white border border-gray-200 rounded shadow mb-6 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b font-semibold text-sm text-gray-700">
              Stock Movement Info
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <strong>From Location:</strong> {movement.fromLocation}
              </div>
              <div>
                <strong>To Location:</strong> {movement.toLocation}
              </div>
              <div>
                <strong>Ref. Number:</strong>{" "}
                <div className="font-mono text-lg mt-1">
                  *{movement.transRef}*
                </div>
              </div>
              <div>
                <strong>Reason:</strong> {movement.reason}
              </div>
              <div>
                <strong>Staff Sent:</strong> {movement.staff}
              </div>
              <div>
                <strong>Date Sent:</strong>{" "}
                {new Date(movement.dateSent).toLocaleString()}
              </div>
              <div>
                <strong>Status:</strong> {movement.status}
              </div>
              <div>
                <strong>Staff Received:</strong> {movement.staff}
              </div>
              <div>
                <strong>Date Received:</strong>{" "}
                {movement.dateReceived
                  ? new Date(movement.dateReceived).toLocaleString()
                  : "---"}
              </div>
              <div>
                <strong>Note:</strong> —
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded shadow p-4 mb-8 overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-cyan-100 font-semibold">
                <tr>
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">Unit Cost Price</th>
                  <th className="px-4 py-2">Sent</th>
                  <th className="px-4 py-2">Received</th>
                  <th className="px-4 py-2">Total Cost Price</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => {
                  const name = p.productName || "N/A";
                  const cost = p.costPrice || 0;
                  const qty = p.quantity || 0;
                  const subtotal = cost * qty;
                  return (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{name}</td>
                      <td className="px-4 py-2">₦{cost.toLocaleString()}</td>
                      <td className="px-4 py-2">{qty}</td>
                      <td className="px-4 py-2">{qty}</td>
                      <td className="px-4 py-2 font-medium">
                        ₦{subtotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-cyan-600 text-white font-bold">
                  <td className="px-4 py-2" colSpan={4}>
                    Total:
                  </td>
                  <td className="px-4 py-2">₦{totalCost}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => router.push("/stock/movement")}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
          >
            BACK
          </button>
          <button
            onClick={() => router.push(`/stock/movement/edit/${id}`)}
            className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 text-sm transition font-semibold"
          >
            EDIT / RECEIVE
          </button>
          <button
            onClick={exportToCSV}
            className="bg-gray-100 border px-4 py-2 rounded text-sm hover:bg-gray-200"
          >
            EXPORT TO .CSV
          </button>
          <button
            onClick={exportToExcel}
            className="bg-gray-100 border px-4 py-2 rounded text-sm hover:bg-gray-200"
          >
            EXPORT TO EXCEL
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-100 border px-4 py-2 rounded text-sm hover:bg-gray-200"
          >
            PRINT
          </button>
        </div>
      </div>
    </Layout>
  );
}
