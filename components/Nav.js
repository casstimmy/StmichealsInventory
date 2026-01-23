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
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Toggle menus
  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const toggleSubMenu = (submenu) => {
    setOpenSubMenu(openSubMenu === submenu ? null : submenu);
  };

  const closeMenu = () => {
    setOpenMenu(null);
    setOpenSubMenu(null);
    if (isMobile) setIsMobileMenuOpen(false);
  };

  const closeMenuOnNavigation = () => {
    setOpenMenu(null);
    setOpenSubMenu(null);
    if (isMobile) setIsMobileMenuOpen(false);
  };

  // Auto-open menu for desktop
  useEffect(() => {
    if (isMobile) return;
    if (pathname.startsWith("/setup")) setOpenMenu("setup");
    else if (pathname.startsWith("/manage")) setOpenMenu("manage");
    else if (pathname.startsWith("/stock")) setOpenMenu("stock");
    else if (pathname.startsWith("/reporting")) {
      setOpenMenu("reporting");
      if (pathname.startsWith("/reporting/sales-report"))
        setOpenSubMenu("sales-report");
    } else if (pathname.startsWith("/expenses")) setOpenMenu("expenses");
    else if (pathname === "/till") setOpenMenu("till");
    else if (pathname.startsWith("/support")) setOpenMenu("support");
  }, [pathname, isMobile]);

  // Router events for loading overlay
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

  // CSS classes
  const baseLink =
    "px-2 py-4 text-gray-600 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center flex-col text-xs cursor-pointer border-l-4 border-transparent hidden md:flex";
  const activeLink =
    "px-2 py-4 text-white bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center flex-col text-xs cursor-pointer font-semibold border-l-4 border-blue-900 transition-all duration-300 hidden md:flex shadow-md";
  const mobileBaseLink =
    "px-3 py-3 text-gray-700 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent flex items-center gap-3 text-sm";
  const mobileActiveLink =
    "px-3 py-3 text-white bg-gradient-to-r from-blue-600 to-blue-700 border-l-4 border-blue-900 flex items-center gap-3 text-sm font-semibold";

  // Render functions
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
          className="border-b border-gray-100 last:border-b-0 transition-all duration-300 group"
          onClick={closeMenuOnNavigation}
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
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    isActive
                      ? "bg-blue-600 scale-125"
                      : "bg-gray-300 group-hover:bg-blue-400"
                  }`}
                ></span>
              )}
              {label}
            </span>
            {isActive && <span className="text-blue-600 text-lg">›</span>}
          </Link>
        </li>
      );
    });

  return (
    <>
      {/* MOBILE MENU BUTTON */}
      {isMobile && !isMobileMenuOpen && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 z-40"
        >
          <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
        </button>
      )}

      {/* MOBILE BACKDROP */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="fixed top-12 md:top-16 left-0 w-20 h-screen bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 z-10 shadow-lg hidden md:block overflow-visible">
        <nav className="mt-6 h-full overflow-visible">
          <ul className="space-y-1">
            {renderMenuItem("/", faHome, "Home")}

            {/* Setup */}
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
              {openMenu === "setup" && (
                <ul className="absolute top-0 left-20 w-56 bg-white border-r border-gray-200 shadow-2xl">
                  {renderSubMenu([
                    { href: "/setup/setup", label: "Company Details" },
                    {
                      href: "/setup/Hero-Promo-setup",
                      label: "Hero-Promo Setup",
                    },
                    { href: "/setup/receipts", label: "Receipts" },
                    { href: "/setup/pos-tenders", label: "POS Tenders" },
                    {
                      href: "/setup/location-items",
                      label: "Location Tenders",
                    },
                  ])}
                </ul>
              )}
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
              {openMenu === "manage" && (
                <ul className="absolute top-0 left-20 w-56 bg-white border-r border-gray-200 shadow-2xl">
                  {renderSubMenu([
                    { href: "/manage/products", label: "Product List" },
                    { href: "/manage/archived", label: "Archived Products" },
                    { href: "/manage/categories", label: "Categories" },
                    { href: "/manage/promotions", label: "Promotions" },
                    {
                      href: "/manage/promotions-management",
                      label: "Customer Promotions",
                    },
                    { href: "/manage/orders", label: "Orders" },
                    { href: "/manage/staff", label: "Staff" },
                    { href: "/manage/customers", label: "Customers" },
                    {
                      href: "/manage/customer-search",
                      label: "Customer Search",
                      indent: true,
                    },
                    {
                      href: "/manage/campaigns",
                      label: "Campaigns",
                      indent: true,
                    },
                  ])}
                </ul>
              )}
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
              {openMenu === "stock" && (
                <ul className="absolute top-0 left-20 w-56 bg-white border-r border-gray-200 shadow-2xl">
                  {renderSubMenu([
                    { href: "/stock/management", label: "Stock Management" },
                    { href: "/stock/movement", label: "Stock Movement" },
                    {
                      href: "/stock/expiration-report",
                      label: "Expiration Report",
                    },
                  ])}
                </ul>
              )}
            </li>

            {/* Reporting */}
            <li
              className={`${pathname.startsWith("/reporting") ? activeLink : baseLink} relative`}
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
              {openMenu === "reporting" && (
                <ul className="absolute top-0 left-20 w-56 bg-white border-r border-gray-200 shadow-2xl">
                  {renderSubMenu([
                    { href: "/reporting/reporting", label: "Sales Report" },
                    {
                      href: "/reporting/end-of-day-report",
                      label: "End of Day Reports",
                    },
                  ])}

                  {/* Sales Report Multi-Level */}
                  <li>
                    <button
                      onClick={() => toggleSubMenu("sales-report")}
                      className="w-full px-4 py-3 flex justify-between items-center text-sm text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
                    >
                      Sales Report
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className={`transition-transform ${openSubMenu === "sales-report" ? "rotate-90" : ""}`}
                      />
                    </button>
                    {openSubMenu === "sales-report" && (
                      <ul className="pl-8">
                        {renderSubMenu([
                          {
                            href: "/reporting/sales-report/time-intervals",
                            label: "Time Intervals",
                            indent: true,
                          },
                          {
                            href: "/reporting/sales-report/time-comparisons",
                            label: "Time Comparisons",
                            indent: true,
                          },
                          {
                            href: "/reporting/sales-report/products",
                            label: "Sales by Product",
                            indent: true,
                          },
                          {
                            href: "/reporting/sales-report/employees",
                            label: "Employees",
                            indent: true,
                          },
                          {
                            href: "/reporting/sales-report/locations",
                            label: "Locations",
                            indent: true,
                          },
                          {
                            href: "/reporting/sales-report/categories",
                            label: "Categories",
                            indent: true,
                          },
                        ])}
                      </ul>
                    )}
                  </li>
                  {renderSubMenu([
                    {
                      href: "/reporting/transaction-report/held-transactions",
                      label: "Held Transactions",
                      indent: true,
                    },
                    {
                      href: "/reporting/transaction-report/completed-transactions",
                      label: "Completed Transactions",
                      indent: true,
                    },
                  ])}
                </ul>
              )}
            </li>

            {/* Expenses */}
            <li
              className={`${pathname.startsWith("/expenses") ? activeLink : baseLink} relative`}
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
              {openMenu === "expenses" && (
                <ul className="absolute top-0 left-20 w-56 bg-white border-r border-gray-200 shadow-2xl">
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
              )}
            </li>

            {renderMenuItem("/till", faCashRegister, "Till")}
            {renderMenuItem("/support", faHeadset, "Support")}
          </ul>
        </nav>
      </aside>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <Loader size="lg" fullScreen={false} text="Please wait..." />
        </div>
      )}
    </>
  );
}
