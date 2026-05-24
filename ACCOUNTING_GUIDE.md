# Accounting System Documentation

## Overview

The accounting system uses **double-entry bookkeeping**. Every transaction creates a journal entry where **total debits always equal total credits**. This keeps the books balanced automatically.

---

## Navigation (4 pages)

| Page | URL | Purpose |
|------|-----|---------|
| **Chart of Accounts** | `/accounting/chart-of-accounts` | Manage your account list (add/edit/delete accounts) |
| **Journal Entries** | `/accounting/journal-entries` | View all entries, create manual entries, post/void |
| **General Ledger** | `/accounting/general-ledger` | View transaction history for any single account |
| **Financial Reports** | `/accounting/reports` | Tabs: Profit & Loss, Balance Sheet, Trial Balance |

---

## How It Works

### 1. Chart of Accounts

Pre-seeded accounts are created automatically on first use. Each account has:

- **Code** — Unique number (e.g., `1000` = Cash)
- **Type** — ASSET, LIABILITY, EQUITY, REVENUE, or EXPENSE
- **Normal Balance** — DEBIT for Assets/Expenses, CREDIT for Liabilities/Equity/Revenue

**Default System Accounts (cannot be deleted):**

| Code | Name | Type |
|------|------|------|
| 1000 | Cash | Asset |
| 1010 | Bank | Asset |
| 1100 | Accounts Receivable | Asset |
| 1200 | Inventory | Asset |
| 2000 | Accounts Payable | Liability |
| 2100 | Tax Payable | Liability |
| 3000 | Owner's Equity | Equity |
| 3100 | Retained Earnings | Equity |
| 4000 | Sales Revenue | Revenue |
| 5000 | Cost of Goods Sold | Expense |
| 6000 | Salary Expense | Expense |
| 6100 | General Expense | Expense |
| 6200 | Refund Expense | Expense |

You can add more accounts (e.g., Rent, Utilities, Transport) as needed.

---

### 2. Journal Entries

Every financial event creates a journal entry with at least 2 lines (one debit, one credit).

**Statuses:**
- `DRAFT` — Saved but not yet affecting reports. Can be edited or deleted.
- `POSTED` — Finalized and included in all reports. Can only be voided.
- `VOIDED` — Cancelled entry (requires a reason). No longer affects reports.

**Auto-posted entries** (created automatically by the system):

| Event | Debit Account | Credit Account | Reference Type |
|-------|--------------|----------------|---------------|
| POS Sale (cash) | Cash (1000) + COGS (5000) | Revenue (4000) + Tax (2100) + Inventory (1200) | SALE |
| POS Sale (card) | Bank (1010) + COGS (5000) | Revenue (4000) + Tax (2100) + Inventory (1200) | SALE |
| Expense recorded | General Expense (6100) | Cash (1000) | EXPENSE |
| PO Payment made | Inventory (1200) | Cash (1000) | PURCHASE_ORDER |
| Refund issued | Refund Expense (6200) + Inventory (1200) | Cash/Bank + COGS (5000) | REFUND |

You do **not** need to create these manually — they are auto-generated when you:
- Complete a POS sale
- Record an expense
- Make a vendor payment on a purchase order
- Process a refund

**Manual entries** — Use for anything not automated: owner investment, loan repayment, depreciation, corrections, etc.

---

### 3. General Ledger

Select any account to see all its transactions in chronological order with running balance. Filter by date range. Shows:
- Opening balance → Each transaction → Closing balance

---

### 4. Financial Reports (tabbed page)

**Profit & Loss (Income Statement)**
- Revenue accounts minus COGS and other Expense accounts = Net Profit/Loss
- Executive summary cards highlight gross profit, operating profit, and net margin
- Filter by date range to see any period

**Accounting Sync**
- Accounting pages use a throttled sync from transactions, expenses, and purchase orders so reports stay responsive
- Use the `Sync Accounting` action on the Financial Reports page when you need an immediate refresh

**Balance Sheet**
- Assets = Liabilities + Equity (the accounting equation)
- Shows current balances as of any date
- If it says "✗ Out of balance", there may be a data issue to investigate

**Trial Balance**
- Lists every account with total debits and credits
- If balanced (✓), the books are correct
- Date-filterable

---

## Common Tasks

### Record a manual expense not captured by the expense tracker
1. Go to Journal Entries → New Entry
2. Description: "Office supplies purchase"
3. Line 1: Debit → General Expense (6100), amount
4. Line 2: Credit → Cash (1000), same amount
5. Save as Draft, then Post when ready

### Record owner investment
1. New Journal Entry
2. Line 1: Debit → Cash (1000) or Bank (1010), amount
3. Line 2: Credit → Owner's Equity (3000), same amount

### Record a loan payment
1. New Journal Entry
2. Line 1: Debit → Loan Payable (2300), principal amount
3. Line 2: Debit → General Expense (6100), interest amount (if any)
4. Line 3: Credit → Bank (1010), total payment

### Fix a wrong entry
1. **Void** the original posted entry (give reason)
2. Create a **new** corrected entry

---

## File Structure

```
lib/accounting.js                       — Auto-posting functions (postSaleEntry, postExpenseEntry, etc.)
models/Account.js                       — Chart of Accounts schema
models/JournalEntry.js                  — Journal Entry schema with lines
pages/api/accounting/accounts.js        — CRUD for accounts
pages/api/accounting/accounts/[id].js   — Single account operations
pages/api/accounting/journal-entries.js — CRUD for journal entries
pages/api/accounting/entries/[id].js    — Post/void/delete individual entries
pages/api/accounting/reports.js         — Report generation (trial-balance, profit-loss, balance-sheet)
pages/accounting/chart-of-accounts.js   — Chart of Accounts UI
pages/accounting/journal-entries.js     — Journal Entries UI
pages/accounting/general-ledger.js      — General Ledger UI
pages/accounting/reports.js             — Consolidated Financial Reports UI (3 tabs)
```
