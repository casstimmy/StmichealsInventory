import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faCog,
  faList,
  faBoxes,
  faChartLine,
  faCashRegister,
  faHeadset,
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

  const closeMenuOnNavigation = () => {
    setOpenMenu(null);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Auto-close menu on route change
  useEffect(() => {
    closeMenuOnNavigation();
  }, [pathname]);

  // Auto-open menu based on active pathname (desktop only)
  useEffect(() => {
    if (isMobile) return;
    
    if (pathname.startsWith("/setup")) {
      setOpenMenu("setup");
    } else if (pathname.startsWith("/manage")) {
      setOpenMenu("manage");
    } else if (pathname.startsWith("/stock")) {
      setOpenMenu("stock");
    } else if (pathname.startsWith("/reporting")) {
      setOpenMenu("reporting");
    } else if (pathname.startsWith("/expenses")) {
      setOpenMenu("expenses");
    }
  }, [pathname, isMobile]);

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

  const baseLink = "px-2 py-4 text-gray-600 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center flex-col text-xs cursor-pointer border-l-4 border-transparent hidden md:flex";
  const activeLink = "px-2 py-4 text-white bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center flex-col text-xs cursor-pointer font-semibold border-l-4 border-blue-900 transition-all duration-300 hidden md:flex shadow-md";

  const mobileBaseLink = "px-3 py-3 text-gray-700 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent flex items-center gap-3 text-sm";
  const mobileActiveLink = "px-3 py-3 text-white bg-gradient-to-r from-blue-600 to-blue-700 border-l-4 border-blue-900 flex items-center gap-3 text-sm font-semibold";

  const renderDesktopMenuItem = (href, icon, label, isActive) => (
    <li key={href} className={isActive ? activeLink : baseLink}>
      <Link href={href} onClick={closeMenuOnNavigation}>
        <div className="flex flex-col items-center justify-center">
          <FontAwesomeIcon icon={icon} className="w-6 h-6" />
          <span className="text-xs mt-1">{label}</span>
        </div>
      </Link>
    </li>
  );

  const renderSubMenuItem = (href, label, indent = false) => {
    const isActive = pathname === href;
    return (
      <li key={href} className="border-b border-gray-100 last:border-b-0 transition-all duration-300">
        <Link
          href={href}
          onClick={closeMenuOnNavigation}
          className={`w-full h-14 flex items-center text-sm font-medium transition-all duration-300 ${
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
                isActive ? "bg-blue-600 scale-125" : "bg-gray-300"
              }`}></span>
            )}
            {label}
          </span>
        </Link>
      </li>
    );
  };

  // Desktop menu items config
  const menuItems = [
    {
      id: "setup",
      icon: faCog,
      label: "Setup",
      items: [
        { href: "/setup/setup", label: "Company Details" },
        { href: "/setup/Hero-Promo-setup", label: "Hero-Promo Setup" },
        { href: "/setup/receipts", label: "Receipts" },
        { href: "/setup/pos-tenders", label: "POS Tenders" },
        { href: "/setup/location-items", label: "Location Tenders" },
      ],
    },
    {
      id: "manage",
      icon: faList,
      label: "Manage",
      items: [
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
      id: "stock",
      icon: faBoxes,
      label: "Stock",
      items: [
        { href: "/stock/management", label: "Stock Management" },
        { href: "/stock/movement", label: "Stock Movement" },
        { href: "/stock/expiration-report", label: "Expiration Report" },
      ],
    },
    {
      id: "reporting",
      icon: faChartLine,
      label: "Reporting",
      items: [
        { href: "/reporting/reporting", label: "Sales Report" },
        { href: "/reporting/end-of-day-report", label: "End of Day Reports" },
        { href: "/reporting/sales-report/time-intervals", label: "Time Intervals", indent: true },
        { href: "/reporting/sales-report/time-comparisons", label: "Time Comparisons", indent: true },
        { href: "/reporting/sales-report/products", label: "Sales by Product", indent: true },
        { href: "/reporting/sales-report/employees", label: "Employees", indent: true },
        { href: "/reporting/sales-report/locations", label: "Locations", indent: true },
        { href: "/reporting/sales-report/categories", label: "Categories", indent: true },
        { href: "/reporting/transaction-report/held-transactions", label: "Held Transactions", indent: true },
        { href: "/reporting/transaction-report/completed-transactions", label: "Completed Transactions", indent: true },
      ],
    },
    {
      id: "expenses",
      icon: faCoins,
      label: "Expenses",
      items: [
        { href: "/expenses/expenses", label: "Expenses Entry" },
        { href: "/expenses/analysis", label: "Expenses Analysis" },
        { href: "/expenses/tax-analysis", label: "Tax Analysis" },
        { href: "/expenses/tax-personal", label: "Personal Tax Calculator" },
      ],
    },
  ];

  return (
    <>
      {/* MOBILE MENU BUTTON */}
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
      <div className="hidden md:flex md:w-20 md:h-[calc(100vh-48px)] md:flex-col bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 shadow-lg relative z-20">
        <nav className="mt-6 h-full flex flex-col">
          <ul className="space-y-1">
            {renderDesktopMenuItem("/", faHome, "Home", pathname === "/")}

            {/* Menu with Submenu */}
            {menuItems.map((menu) => (
              <li
                key={menu.id}
                className={`${pathname.startsWith(`/${menu.id}`) ? activeLink : baseLink} relative`}
              >
                <div
                  className="flex flex-col items-center justify-center cursor-pointer w-full h-full"
                  onClick={() => toggleMenu(menu.id)}
                >
                  <FontAwesomeIcon icon={menu.icon} className="w-6 h-6" />
                  <span className="text-xs mt-1">{menu.label}</span>
                </div>

                {/* Submenu Panel */}
                {openMenu === menu.id && (
                  <div className="absolute top-0 left-20 w-56 h-[calc(100vh-48px)] bg-white border-r border-gray-200 overflow-y-auto shadow-2xl z-50 animate-in fade-in duration-200">
                    <div className="px-4 py-3 border-b border-gray-200 sticky top-0 bg-white">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{menu.label}</p>
                    </div>
                    <ul>
                      {menu.items.map((item) =>
                        renderSubMenuItem(item.href, item.label, item.indent)
                      )}
                    </ul>
                  </div>
                )}
              </li>
            ))}

            {renderDesktopMenuItem("/till", faCashRegister, "Till", pathname === "/till")}
            {renderDesktopMenuItem("/support", faHeadset, "Support", pathname === "/support")}
          </ul>
        </nav>
      </div>

      {/* MOBILE SIDEBAR */}
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
            <li onClick={closeMenuOnNavigation}>
              <Link href="/" className={pathname === "/" ? mobileActiveLink : mobileBaseLink}>
                <FontAwesomeIcon icon={faHome} className="w-5 h-5" />
                <span>Home</span>
              </Link>
            </li>

            {/* Menu Items */}
            {menuItems.map((menu) => (
              <li key={menu.id}>
                <button
                  onClick={() => toggleMenu(menu.id)}
                  className={`w-full ${pathname.startsWith(`/${menu.id}`) ? mobileActiveLink : mobileBaseLink} justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={menu.icon} className="w-5 h-5" />
                    <span>{menu.label}</span>
                  </div>
                  <span className={`transition-transform duration-300 ${openMenu === menu.id ? "rotate-90" : ""}`}>›</span>
                </button>

                {/* Submenu (Mobile) */}
                {openMenu === menu.id && (
                  <ul className="bg-gray-50 border-l-4 border-blue-600">
                    {menu.items.map((item) => (
                      <li key={item.href} onClick={closeMenuOnNavigation}>
                        <Link
                          href={item.href}
                          className={`block px-8 py-3 text-sm transition-all ${
                            pathname === item.href
                              ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600"
                              : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-l-4 border-transparent"
                          }`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}

            {/* Till */}
            <li onClick={closeMenuOnNavigation}>
              <Link href="/till" className={pathname === "/till" ? mobileActiveLink : mobileBaseLink}>
                <FontAwesomeIcon icon={faCashRegister} className="w-5 h-5" />
                <span>Till</span>
              </Link>
            </li>

            {/* Support */}
            <li onClick={closeMenuOnNavigation}>
              <Link href="/support" className={pathname === "/support" ? mobileActiveLink : mobileBaseLink}>
                <FontAwesomeIcon icon={faHeadset} className="w-5 h-5" />
                <span>Support</span>
              </Link>
            </li>
          </ul>
        </nav>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <Loader size="lg" fullScreen={false} text="Please wait..." />
        </div>
      )}
    </>
  );
}
