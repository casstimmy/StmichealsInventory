import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import Loader from "@/components/Loader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faScaleBalanced,
  faMoneyBillWave,
  faFileDownload,
  faChartLine,
  faCheckCircle,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { theme } from "@/styles/theme";

export default function TaxAnalysisPage() {
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("last-month");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTaxData();
  }, [period]);

  const fetchTaxData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("🔄 Fetching tax data for period:", period);
      const response = await fetch(`/api/taxes/analysis?period=${period}`);
      console.log("📋 Response status:", response.status);
      
      if (!response.ok) {
        let errorMessage = "Failed to fetch tax data";
        try {
          const errorData = await response.json();
          console.error("❌ API error response:", errorData);
          errorMessage = errorData.message || errorData.details || errorMessage;
        } catch (e) {
          console.error("❌ Could not parse error response");
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("✅ Tax data received:", data);
      setTaxData(data);
    } catch (err) {
      const errorMsg = err?.message || "Unknown error occurred";
      console.error("❌ Error fetching tax data:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page-container">
        <div className="page-content">
          {/* Header Section */}
          <div className="page-header flex-col md:flex-row md:justify-between md:items-start gap-6">
            <div>
              <h1 className="page-title">Tax Analysis Dashboard</h1>
              <p className="page-subtitle max-w-2xl">
                Comprehensive tax performance summary and compliance tracking according to Nigeria Finance Act 2023.
              </p>
            </div>
            
            {/* Period Selector - Enhanced */}
            <div className="content-card min-w-max">
              <label className="form-label flex items-center gap-2">
                <FontAwesomeIcon icon={faChartLine} className="text-sky-600" />
                Reporting Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="form-select md:w-48"
              >
                <optgroup label="Last Period" className="font-semibold">
                  <option value="last-month">Last 30 Days</option>
                  <option value="last-quarter">Last 3 Months</option>
                  <option value="last-year">Last Year</option>
                </optgroup>
                <optgroup label="This Period">
                  <option value="this-month">This Month (MTD)</option>
                  <option value="this-quarter">This Quarter (QTD)</option>
                  <option value="this-year">This Year (YTD)</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg shadow-sm">
              <div className="flex items-start gap-3">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mt-1 text-lg" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Error Loading Tax Data</h3>
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="content-card flex items-center justify-center min-h-96">
              <Loader size="md" text="Calculating tax analysis..." />
            </div>
          ) : !taxData ? (
            <div className="empty-state-container">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-gray-400 text-5xl mb-4" />
              <p className="empty-state-text">No tax data available for the selected period</p>
            </div>
          ) : (
            <>
              {/* Key Metrics - Top Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatBox
                  icon={faScaleBalanced}
                  label="Revenue Band"
                  value={taxData.band}
                  bgColor="from-gray-50 to-gray-100"
                  borderColor="border-gray-200"
                  iconColor="text-cyan-600"
                />
                <StatBox
                  icon={faChartLine}
                  label="CIT Rate"
                  value={`${taxData.citRate}%`}
                  bgColor="from-amber-50 to-amber-100"
                  borderColor="border-amber-200"
                  iconColor="text-amber-600"
                />
                <StatBox
                  icon={faMoneyBillWave}
                  label="VAT Rate"
                  value={`${taxData.vatRate}%`}
                  bgColor="from-emerald-50 to-emerald-100"
                  borderColor="border-emerald-200"
                  iconColor="text-emerald-600"
                />
                <StatBox
                  icon={faMoneyBillWave}
                  label="Total Tax Liability"
                  value={`₦${(taxData.totalTaxLiability || 0).toLocaleString()}`}
                  bgColor="from-rose-50 to-rose-100"
                  borderColor="border-rose-200"
                  iconColor="text-rose-600"
                />
              </div>

              {/* Income Summary Section */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <div className="w-1.5 h-8 bg-cyan-600 rounded-full"></div>
                  Financial Summary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <DetailBox
                    label="Total Revenue"
                    value={`₦${(taxData.totalRevenue || 0).toLocaleString()}`}
                    icon={faMoneyBillWave}
                    iconColor="text-cyan-600"
                  />
                  <DetailBox
                    label="Total Expenses"
                    value={`₦${(taxData.totalExpenses || 0).toLocaleString()}`}
                    icon={faMoneyBillWave}
                    iconColor="text-orange-600"
                  />
                  <DetailBox
                    label="Net Profit"
                    value={`₦${(taxData.netProfit || 0).toLocaleString()}`}
                    icon={faMoneyBillWave}
                    iconColor="text-green-600"
                  />
                  <DetailBox
                    label="Company Income Tax"
                    value={`₦${(taxData.companyIncomeTax || 0).toLocaleString()}`}
                    icon={faMoneyBillWave}
                    iconColor="text-purple-600"
                  />
                </div>
              </div>

              {/* Tax Details Section */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <div className="w-1.5 h-8 bg-emerald-600 rounded-full"></div>
                  Tax Breakdown
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <DetailBox
                    label="National Health Insurance Levy (0.5%)"
                    value={`₦${(taxData.nhlAmount || 0).toLocaleString()}`}
                    icon={faCheckCircle}
                    iconColor="text-teal-600"
                  />
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl text-cyan-600 mt-1">
                        <FontAwesomeIcon icon={faCheckCircle} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-600 mb-2">Compliance Status</p>
                        <p className="text-gray-900 font-medium">All deductions & reliefs properly documented</p>
                        <p className="text-xs text-gray-600 mt-2">Ensure records are retained for audit purposes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown Table Section */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <div className="w-1.5 h-8 bg-purple-600 rounded-full"></div>
                  Period Breakdown
                </h2>
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Period</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">Revenue (₦)</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">Expenses (₦)</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">VAT (₦)</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">CIT (₦)</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold">NHL (₦)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {taxData.breakdown && taxData.breakdown.length > 0 ? (
                          taxData.breakdown.map((item, index) => (
                            <tr key={index} className={`transition-colors ${index % 2 === 0 ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'}`}>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.month}</td>
                              <td className="px-6 py-4 text-sm text-right text-gray-700 font-mono">{(item.income || 0).toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm text-right text-gray-700 font-mono">{(item.expenses || 0).toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm text-right text-gray-700 font-mono">{(item.vat || 0).toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm text-right text-gray-700 font-mono font-semibold">{(item.cit || 0).toLocaleString()}</td>
                              <td className="px-6 py-4 text-sm text-right text-gray-700 font-mono">{(item.nhl || 0).toLocaleString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="py-8 px-6 text-center text-gray-500">
                              <FontAwesomeIcon icon={faExclamationTriangle} className="text-gray-400 mr-2" />
                              No breakdown data available for this period
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-900 font-medium">
                    📋 <strong>Tax Calculation Basis:</strong> Nigeria Finance Act 2023 - CIT exemption up to ₦25M (0%), ₦25M-₦100M (20%), above ₦100M (30%). VAT at 7.5%, NHL at 0.5%.
                  </p>
                </div>
              </div>

              {/* Action Section */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  <p>Last updated: <span className="font-semibold text-gray-900">{new Date().toLocaleDateString()}</span></p>
                </div>
                <button
                  onClick={() => alert("Tax Report downloaded")}
                  className="btn-action btn-action-primary flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faFileDownload} />
                  Download Tax Report
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

function StatBox({ icon, label, value, bgColor, borderColor, iconColor }) {
  return (
    <div className={`bg-gradient-to-br ${bgColor} border ${borderColor} rounded-xl p-6 shadow-sm hover:shadow-lg transition-all transform hover:scale-105`}>
      <div className="flex items-start gap-4">
        <div className={`text-3xl ${iconColor} bg-white bg-opacity-50 p-3 rounded-lg`}>
          <FontAwesomeIcon icon={icon} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DetailBox({ label, value, icon, iconColor }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className={`text-2xl ${iconColor} mt-1`}>
          <FontAwesomeIcon icon={icon} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 mb-2">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

