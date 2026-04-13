/**
 * Double-Entry Accounting Auto-Posting Utility
 * 
 * Creates journal entries automatically from business events:
 * - POS Sales → Debit Cash/Bank, Credit Sales Revenue + Credit Tax Payable
 * - Expenses → Debit Expense Account, Credit Cash/Bank
 * - Purchase Order Payment → Debit Inventory/COGS, Credit Cash/Accounts Payable
 * - Salary Payment → Debit Salary Expense, Credit Cash/Bank
 * - Refunds → Reverse of original sale entry
 */

import { mongooseConnect } from "@/lib/mongodb";
import Account from "@/models/Account";
import JournalEntry from "@/models/JournalEntry";

// Default system account codes
const SYSTEM_ACCOUNTS = {
  CASH: "1000",
  BANK: "1010",
  ACCOUNTS_RECEIVABLE: "1100",
  INVENTORY: "1200",
  ACCOUNTS_PAYABLE: "2000",
  TAX_PAYABLE: "2100",
  SALES_REVENUE: "4000",
  COST_OF_GOODS: "5000",
  SALARY_EXPENSE: "6000",
  GENERAL_EXPENSE: "6100",
  REFUND_EXPENSE: "6200",
};

async function getNextEntryNumber() {
  const last = await JournalEntry.findOne({}, { entryNumber: 1 })
    .sort({ createdAt: -1 })
    .lean();
  if (!last) return "JE-0001";
  const num = parseInt(last.entryNumber.replace("JE-", "")) || 0;
  return `JE-${String(num + 1).padStart(4, "0")}`;
}

async function getAccountByCode(code) {
  const account = await Account.findOne({ code, isActive: true }).lean();
  return account;
}

/**
 * Create a journal entry from a POS sale transaction
 */
export async function postSaleEntry(transaction) {
  await mongooseConnect();

  const cashAccount = await getAccountByCode(SYSTEM_ACCOUNTS.CASH);
  const revenueAccount = await getAccountByCode(SYSTEM_ACCOUNTS.SALES_REVENUE);
  if (!cashAccount || !revenueAccount) return null;

  const lines = [];
  const total = transaction.total || 0;
  const tax = transaction.tax || 0;
  const subtotal = total - tax;

  // Debit Cash (or Bank based on tender)
  let debitAccount = cashAccount;
  if (transaction.tenderType === "card" || transaction.tenderType === "transfer") {
    const bankAccount = await getAccountByCode(SYSTEM_ACCOUNTS.BANK);
    if (bankAccount) debitAccount = bankAccount;
  }

  lines.push({
    account: debitAccount._id,
    accountCode: debitAccount.code,
    accountName: debitAccount.name,
    debit: total,
    credit: 0,
    description: "Payment received",
  });

  // Credit Sales Revenue
  lines.push({
    account: revenueAccount._id,
    accountCode: revenueAccount.code,
    accountName: revenueAccount.name,
    debit: 0,
    credit: subtotal,
    description: `Sale - ${transaction.items?.length || 0} items`,
  });

  // Credit Tax Payable (if tax > 0)
  if (tax > 0) {
    const taxAccount = await getAccountByCode(SYSTEM_ACCOUNTS.TAX_PAYABLE);
    if (taxAccount) {
      lines.push({
        account: taxAccount._id,
        accountCode: taxAccount.code,
        accountName: taxAccount.name,
        debit: 0,
        credit: tax,
        description: "Tax collected",
      });
    }
  }

  const entryNumber = await getNextEntryNumber();
  const entry = await JournalEntry.create({
    entryNumber,
    date: transaction.createdAt || new Date(),
    description: `POS Sale - ${transaction.staffName || "Staff"} at ${transaction.location || ""}`,
    lines,
    reference: transaction._id?.toString() || "",
    referenceType: "SALE",
    referenceId: transaction._id,
    status: "POSTED",
    postedAt: new Date(),
    location: transaction.location || "",
  });

  return entry;
}

