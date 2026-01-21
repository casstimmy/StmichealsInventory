import Layout from "@/components/Layout";
import Link from "next/link";

export default function TransactionReportHub() {
  const reports = [
    {
      id: "held-transactions",
      title: "Held Transactions",
      description: "View all transactions placed on hold pending completion or cancellation.",
      icon: "⏸",
      color: "from-amber-500 to-orange-500",
      href: "/reporting/transaction-report/held-transactions",
    },
    {
      id: "completed-transactions",
      title: "Completed Transactions",
      description: "Review completed transactions with detailed filtering by location, status, and date.",
      icon: "✓",
      color: "from-emerald-500 to-green-500",
      href: "/reporting/transaction-report/completed-transactions",
    },
  ];

  return (
    <Layout title="Transaction Reports">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 p-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-gray-600">
          <Link href="/" className="text-cyan-600 hover:text-cyan-700">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/reporting" className="text-cyan-600 hover:text-cyan-700">Reporting</Link>
          <span className="mx-2">›</span>
          <span className="text-gray-800 font-medium">Transaction Reports</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Transaction Reports</h1>
          <p className="text-gray-600 max-w-2xl">
            Comprehensive transaction analysis and reporting tools. Monitor held transactions, analyze completed sales, and track transaction metrics.
          </p>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reports.map((report) => (
            <Link key={report.id} href={report.href}>
              <div className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 cursor-pointer transform hover:scale-105">
                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${report.color} text-white p-8 h-24 flex items-center justify-center`}>
                  <span className="text-5xl">{report.icon}</span>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">{report.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">{report.description}</p>

                  {/* Action Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-600 font-semibold text-sm">View Report</span>
                    <span className="text-lg">→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats Section */}
        <div className="mt-16 bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              label="Held Transactions"
              value="Monitor"
              icon="📋"
              description="View transactions awaiting completion"
            />
            <StatCard
              label="Completed Sales"
              value="Analyze"
              icon="✅"
              description="Detailed breakdown of completed transactions"
            />
            <StatCard
              label="Transaction History"
              value="Track"
              icon="📊"
              description="Full audit trail with filtering options"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, icon, description }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-cyan-600 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

