/**
 * Double-Entry Accounting Auto-Posting Utility
 * Auto-creates journal entries from sales, expenses, PO payments, and refunds.
 */

import { mongooseConnect } from "@/lib/mongodb";
import Account from "@/models/Account";
import JournalEntry from "@/models/JournalEntry";

const SYS = {
  CASH: "1000", BANK: "1010", AR: "1100", INVENTORY: "1200",
  AP: "2000", TAX: "2100", REVENUE: "4000", COGS: "5000",
  SALARY: "6000", EXPENSE: "6100", REFUND: "6200",
};

async function getNextEntryNumber() {
  const last = await JournalEntry.findOne({}, { entryNumber: 1 }).sort({ createdAt: -1 }).lean();
  const num = last ? (parseInt(last.entryNumber.replace("JE-", "")) || 0) : 0;
  return `JE-${String(num + 1).padStart(4, "0")}`;
}

async function getAccount(code) {
  return Account.findOne({ code, isActive: true }).lean();
}

/** Shared helper — resolves account codes and creates a posted journal entry */
async function createAutoEntry({ date, description, lines, referenceType, referenceId, reference, location }) {
  await mongooseConnect();

  const resolvedLines = [];
  for (const line of lines) {
    let account = await getAccount(line.code);
    if (!account && line.fallback) account = await getAccount(line.fallback);
    if (!account) return null;
    resolvedLines.push({
      account: account._id,
      accountCode: account.code,
      accountName: account.name,
      debit: line.debit || 0,
      credit: line.credit || 0,
      description: line.description || "",
    });
  }

  return JournalEntry.create({
    entryNumber: await getNextEntryNumber(),
    date: date || new Date(),
    description,
    lines: resolvedLines,
    reference: reference || "",
    referenceType,
    referenceId,
    status: "POSTED",
    postedAt: new Date(),
    location: location || "",
  });
}

/** POS Sale → Debit Cash/Bank, Credit Revenue + Tax */
export async function postSaleEntry(tx) {
  const total = tx.total || 0, tax = tx.tax || 0;
  const isCard = tx.tenderType === "card" || tx.tenderType === "transfer";
  const lines = [
    { code: isCard ? SYS.BANK : SYS.CASH, fallback: SYS.CASH, debit: total, description: "Payment received" },
    { code: SYS.REVENUE, credit: total - tax, description: `Sale - ${tx.items?.length || 0} items` },
  ];
  if (tax > 0) lines.push({ code: SYS.TAX, credit: tax, description: "Tax collected" });

  return createAutoEntry({
    date: tx.createdAt, description: `POS Sale - ${tx.staffName || "Staff"} at ${tx.location || ""}`,
    lines, referenceType: "SALE", referenceId: tx._id, reference: tx._id?.toString(), location: tx.location,
  });
}

/** Expense → Debit Expense, Credit Cash */
export async function postExpenseEntry(exp) {
  return createAutoEntry({
    date: exp.expenseDate || exp.createdAt,
    description: `Expense: ${exp.title} - ${exp.categoryName || "General"}`,
    lines: [
      { code: SYS.EXPENSE, debit: exp.amount, description: exp.title },
      { code: SYS.CASH, credit: exp.amount, description: `Payment for: ${exp.title}` },
    ],
    referenceType: "EXPENSE", referenceId: exp._id, reference: exp._id?.toString(), location: exp.locationName,
  });
}

/** PO Payment → Debit Inventory, Credit Cash */
export async function postPurchaseOrderPayment(po, amount) {
  return createAutoEntry({
    date: new Date(),
    description: `PO Payment: ${po.orderRef} - ${po.vendorName}`,
    lines: [
      { code: SYS.INVENTORY, debit: amount, description: `Stock purchase from ${po.vendorName}` },
      { code: SYS.CASH, credit: amount, description: `Payment for PO ${po.orderRef}` },
    ],
    referenceType: "PURCHASE_ORDER", referenceId: po._id, reference: po.orderRef, location: po.location,
  });
}

/** Refund → Debit Refund Expense, Credit Cash */
export async function postRefundEntry(tx) {
  const total = tx.total || 0;
  return createAutoEntry({
    date: tx.refundedAt,
    description: `Refund - ${tx.refundReason || "Customer refund"}`,
    lines: [
      { code: SYS.REFUND, debit: total, description: "Refund for transaction" },
      { code: SYS.CASH, credit: total, description: "Cash refund" },
    ],
    referenceType: "REFUND", referenceId: tx._id, reference: tx._id?.toString(), location: tx.location,
  });
}