/**
 * Create a journal entry from an expense
 */
export async function postExpenseEntry(expense) {
  await mongooseConnect();

  const expenseAccount = await getAccountByCode(SYSTEM_ACCOUNTS.GENERAL_EXPENSE);
  const cashAccount = await getAccountByCode(SYSTEM_ACCOUNTS.CASH);
  if (!expenseAccount || !cashAccount) return null;

  const entryNumber = await getNextEntryNumber();
  const entry = await JournalEntry.create({
    entryNumber,
    date: expense.expenseDate || expense.createdAt || new Date(),
    description: `Expense: ${expense.title} - ${expense.categoryName || "General"}`,
    lines: [
      {
        account: expenseAccount._id,
        accountCode: expenseAccount.code,
        accountName: expenseAccount.name,
        debit: expense.amount,
        credit: 0,
        description: expense.title,
      },
      {
        account: cashAccount._id,
        accountCode: cashAccount.code,
        accountName: cashAccount.name,
        debit: 0,
        credit: expense.amount,
        description: `Payment for: ${expense.title}`,
      },
    ],
    reference: expense._id?.toString() || "",
    referenceType: "EXPENSE",
    referenceId: expense._id,
    status: "POSTED",
    postedAt: new Date(),
    location: expense.locationName || "",
  });

  return entry;
}

/**
 * Create a journal entry from a purchase order payment
 */
export async function postPurchaseOrderPayment(po, paymentAmount) {
  await mongooseConnect();

  const inventoryAccount = await getAccountByCode(SYSTEM_ACCOUNTS.INVENTORY);
  const cashAccount = await getAccountByCode(SYSTEM_ACCOUNTS.CASH);
  if (!inventoryAccount || !cashAccount) return null;

  const entryNumber = await getNextEntryNumber();
  const entry = await JournalEntry.create({
    entryNumber,
    date: new Date(),
    description: `PO Payment: ${po.orderRef} - ${po.vendorName}`,
    lines: [
      {
        account: inventoryAccount._id,
        accountCode: inventoryAccount.code,
        accountName: inventoryAccount.name,
        debit: paymentAmount,
        credit: 0,
        description: `Stock purchase from ${po.vendorName}`,
      },
      {
        account: cashAccount._id,
        accountCode: cashAccount.code,
        accountName: cashAccount.name,
        debit: 0,
        credit: paymentAmount,
        description: `Payment for PO ${po.orderRef}`,
      },
    ],
    reference: po.orderRef || "",
    referenceType: "PURCHASE_ORDER",
    referenceId: po._id,
    status: "POSTED",
    postedAt: new Date(),
    location: po.location || "",
  });

  return entry;
}

/**
 * Create a journal entry for a refund
 */
export async function postRefundEntry(transaction) {
  await mongooseConnect();

  const refundAccount = await getAccountByCode(SYSTEM_ACCOUNTS.REFUND_EXPENSE);
  const cashAccount = await getAccountByCode(SYSTEM_ACCOUNTS.CASH);
  if (!refundAccount || !cashAccount) return null;

  const total = transaction.total || 0;
  const entryNumber = await getNextEntryNumber();
  const entry = await JournalEntry.create({
    entryNumber,
    date: transaction.refundedAt || new Date(),
    description: `Refund - ${transaction.refundReason || "Customer refund"}`,
    lines: [
      {
        account: refundAccount._id,
        accountCode: refundAccount.code,
        accountName: refundAccount.name,
        debit: total,
        credit: 0,
        description: `Refund for transaction`,
      },
      {
        account: cashAccount._id,
        accountCode: cashAccount.code,
        accountName: cashAccount.name,
        debit: 0,
        credit: total,
        description: `Cash refund`,
      },
    ],
    reference: transaction._id?.toString() || "",
    referenceType: "REFUND",
    referenceId: transaction._id,
    status: "POSTED",
    postedAt: new Date(),
    location: transaction.location || "",
  });

  return entry;
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
