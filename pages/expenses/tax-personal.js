import Layout from "@/components/Layout";
import { useState } from "react";
import { formatCurrency } from "@/lib/format";

const DEDUCTION_OPTIONS = [
  "NHF (Housing Fund)",
  "NHIS (Health Insurance)",
  "Life Assurance Premium",
  "Voluntary Pension",
  "Others",
];

export default function PersonalTaxCalculator() {
  const [mode, setMode] = useState("yearly");
  const [grossIncome, setGrossIncome] = useState("");
  const [pension, setPension] = useState("");
  const [selectedDeduction, setSelectedDeduction] = useState("");
  const [deductionAmount, setDeductionAmount] = useState("");
  const [deductions, setDeductions] = useState([]);
  const [result, setResult] = useState(null);

const formatCurrencyValue = (num) =>
  formatCurrency(num || 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const addDeduction = () => {
    if (!selectedDeduction || !deductionAmount) return;
    setDeductions((prev) => [
      ...prev,
      {
        name: selectedDeduction,
        amount: parseFloat(deductionAmount),
      },
    ]);
    setDeductionAmount("");
    setSelectedDeduction("");
  };

  const calculateTax = () => {
    const multiplier = mode === "monthly" ? 12 : 1;

    const gross = parseFloat(grossIncome || 0) * multiplier;
    const pensionDeduction = parseFloat(pension || 0) * multiplier;
    const totalOtherDeductions =
      deductions.reduce((sum, d) => sum + d.amount, 0) * multiplier;

    const onePercent = gross * 0.01;
    const cra = Math.max(200000, onePercent) + gross * 0.2;
    const taxableIncome = Math.max(0, gross - pensionDeduction - totalOtherDeductions - cra);

    let remaining = taxableIncome;
    let tax = 0;

    const bands = [
      { limit: 300000, rate: 0.07 },
      { limit: 300000, rate: 0.11 },
      { limit: 500000, rate: 0.15 },
      { limit: 500000, rate: 0.19 },
      { limit: 1600000, rate: 0.21 },
      { limit: Infinity, rate: 0.24 },
    ];

    for (const band of bands) {
      if (remaining <= 0) break;
      const bandAmount = Math.min(remaining, band.limit);
      tax += bandAmount * band.rate;
      remaining -= bandAmount;
    }

    setResult({
      mode,
      gross,
      pension: pensionDeduction,
      other: totalOtherDeductions,
      cra,
      taxableIncome,
      yearlyTax: tax,
      monthlyTax: tax / 12,
      allDeductions: deductions,
    });
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Personal Tax Calculator</h1>
        <p className="text-gray-600 mb-8">
          Use this tool to calculate your estimated personal income tax in accordance with Nigerias Finance Act.
        </p>

        {/* Mode Selection */}
        <div className="mb-6">
          <label className="font-semibold text-gray-700 mr-4">Salary Input Mode:</label>
          <label className="inline-flex items-center mr-6">
            <input
              type="radio"
              value="monthly"
              checked={mode === "monthly"}
              onChange={() => setMode("monthly")}
              className="mr-2"
            />
            Monthly
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="yearly"
              checked={mode === "yearly"}
              onChange={() => setMode("yearly")}
              className="mr-2"
            />
            Yearly
          </label>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="form-group">
            <label className="form-label">
              Gross {mode === "monthly" ? "Monthly" : "Annual"} Income (NGN)
            </label>
            <input
              type="number"
              placeholder="e.g. 500000"
              value={grossIncome}
              onChange={(e) => setGrossIncome(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Pension Contribution ({mode})
            </label>
            <input
              type="number"
              placeholder="e.g. 40000"
              value={pension}
              onChange={(e) => setPension(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {/* Deduction Inputs */}
        <div className="content-card mb-6">
          <label className="form-label mb-3">Add Other Deductions</label>
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedDeduction}
              onChange={(e) => setSelectedDeduction(e.target.value)}
              className="form-select flex-1 min-w-[200px]"
            >
              <option value="">Select Deduction</option>
              {DEDUCTION_OPTIONS.map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Amount"
              value={deductionAmount}
              onChange={(e) => setDeductionAmount(e.target.value)}
              className="form-input w-40"
            />
            <button
              onClick={addDeduction}
              className="btn-action btn-action-success"
            >
              Add
            </button>
          </div>

          {deductions.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-gray-700 list-disc list-inside">
              {deductions.map((d, i) => (
                <li key={i}>
                  {d.name}: {formatCurrencyValue(d.amount * (mode === "monthly" ? 12 : 1))}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculateTax}
          className="btn-action btn-action-primary"
        >
          Calculate My Tax
        </button>

        {/* Result */}
        {result && (
          <div className="content-card mt-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Tax Summary ({mode === "monthly" ? "Monthly" : "Yearly"} Input)
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li><strong>Total Gross Income:</strong> {formatCurrencyValue(result.gross)}</li>
              <li><strong>Less: Pension Contribution:</strong> {formatCurrencyValue(result.pension)}</li>
              <li><strong>Less: Other Deductions:</strong> {formatCurrencyValue(result.other)}</li>
              <li><strong>Less: Consolidated Relief Allowance (CRA):</strong> {formatCurrencyValue(result.cra)}</li>
              <li className="border-t pt-2"><strong>Taxable Income:</strong> {formatCurrencyValue(result.taxableIncome)}</li>
              <li><strong>Estimated Yearly Tax:</strong> {formatCurrencyValue(result.yearlyTax)}</li>
              {mode === "monthly" && (
                <li><strong>Estimated Monthly Tax:</strong> {formatCurrencyValue(result.monthlyTax)}</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
}

