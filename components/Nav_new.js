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
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useRef } from "react";
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

  // Handle navigation
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

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const closeMenu = () => {
    setOpenMenu(null);
    setOpenSubMenu(null);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Menu configuration
  const menuItems = [
    { href: "/", icon: faHome, label: "Home", submenu: null },
    {
      href: null,
      icon: faCog,
      label: "Setup",
      key: "setup",
      submenu: [
        { href: "/setup/setup", label: "Company Details" },
        { href: "/setup/Hero-Promo-setup", label: "Hero-Promo Setup" },
        { href: "/setup/receipts", label: "Receipts" },
        { href: "/setup/pos-tenders", label: "POS Tenders" },
        { href: "/setup/location-items", label: "Location Tenders" },
      ],
    },
    {
      href: null,
      icon: faList,
      label: "Manage",
      key: "manage",
      submenu: [
        { href: "/manage/products", label: "Product List" },
        { href: "/manage/archived", label: "Archived Products" },
        { href: "/manage/categories", label: "Categories" },
        { href: "/manage/promotions", label: "Promotions" },
        { href: "/manage/promotions-management", label: "Customer Promotions" },
        { href: "/manage/orders", label: "Orders" },
        { href: "/manage/staff", label: "Staff" },
        { href: "/manage/customers", label: "Customers" },
        { href: "/manage/customer-search", label: "Customer Search", indent: true },
        { href: "/manage/campaigns", label: "Campaigns", indent: true },
      ],
    },
    {
      href: null,
      icon: faBoxes,
      label: "Stock",
      key: "stock",
      submenu: [
        { href: "/stock/management", label: "Stock Management" },
        { href: "/stock/movement", label: "Stock Movement" },
        { href: "/stock/expiration-report", label: "Expiration Report" },
      ],
    },
    {
      href: null,
      icon: faChartLine,
      label: "Reporting",
      key: "reporting",
      submenu: [
        { href: "/reporting/reporting", label: "Sales Report" },
        { href: "/reporting/end-of-day-report", label: "End of Day Reports" },
      ],
    },
    {
      href: null,
      icon: faCoins,
      label: "Expenses",
      key: "expenses",
      submenu: [
        { href: "/expenses/expenses", label: "Expenses Entry" },
        { href: "/expenses/analysis", label: "Expenses Analysis" },
        { href: "/expenses/tax-analysis", label: "Tax Analysis" },
        { href: "/expenses/tax-personal", label: "Personal Tax Calculator" },
      ],
    },
    { href: "/till", icon: faCashRegister, label: "Till", submenu: null },
    { href: "/support", icon: faHeadset, label: "Support", submenu: null },
  ];

  // Check if menu should be open
  const isMenuActive = (key) => {
    if (!key) return false;
    if (key === "setup" && pathname.startsWith("/setup")) return true;
    if (key === "manage" && pathname.startsWith("/manage")) return true;
    if (key === "stock" && pathname.startsWith("/stock")) return true;
    if (key === "reporting" && pathname.startsWith("/reporting")) return true;
    if (key === "expenses" && pathname.startsWith("/expenses")) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-40 z-30 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-20 h-full flex-col bg-white border-r border-gray-200 shadow-sm">
        <nav className="flex-1 overflow-y-auto pt-2">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => (
              <li key={item.label} className="relative">
                {item.submenu ? (
                  <button
                    onClick={() => toggleMenu(item.key)}
                    className={`w-full flex flex-col items-center gap-1 px-3 py-4 rounded-lg transition-all duration-200 ${
                      isMenuActive(item.key)
                        ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                    }`}
                  >
                    <FontAwesomeIcon icon={item.icon} className="w-6 h-6" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex flex-col items-center gap-1 px-3 py-4 rounded-lg transition-all duration-200 ${
                      pathname === item.href
                        ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                    }`}
                  >
                    <FontAwesomeIcon icon={item.icon} className="w-6 h-6" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                )}

                {/* Desktop Submenu Panel */}
                {item.submenu && openMenu === item.key && (
                  <div className="absolute left-20 top-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-[calc(100vh-8rem)] overflow-y-auto">
                    <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-25 px-4 py-3 border-b border-gray-200">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        {item.label}
                      </p>
                    </div>
                    <ul className="divide-y divide-gray-100">
                      {item.submenu.map((subitem) => (
                        <li key={subitem.href}>
                          <Link
                            href={subitem.href}
                            onClick={closeMenu}
                            className={`block px-4 py-3 text-sm transition-all duration-200 ${
                              pathname === subitem.href
                                ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600"
                                : "text-gray-700 hover:bg-gray-50 hover:text-blue-600 border-l-4 border-transparent"
                            } ${subitem.indent ? "pl-8" : ""}`}
                          >
                            {subitem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <nav className="md:hidden fixed top-14 left-0 right-0 bottom-0 w-full bg-white shadow-2xl z-40 overflow-y-auto">
          {/* Mobile Menu Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 flex items-center justify-between border-b border-blue-800">
            <span className="font-bold text-lg">Navigation</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
              aria-label="Close menu"
            >
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Items */}
          <ul className="divide-y divide-gray-100 pb-20">
            {menuItems.map((item) => (
              <li key={item.label}>
                {item.submenu ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.key)}
                      className={`w-full flex items-center justify-between px-4 py-4 transition-all duration-200 ${
                        isMenuActive(item.key)
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className={`w-4 h-4 transition-transform duration-300 ${
                          openMenu === item.key ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    {/* Mobile Submenu */}
                    {openMenu === item.key && (
                      <ul className="bg-gray-50 border-l-4 border-blue-600 divide-y divide-gray-200">
                        {item.submenu.map((subitem) => (
                          <li key={subitem.href}>
                            <Link
                              href={subitem.href}
                              onClick={closeMenu}
                              className={`block px-4 py-3 text-sm transition-all duration-200 ${
                                pathname === subitem.href
                                  ? "bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-600"
                                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"
                              } ${subitem.indent ? "pl-8" : "pl-12"}`}
                            >
                              {subitem.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className={`flex items-center gap-3 px-4 py-4 transition-all duration-200 ${
                      pathname === item.href
                        ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-blue-600 border-l-4 border-transparent"
                    }`}
                  >
                    <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <Loader size="lg" fullScreen={false} text="Loading..." />
        </div>
      )}
    </>
  );
}
