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
  faBars,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Loader from "@/components/Loader";

export default function Sidebar() {
  const [openMenu, setOpenMenu] = useState(null);
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const { pathname } = router;

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const toggleSubMenu = (submenu) => {
    setOpenSubMenu(openSubMenu === submenu ? null : submenu);
  };

  const closeMenu = () => {
    setOpenMenu(null);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Auto-open menu based on active pathname
  useEffect(() => {
    if (pathname.startsWith("/setup")) {
      setOpenMenu("setup");
      setOpenSubMenu(null);
    } else if (pathname.startsWith("/manage")) {
      setOpenMenu("manage");
      setOpenSubMenu(null);
    } else if (pathname.startsWith("/stock")) {
      setOpenMenu("stock");
      setOpenSubMenu(null);
    } else if (pathname.startsWith("/reporting")) {
      setOpenMenu("reporting");
      // Auto-open sub-menus based on specific reporting paths
      if (pathname.startsWith("/reporting/sales-report")) {
        setOpenSubMenu("sales-report");
      } else {
        setOpenSubMenu(null);
      }
    } else if (pathname.startsWith("/expenses")) {
      setOpenMenu("expenses");
      setOpenSubMenu(null);
    } else if (pathname === "/till") {
      setOpenMenu("till");
      setOpenSubMenu(null);
    } else if (pathname.startsWith("/support")) {
      setOpenMenu("support");
      setOpenSubMenu(null);
    }
  }, [pathname]);

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
    "px-2 py-4 text-gray-600 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center flex-col text-xs cursor-pointer border-l-4 border-transparent hidden md:flex";
  const activeLink = `px-2 py-4 text-white bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center flex-col text-xs cursor-pointer font-semibold border-l-4 border-blue-900 transition-all duration-300 hidden md:flex shadow-md`;

  const mobileBaseLink = "px-3 py-3 text-gray-700 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent flex items-center gap-3 text-sm";
  const mobileActiveLink = "px-3 py-3 text-white bg-gradient-to-r from-blue-600 to-blue-700 border-l-4 border-blue-900 flex items-center gap-3 text-sm font-semibold";

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
      {/* MOBILE MENU BUTTON - Floating Circle at Bottom */}
      {isMobile && !isMobileMenuOpen && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 z-40"
          aria-label="Open menu"
        >
          <div className="flex flex-col items-center justify-center gap-1">
            <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
            <span className="text-xs font-semibold">Menu</span>
          </div>
        </button>
      )}

      {/* MOBILE BACKDROP */}
      {isMobileMenuOpen && isMobile && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="fixed top-12 left-0 w-20 h-screen bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 z-10 shadow-lg hidden md:block overflow-hidden">
        <nav className="mt-6 h-full overflow-hidden">
          <ul className="space-y-1">
            {renderMenuItem("/", faHome, "Home")}
            {/* Setup Menu with Submenu */}
            <li
              className={`${pathname.startsWith("/setup") ? activeLink : baseLink} relative`}
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
                className={`absolute left-full pt-12 top-0 w-56 bg-white border-r border-gray-200 max-h-[calc(100vh-3rem)] overflow-y-auto shadow-2xl transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "setup"
                    ? "translate-x-0 opacity-100 text-gray-700"
                    : "translate-x-56 opacity-0 pointer-events-none"
                }`}
                onClick={(e) => e.stopPropagation()}
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
              className={`${pathname.startsWith("/manage") ? activeLink : baseLink} relative`}
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
                className={`absolute left-full pt-12 top-0 w-56 bg-white border-r border-gray-200 max-h-[calc(100vh-3rem)] overflow-y-auto shadow-2xl transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "manage"
                    ? "translate-x-0 opacity-100 text-gray-700"
                    : "translate-x-56 opacity-0 pointer-events-none"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-3 border-b border-gray-200 sticky top-0 bg-white">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Manage</p>
                </div>
                {renderSubMenu([
                  { href: "/manage/products", label: "Product List" },
                  { href: "/manage/archived", label: "Archived Products" },
                  { href: "/manage/categories", label: "Categories" },
                  { href: "/manage/promotions", label: "Promotions" },
                  { href: "/manage/promotions-management", label: "Customer Promotions", indent: false },
                  { href: "/manage/orders", label: "Orders" },
                  { href: "/manage/staff", label: "Staff" },
                  { href: "/manage/customers", label: "Customers", indent: false },
                  { href: "/manage/customer-search", label: "Customer Search", indent: true },
                  { href: "/manage/campaigns", label: "Campaigns", indent: true },
                ])}
              </ul>
            </li>

            {/* Stock */}
            <li
              className={`${pathname.startsWith("/stock") ? activeLink : baseLink} relative`}
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
                className={`absolute left-full pt-12 top-0 w-56 bg-white border-r border-gray-200 max-h-[calc(100vh-3rem)] overflow-y-auto shadow-2xl transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "stock"
                    ? "translate-x-0 opacity-100 text-gray-700"
                    : "translate-x-56 opacity-0 pointer-events-none"
                }`}
                onClick={(e) => e.stopPropagation()}
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
              className={`${
                pathname.startsWith("/reporting") ? activeLink : baseLink
              } relative`}
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
                className={`absolute left-full pt-12 top-0 w-56 bg-white border-r border-gray-200 max-h-[calc(100vh-3rem)] overflow-y-auto shadow-2xl transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "reporting"
                    ? "translate-x-0 opacity-100 text-gray-700"
                    : "translate-x-56 opacity-0 pointer-events-none"
                }`}
                onClick={(e) => e.stopPropagation()}
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
              className={`${
                pathname.startsWith("/expenses") ? activeLink : baseLink
              } relative`}
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
                className={`absolute left-full pt-12 top-0 w-56 bg-white border-r border-gray-200 max-h-[calc(100vh-3rem)] overflow-y-auto shadow-2xl transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "expenses"
                    ? "translate-x-0 opacity-100 text-gray-700"
                    : "translate-x-56 opacity-0 pointer-events-none"
                }`}
                onClick={(e) => e.stopPropagation()}
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

      {/* MOBILE SIDEBAR - FULL SCREEN */}
      {isMobileMenuOpen && isMobile && (
        <nav className="fixed top-0 left-0 right-0 bottom-0 w-full bg-white shadow-2xl z-40 overflow-y-auto">
          {/* Mobile Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 flex items-center justify-between border-b border-blue-800">
            <span className="text-lg font-bold">Menu</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-white text-2xl transition-all"
              aria-label="Close menu"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <ul className="space-y-0 pb-20">
            {/* Home */}
            <li onClick={closeMenu}>
              <Link href="/" className={`block ${pathname === "/" ? mobileActiveLink : mobileBaseLink}`}>
                <FontAwesomeIcon icon={faHome} className="w-5 h-5" />
                <span>Home</span>
              </Link>
            </li>

            {/* Setup Menu */}
            <li>
              <button
                onClick={() => toggleMenu("setup")}
                className={`w-full ${pathname.startsWith("/setup") ? mobileActiveLink : mobileBaseLink} justify-between`}
              >
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faCog} className="w-5 h-5" />
                  <span>Setup</span>
                </div>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className={`w-4 h-4 transition-transform duration-300 ${openMenu === "setup" ? "rotate-90" : ""}`}
                />
              </button>
              {openMenu === "setup" && (
                <ul className="bg-gray-50 border-l-4 border-blue-600">
                  <li onClick={closeMenu}>
                    <Link href="/setup/setup" className={`block px-8 py-3 text-sm transition-all ${pathname === "/setup/setup" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Company Details
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/setup/Hero-Promo-setup" className={`block px-8 py-3 text-sm transition-all ${pathname === "/setup/Hero-Promo-setup" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Hero-Promo Setup
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/setup/receipts" className={`block px-8 py-3 text-sm transition-all ${pathname === "/setup/receipts" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Receipts
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/setup/pos-tenders" className={`block px-8 py-3 text-sm transition-all ${pathname === "/setup/pos-tenders" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      POS Tenders
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/setup/location-items" className={`block px-8 py-3 text-sm transition-all ${pathname === "/setup/location-items" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Location Tenders
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Manage Menu */}
            <li>
              <button
                onClick={() => toggleMenu("manage")}
                className={`w-full ${pathname.startsWith("/manage") ? mobileActiveLink : mobileBaseLink} justify-between`}
              >
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faList} className="w-5 h-5" />
                  <span>Manage</span>
                </div>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className={`w-4 h-4 transition-transform duration-300 ${openMenu === "manage" ? "rotate-90" : ""}`}
                />
              </button>
              {openMenu === "manage" && (
                <ul className="bg-gray-50 border-l-4 border-blue-600">
                  <li onClick={closeMenu}>
                    <Link href="/manage/products" className={`block px-8 py-3 text-sm transition-all ${pathname === "/manage/products" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Product List
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/manage/archived" className={`block px-8 py-3 text-sm transition-all ${pathname === "/manage/archived" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Archived Products
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/manage/categories" className={`block px-8 py-3 text-sm transition-all ${pathname === "/manage/categories" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Categories
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/manage/promotions" className={`block px-8 py-3 text-sm transition-all ${pathname === "/manage/promotions" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Promotions
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/manage/promotions-management" className={`block px-8 py-3 text-sm transition-all ${pathname === "/manage/promotions-management" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Customer Promotions
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/manage/orders" className={`block px-8 py-3 text-sm transition-all ${pathname === "/manage/orders" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Orders
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/manage/staff" className={`block px-8 py-3 text-sm transition-all ${pathname === "/manage/staff" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Staff
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/manage/customers" className={`block px-8 py-3 text-sm transition-all ${pathname === "/manage/customers" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Customers
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/manage/customer-search" className={`block px-12 py-3 text-sm transition-all ${pathname === "/manage/customer-search" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Customer Search
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/manage/campaigns" className={`block px-12 py-3 text-sm transition-all ${pathname === "/manage/campaigns" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Campaigns
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Stock Menu */}
            <li>
              <button
                onClick={() => toggleMenu("stock")}
                className={`w-full ${pathname.startsWith("/stock") ? mobileActiveLink : mobileBaseLink} justify-between`}
              >
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faBoxes} className="w-5 h-5" />
                  <span>Stock</span>
                </div>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className={`w-4 h-4 transition-transform duration-300 ${openMenu === "stock" ? "rotate-90" : ""}`}
                />
              </button>
              {openMenu === "stock" && (
                <ul className="bg-gray-50 border-l-4 border-blue-600">
                  <li onClick={closeMenu}>
                    <Link href="/stock/management" className={`block px-8 py-3 text-sm transition-all ${pathname === "/stock/management" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Stock Management
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/stock/movement" className={`block px-8 py-3 text-sm transition-all ${pathname === "/stock/movement" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Stock Movement
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/stock/expiration-report" className={`block px-8 py-3 text-sm transition-all ${pathname === "/stock/expiration-report" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Expiration Report
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Reporting Menu */}
            <li>
              <button
                onClick={() => toggleMenu("reporting")}
                className={`w-full ${pathname.startsWith("/reporting") ? mobileActiveLink : mobileBaseLink} justify-between`}
              >
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faChartLine} className="w-5 h-5" />
                  <span>Reporting</span>
                </div>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className={`w-4 h-4 transition-transform duration-300 ${openMenu === "reporting" ? "rotate-90" : ""}`}
                />
              </button>
              {openMenu === "reporting" && (
                <ul className="bg-gray-50 border-l-4 border-blue-600">
                  <li onClick={closeMenu}>
                    <Link href="/reporting/reporting" className={`block px-8 py-3 text-sm transition-all ${pathname === "/reporting/reporting" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Sales Report
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/reporting/end-of-day-report" className={`block px-8 py-3 text-sm transition-all ${pathname === "/reporting/end-of-day-report" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      End of Day Reports
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Expenses Menu */}
            <li>
              <button
                onClick={() => toggleMenu("expenses")}
                className={`w-full ${pathname.startsWith("/expenses") ? mobileActiveLink : mobileBaseLink} justify-between`}
              >
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faCoins} className="w-5 h-5" />
                  <span>Expenses</span>
                </div>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className={`w-4 h-4 transition-transform duration-300 ${openMenu === "expenses" ? "rotate-90" : ""}`}
                />
              </button>
              {openMenu === "expenses" && (
                <ul className="bg-gray-50 border-l-4 border-blue-600">
                  <li onClick={closeMenu}>
                    <Link href="/expenses/expenses" className={`block px-8 py-3 text-sm transition-all ${pathname === "/expenses/expenses" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Expenses Entry
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/expenses/analysis" className={`block px-8 py-3 text-sm transition-all ${pathname === "/expenses/analysis" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Expenses Analysis
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/expenses/tax-analysis" className={`block px-8 py-3 text-sm transition-all ${pathname === "/expenses/tax-analysis" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Tax Analysis
                    </Link>
                  </li>
                  <li onClick={closeMenu}>
                    <Link href="/expenses/tax-personal" className={`block px-8 py-3 text-sm transition-all ${pathname === "/expenses/tax-personal" ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"}`}>
                      Personal Tax Calculator
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Till */}
            <li onClick={closeMenu}>
              <Link href="/till" className={`block ${pathname === "/till" ? mobileActiveLink : mobileBaseLink}`}>
                <FontAwesomeIcon icon={faCashRegister} className="w-5 h-5" />
                <span>Till</span>
              </Link>
            </li>

            {/* Support */}
            <li onClick={closeMenu}>
              <Link href="/support" className={`block ${pathname === "/support" ? mobileActiveLink : mobileBaseLink}`}>
                <FontAwesomeIcon icon={faHeadset} className="w-5 h-5" />
                <span>Support</span>
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}