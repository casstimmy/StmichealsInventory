import { mongooseConnect } from "@/lib/mongodb";
import JournalEntry from "@/models/JournalEntry";
import Account from "@/models/Account";
import { authMiddleware, isStaff } from "@/lib/auth-middleware";

export default async function handler(req, res) {
  const authError = authMiddleware(req, res);
  if (authError) return authError;
  if (!isStaff(req)) return res.status(403).json({ error: "Insufficient permissions" });

  await mongooseConnect();

  try {
    if (req.method === "GET") {
      const { status, referenceType, from, to, limit = 100, skip = 0 } = req.query;
      const filter = {};
      if (status) filter.status = status;
      if (referenceType) filter.referenceType = referenceType;
      if (from || to) {
        filter.date = {};
        if (from) filter.date.$gte = new Date(from);
        if (to) filter.date.$lte = new Date(to);
      }

      const [entries, total] = await Promise.all([
        JournalEntry.find(filter)
          .sort({ date: -1, createdAt: -1 })
          .skip(parseInt(skip))
          .limit(parseInt(limit))
          .lean(),
        JournalEntry.countDocuments(filter),
      ]);

      return res.status(200).json({ success: true, entries, total });
    }

    if (req.method === "POST") {
      const { date, description, lines, reference, referenceType, status, location } = req.body;

      if (!description || !lines || lines.length < 2) {
        return res.status(400).json({ success: false, message: "Description and at least 2 journal lines are required" });
      }

      // Validate accounts exist and resolve names
      const resolvedLines = [];
      for (const line of lines) {
        const account = await Account.findById(line.account).lean();
        if (!account) {
          return res.status(400).json({ success: false, message: `Account not found: ${line.account}` });
        }
        if (!account.isActive) {
          return res.status(400).json({ success: false, message: `Account "${account.name}" is inactive` });
        }
        resolvedLines.push({
          account: account._id,
          accountCode: account.code,
          accountName: account.name,
          debit: parseFloat(line.debit) || 0,
          credit: parseFloat(line.credit) || 0,
          description: line.description || "",
        });
      }

      // Validate debits = credits
      const totalDebit = Math.round(resolvedLines.reduce((s, l) => s + l.debit, 0) * 100) / 100;
      const totalCredit = Math.round(resolvedLines.reduce((s, l) => s + l.credit, 0) * 100) / 100;
      if (totalDebit !== totalCredit) {
        return res.status(400).json({
          success: false,
          message: `Debits (${totalDebit.toLocaleString()}) must equal Credits (${totalCredit.toLocaleString()})`,
        });
      }

      // Generate entry number
      const last = await JournalEntry.findOne({}, { entryNumber: 1 }).sort({ createdAt: -1 }).lean();
      const num = last ? (parseInt(last.entryNumber.replace("JE-", "")) || 0) + 1 : 1;
      const entryNumber = `JE-${String(num).padStart(4, "0")}`;

      const entryStatus = status || "DRAFT";
      const entry = await JournalEntry.create({
        entryNumber,
        date: date ? new Date(date) : new Date(),
        description,
        lines: resolvedLines,
        reference: reference || "",
        referenceType: referenceType || "MANUAL",
        status: entryStatus,
        location: location || "",
        postedAt: entryStatus === "POSTED" ? new Date() : undefined,
        createdBy: req.user?._id || req.user?.id,
        createdByName: req.user?.name || "",
      });

      return res.status(201).json({ success: true, entry });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Journal Entry API error:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
}
