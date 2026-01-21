import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faCog,
  faList,
  faBoxes,
  faChartLine,
  faCashRegister,
  faHeadset,
  faChevronRight,
  faCoins,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Loader from "@/components/Loader";

export default function Sidebar() {
  const [openMenu, setOpenMenu] = useState(null);
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { pathname } = router;

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const toggleSubMenu = (submenu) => {
    setOpenSubMenu(openSubMenu === submenu ? null : submenu);
  };

  const closeMenu = () => setOpenMenu(null);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleStop = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);

  const baseLink =
    "px-2 py-4 text-gray-600 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center flex-col text-xs cursor-pointer border-l-4 border-transparent";
  const activeLink = `px-2 py-4 text-white bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center flex-col text-xs cursor-pointer font-semibold border-l-4 border-blue-900 transition-all duration-300`;

  const renderMenuItem = (href, icon, label) => (
    <li key={href} className={pathname === href ? activeLink : baseLink}>
      <Link href={href} onClick={closeMenu}>
        <div className="flex flex-col items-center justify-center">
          <FontAwesomeIcon icon={icon} className="w-6 h-6" />
          <span className="text-xs">{label}</span>
        </div>
      </Link>
    </li>
  );

  const renderSubMenu = (items) =>
    items.map(({ href, label, indent }, index) => {
      const isActive = pathname === href;
      return (
        <li
          key={href}
          className={`border-b border-gray-100 last:border-b-0 transition-all duration-300 group`}
          onClick={closeMenu}
        >
          <Link 
            href={href} 
            className={`w-full h-14 flex items-center justify-between text-sm font-medium transition-all duration-300 ${
              indent ? "px-8 py-3" : "px-4 py-3"
            } ${
              isActive
                ? "bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-blue-600 text-blue-600 shadow-sm"
                : "text-gray-700 hover:bg-gray-50 hover:text-blue-600 border-l-4 border-transparent"
            }`}
          >
            <span className="flex items-center gap-3">
              {!indent && (
                <span className={`w-1.5 h-1.5 rounded-full transition-all ${
                  isActive ? "bg-blue-600 scale-125" : "bg-gray-300 group-hover:bg-blue-400"
                }`}></span>
              )}
              {label}
            </span>
            {isActive && (
              <span className="text-blue-600 text-lg">›</span>
            )}
          </Link>
        </li>
      );
    });

  return (
    <>
      <aside className="fixed top-12 left-0 w-20 h-screen bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 z-10 shadow-lg">
        <nav className="mt-6">
          <ul className="space-y-1">
            {renderMenuItem("/", faHome, "Home")}
            {/* Setup Menu with Submenu */}
            <li
              className={pathname.startsWith("/setup") ? activeLink : baseLink}
            >
              <div
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => toggleMenu("setup")}
              >
                <FontAwesomeIcon icon={faCog} className="w-6 h-6" />
                <span className="text-xs">Setup</span>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className={`w-3 h-3 mt-1 transition-transform duration-300 ${
                    openMenu === "setup" ? "rotate-90" : ""
                  }`}
                />
              </div>
              <ul
                className={`absolute left-full pt-12 top-0 w-56 bg-white border-r border-gray-200 h-screen shadow-2xl transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "setup"
                    ? "translate-x-0 opacity-100 text-gray-700"
                    : "translate-x-56 opacity-0 pointer-events-none"
                }`}
              >
                <div className="px-4 py-3 border-b border-gray-200 sticky top-0 bg-white">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Setup</p>
                </div>
                {renderSubMenu([
                  { href: "/setup/setup", label: "Company Details" },
                  { href: "/setup/Hero-Promo-setup", label: "Hero-Promo Setup " },
                  { href: "/setup/receipts", label: "Receipts" },
                  { href: "/setup/pos-tenders", label: "POS Tenders" },
                  { href: "/setup/location-items", label: "Location Tenders" },
                ])}
              </ul>
            </li>

            {/* Manage */}
            <li
              className={pathname.startsWith("/manage") ? activeLink : baseLink}
            >
              <div
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => toggleMenu("manage")}
              >
                <FontAwesomeIcon icon={faList} className="w-6 h-6" />
                <span className="text-xs">Manage</span>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className={`w-3 h-3 mt-1 transition-transform duration-300 ${
                    openMenu === "manage" ? "rotate-90" : ""
                  }`}
                />
              </div>
              <ul
                className={`absolute left-full pt-12 top-0 w-56 bg-white border-r border-gray-200 h-screen shadow-2xl transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "manage"
                    ? "translate-x-0 opacity-100 text-gray-700"
                    : "translate-x-56 opacity-0 pointer-events-none"
                }`}
              >
                <div className="px-4 py-3 border-b border-gray-200 sticky top-0 bg-white">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Manage</p>
                </div>
                {renderSubMenu([
                  { href: "/manage/products", label: "Product List" },
                  { href: "/manage/archived", label: "Archived Products" },
                  { href: "/manage/categories", label: "Categories" },
                  { href: "/manage/promotions", label: "Promotions" },
                  { href: "/manage/promotions-management", label: "🎯 Customer Promotions", indent: false },
                  { href: "/manage/orders", label: "Orders" },
                  { href: "/manage/staff", label: "Staff" },
                  { href: "/manage/customers", label: "🧑 Customers", indent: false },
                  { href: "/manage/customer-search", label: "Customer Search", indent: true },
                  { href: "/manage/campaigns", label: "Campaigns", indent: true },
                ])}
              </ul>
            </li>

            {/* Stock */}
            <li
              className={pathname.startsWith("/stock") ? activeLink : baseLink}
            >
              <div
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => toggleMenu("stock")}
              >
                <FontAwesomeIcon icon={faBoxes} className="w-6 h-6" />
                <span className="text-xs">Stock</span>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className={`w-3 h-3 mt-1 transition-transform duration-300 ${
                    openMenu === "stock" ? "rotate-90" : ""
                  }`}
                />
              </div>
              <ul
                className={`absolute left-full pt-12 top-0 w-56 bg-white border-r border-gray-200 h-screen shadow-2xl transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "stock"
                    ? "translate-x-0 opacity-100 text-gray-700"
                    : "translate-x-56 opacity-0 pointer-events-none"
                }`}
              >
                <div className="px-4 py-3 border-b border-gray-200 sticky top-0 bg-white">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</p>
                </div>
                {renderSubMenu([
                  { href: "/stock/management", label: "Stock Management" },
                  { href: "/stock/movement", label: "Stock Movement" },
                  { href: "/stock/expiration-report", label: "Expiration Report" },
                ])}
              </ul>
            </li>

            <li
              className={
                pathname.startsWith("/reporting") ? activeLink : baseLink
              }
            >
              <div
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => toggleMenu("reporting")}
              >
                <FontAwesomeIcon icon={faChartLine} className="w-6 h-6" />
                <span className="text-xs">Reporting</span>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className={`w-3 h-3 mt-1 transition-transform duration-300 ${
                    openMenu === "reporting" ? "rotate-90" : ""
                  }`}
                />
              </div>
              <ul
                className={`absolute left-full pt-12 top-0 w-56 bg-white border-r border-gray-200 h-screen shadow-2xl transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "reporting"
                    ? "translate-x-0 opacity-100 text-gray-700"
                    : "translate-x-56 opacity-0 pointer-events-none"
                }`}
              >
                <div className="px-4 py-3 border-b border-gray-200 sticky top-0 bg-white">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reporting</p>
                </div>
                {renderSubMenu([
                  { href: "/reporting/reporting", label: "Sales Report" },
                  { href: "/reporting/end-of-day-report", label: "End of Day Reports" },
                ])}
                
                {/* Sales Report Dropdown */}
                <li className="border-b border-gray-100 transition-all duration-300 group">
                  <button
                    onClick={() => toggleSubMenu("sales-report")}
                    className="w-full h-14 px-4 py-3 flex items-center justify-between text-sm font-medium transition-all duration-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 border-l-4 border-transparent"
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-blue-400 transition-all"></span>
                      Sales Report
                    </span>
                    <span className={`text-lg transition-transform duration-300 ${openSubMenu === "sales-report" ? "rotate-90" : ""}`}>›</span>
                  </button>
                  {openSubMenu === "sales-report" && (
                    <div className="bg-gray-50 border-t border-gray-100">
                      {renderSubMenu([
                        { href: "/reporting/sales-report/time-intervals", label: "Time Intervals", indent: true },
                        { href: "/reporting/sales-report/time-comparisons", label: "Time Comparisons", indent: true },
                        { href: "/reporting/sales-report/products", label: "Sales by Product", indent: true },
                        { href: "/reporting/sales-report/employees", label: "Employees", indent: true },
                        { href: "/reporting/sales-report/locations", label: "Locations", indent: true },
                        { href: "/reporting/sales-report/categories", label: "Categories", indent: true },
                      ])}
                    </div>
                  )}
                </li>

                {/* Transaction Report */}
                {renderSubMenu([
                  { href: "/reporting/transaction-report/held-transactions", label: "Held Transactions", indent: true },
                  { href: "/reporting/transaction-report/completed-transactions", label: "Completed Transactions", indent: true },
                ])}
              </ul>
            </li>
            <li
              className={
                pathname.startsWith("/expenses") ? activeLink : baseLink
              }
            >
              <div
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => toggleMenu("expenses")}
              >
                <FontAwesomeIcon icon={faCoins} className="w-6 h-6" />
                <span className="text-xs">Expenses</span>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className={`w-3 h-3 mt-1 transition-transform duration-300 ${
                    openMenu === "expenses" ? "rotate-90" : ""
                  }`}
                />
              </div>
              <ul
                className={`absolute left-full pt-12 top-0 w-56 bg-white border-r border-gray-200 h-screen shadow-2xl transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "expenses"
                    ? "translate-x-0 opacity-100 text-gray-700"
                    : "translate-x-56 opacity-0 pointer-events-none"
                }`}
              >
                <div className="px-4 py-3 border-b border-gray-200 sticky top-0 bg-white">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Expenses</p>
                </div>
                {renderSubMenu([
                  { href: "/expenses/expenses", label: "Expenses Entry" },
                  { href: "/expenses/analysis", label: "Expenses Analysis" },
                  { href: "/expenses/tax-analysis", label: "Tax Analysis" },
                  {
                    href: "/expenses/tax-personal",
                    label: "Personal Tax Calculator",
                  },
                ])}
              </ul>
            </li>
            {renderMenuItem("/till", faCashRegister, "Till")}
            {renderMenuItem("/support", faHeadset, "Support")}
          </ul>
        </nav>
      </aside>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <Loader size="lg" fullScreen={false} text="Please wait..." />
        </div>
      )}
    </>
  );
}