/**
 * Seed default chart of accounts if empty
 */
export async function seedDefaultAccounts() {
  await mongooseConnect();
  const count = await Account.countDocuments();
  if (count > 0) return false;

  const defaults = [
    // Assets
    { code: "1000", name: "Cash", type: "ASSET", subType: "Current Asset", normalBalance: "DEBIT", isSystem: true },
    { code: "1010", name: "Bank", type: "ASSET", subType: "Current Asset", normalBalance: "DEBIT", isSystem: true },
    { code: "1100", name: "Accounts Receivable", type: "ASSET", subType: "Current Asset", normalBalance: "DEBIT", isSystem: true },
    { code: "1200", name: "Inventory", type: "ASSET", subType: "Current Asset", normalBalance: "DEBIT", isSystem: true },
    { code: "1300", name: "Prepaid Expenses", type: "ASSET", subType: "Current Asset", normalBalance: "DEBIT" },
    { code: "1500", name: "Equipment", type: "ASSET", subType: "Fixed Asset", normalBalance: "DEBIT" },
    { code: "1510", name: "Furniture & Fixtures", type: "ASSET", subType: "Fixed Asset", normalBalance: "DEBIT" },
    { code: "1600", name: "Accumulated Depreciation", type: "ASSET", subType: "Contra Asset", normalBalance: "CREDIT" },

    // Liabilities
    { code: "2000", name: "Accounts Payable", type: "LIABILITY", subType: "Current Liability", normalBalance: "CREDIT", isSystem: true },
    { code: "2100", name: "Tax Payable", type: "LIABILITY", subType: "Current Liability", normalBalance: "CREDIT", isSystem: true },
    { code: "2200", name: "Salaries Payable", type: "LIABILITY", subType: "Current Liability", normalBalance: "CREDIT" },
    { code: "2300", name: "Loan Payable", type: "LIABILITY", subType: "Long-term Liability", normalBalance: "CREDIT" },

    // Equity
    { code: "3000", name: "Owner's Equity", type: "EQUITY", subType: "Owner's Equity", normalBalance: "CREDIT", isSystem: true },
    { code: "3100", name: "Retained Earnings", type: "EQUITY", subType: "Retained Earnings", normalBalance: "CREDIT", isSystem: true },
    { code: "3200", name: "Owner's Drawings", type: "EQUITY", subType: "Drawings", normalBalance: "DEBIT" },

    // Revenue
    { code: "4000", name: "Sales Revenue", type: "REVENUE", subType: "Operating Revenue", normalBalance: "CREDIT", isSystem: true },
    { code: "4100", name: "Service Revenue", type: "REVENUE", subType: "Operating Revenue", normalBalance: "CREDIT" },
    { code: "4200", name: "Other Income", type: "REVENUE", subType: "Non-Operating Revenue", normalBalance: "CREDIT" },

    // Expenses
    { code: "5000", name: "Cost of Goods Sold", type: "EXPENSE", subType: "Cost of Sales", normalBalance: "DEBIT", isSystem: true },
    { code: "6000", name: "Salary Expense", type: "EXPENSE", subType: "Operating Expense", normalBalance: "DEBIT", isSystem: true },
    { code: "6100", name: "General Expense", type: "EXPENSE", subType: "Operating Expense", normalBalance: "DEBIT", isSystem: true },
    { code: "6200", name: "Refund Expense", type: "EXPENSE", subType: "Operating Expense", normalBalance: "DEBIT", isSystem: true },
    { code: "6300", name: "Rent Expense", type: "EXPENSE", subType: "Operating Expense", normalBalance: "DEBIT" },
    { code: "6400", name: "Utilities Expense", type: "EXPENSE", subType: "Operating Expense", normalBalance: "DEBIT" },
    { code: "6500", name: "Transport Expense", type: "EXPENSE", subType: "Operating Expense", normalBalance: "DEBIT" },
    { code: "6600", name: "Depreciation Expense", type: "EXPENSE", subType: "Operating Expense", normalBalance: "DEBIT" },
    { code: "6700", name: "Insurance Expense", type: "EXPENSE", subType: "Operating Expense", normalBalance: "DEBIT" },
    { code: "6800", name: "Marketing Expense", type: "EXPENSE", subType: "Operating Expense", normalBalance: "DEBIT" },
    { code: "6900", name: "Miscellaneous Expense", type: "EXPENSE", subType: "Operating Expense", normalBalance: "DEBIT" },
  ];

  await Account.insertMany(defaults);
  return true;
}
