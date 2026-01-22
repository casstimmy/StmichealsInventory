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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
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

  const closeMenuOnNavigation = () => {
    setOpenMenu(null);
    setOpenSubMenu(null);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Auto-open menu based on active pathname ONLY if desktop and menu was not just closed
  useEffect(() => {
    if (isMobile) return; // Don't auto-open on mobile
    
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

      {/* DESKTOP SIDEBAR - Responsive width */}
      <aside className={`hidden md:flex md:flex-col md:h-screen md:bg-gradient-to-b md:from-gray-50 md:to-gray-100 md:border-r md:border-gray-200 md:shadow-lg md:overflow-y-auto md:transition-all md:duration-300 ${
        isSidebarExpanded ? "md:w-72" : "md:w-20"
      }`}>
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="hidden md:flex md:items-center md:justify-center md:h-16 md:w-full md:border-b md:border-gray-200 hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Toggle sidebar"
        >
          <FontAwesomeIcon 
            icon={isSidebarExpanded ? faTimes : faBars} 
            className="w-5 h-5 text-gray-700"
          />
        </button>

        {/* Sidebar Menu Items */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1 p-2">
            {/* Home */}
            <li>
              <Link 
                href="/" 
                onClick={closeMenuOnNavigation}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  pathname === "/" 
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md" 
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <FontAwesomeIcon icon={faHome} className="w-5 h-5 flex-shrink-0" />
                {isSidebarExpanded && <span className="text-sm font-medium">Home</span>}
              </Link>
            </li>

            {/* Setup Menu */}
            <li>
              <button
                onClick={() => setOpenMenu(openMenu === "setup" ? null : "setup")}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  pathname.startsWith("/setup")
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <FontAwesomeIcon icon={faCog} className="w-5 h-5 flex-shrink-0" />
                {isSidebarExpanded && (
                  <>
                    <span className="text-sm font-medium flex-1 text-left">Setup</span>
                    <FontAwesomeIcon 
                      icon={faChevronRight} 
                      className={`w-4 h-4 transition-transform ${openMenu === "setup" ? "rotate-90" : ""}`}
                    />
                  </>
                )}
              </button>
              {isSidebarExpanded && openMenu === "setup" && (
                <ul className="bg-gray-50 rounded-lg mt-1 overflow-hidden border border-gray-200">
                  <li><Link href="/setup/setup" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/setup/setup" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Company Details</Link></li>
                  <li><Link href="/setup/Hero-Promo-setup" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/setup/Hero-Promo-setup" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Hero-Promo Setup</Link></li>
                  <li><Link href="/setup/receipts" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/setup/receipts" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Receipts</Link></li>
                  <li><Link href="/setup/pos-tenders" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/setup/pos-tenders" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>POS Tenders</Link></li>
                  <li><Link href="/setup/location-items" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/setup/location-items" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Location Tenders</Link></li>
                </ul>
              )}
            </li>

            {/* Manage Menu */}
            <li>
              <button
                onClick={() => setOpenMenu(openMenu === "manage" ? null : "manage")}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  pathname.startsWith("/manage")
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <FontAwesomeIcon icon={faList} className="w-5 h-5 flex-shrink-0" />
                {isSidebarExpanded && (
                  <>
                    <span className="text-sm font-medium flex-1 text-left">Manage</span>
                    <FontAwesomeIcon 
                      icon={faChevronRight} 
                      className={`w-4 h-4 transition-transform ${openMenu === "manage" ? "rotate-90" : ""}`}
                    />
                  </>
                )}
              </button>
              {isSidebarExpanded && openMenu === "manage" && (
                <ul className="bg-gray-50 rounded-lg mt-1 overflow-hidden border border-gray-200">
                  <li><Link href="/manage/products" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/manage/products" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Product List</Link></li>
                  <li><Link href="/manage/archived" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/manage/archived" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Archived Products</Link></li>
                  <li><Link href="/manage/categories" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/manage/categories" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Categories</Link></li>
                  <li><Link href="/manage/promotions" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/manage/promotions" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Promotions</Link></li>
                  <li><Link href="/manage/promotions-management" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/manage/promotions-management" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Customer Promotions</Link></li>
                  <li><Link href="/manage/orders" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/manage/orders" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Orders</Link></li>
                  <li><Link href="/manage/staff" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/manage/staff" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Staff</Link></li>
                  <li><Link href="/manage/customers" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/manage/customers" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Customers</Link></li>
                  <li><Link href="/manage/customer-search" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/manage/customer-search" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Customer Search</Link></li>
                  <li><Link href="/manage/campaigns" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/manage/campaigns" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Campaigns</Link></li>
                </ul>
              )}
            </li>

            {/* Stock Menu */}
            <li>
              <button
                onClick={() => setOpenMenu(openMenu === "stock" ? null : "stock")}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  pathname.startsWith("/stock")
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <FontAwesomeIcon icon={faBoxes} className="w-5 h-5 flex-shrink-0" />
                {isSidebarExpanded && (
                  <>
                    <span className="text-sm font-medium flex-1 text-left">Stock</span>
                    <FontAwesomeIcon 
                      icon={faChevronRight} 
                      className={`w-4 h-4 transition-transform ${openMenu === "stock" ? "rotate-90" : ""}`}
                    />
                  </>
                )}
              </button>
              {isSidebarExpanded && openMenu === "stock" && (
                <ul className="bg-gray-50 rounded-lg mt-1 overflow-hidden border border-gray-200">
                  <li><Link href="/stock/management" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/stock/management" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Stock Management</Link></li>
                  <li><Link href="/stock/movement" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/stock/movement" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Stock Movement</Link></li>
                  <li><Link href="/stock/expiration-report" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/stock/expiration-report" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Expiration Report</Link></li>
                </ul>
              )}
            </li>

            {/* Reporting Menu */}
            <li>
              <button
                onClick={() => setOpenMenu(openMenu === "reporting" ? null : "reporting")}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  pathname.startsWith("/reporting")
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 flex-shrink-0" />
                {isSidebarExpanded && (
                  <>
                    <span className="text-sm font-medium flex-1 text-left">Reporting</span>
                    <FontAwesomeIcon 
                      icon={faChevronRight} 
                      className={`w-4 h-4 transition-transform ${openMenu === "reporting" ? "rotate-90" : ""}`}
                    />
                  </>
                )}
              </button>
              {isSidebarExpanded && openMenu === "reporting" && (
                <ul className="bg-gray-50 rounded-lg mt-1 overflow-hidden border border-gray-200">
                  <li><Link href="/reporting/reporting" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/reporting/reporting" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Sales Report</Link></li>
                  <li><Link href="/reporting/end-of-day-report" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/reporting/end-of-day-report" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>End of Day Reports</Link></li>
                </ul>
              )}
            </li>

            {/* Expenses Menu */}
            <li>
              <button
                onClick={() => setOpenMenu(openMenu === "expenses" ? null : "expenses")}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  pathname.startsWith("/expenses")
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <FontAwesomeIcon icon={faCoins} className="w-5 h-5 flex-shrink-0" />
                {isSidebarExpanded && (
                  <>
                    <span className="text-sm font-medium flex-1 text-left">Expenses</span>
                    <FontAwesomeIcon 
                      icon={faChevronRight} 
                      className={`w-4 h-4 transition-transform ${openMenu === "expenses" ? "rotate-90" : ""}`}
                    />
                  </>
                )}
              </button>
              {isSidebarExpanded && openMenu === "expenses" && (
                <ul className="bg-gray-50 rounded-lg mt-1 overflow-hidden border border-gray-200">
                  <li><Link href="/expenses/expenses" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/expenses/expenses" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Expenses Entry</Link></li>
                  <li><Link href="/expenses/analysis" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/expenses/analysis" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Expenses Analysis</Link></li>
                  <li><Link href="/expenses/tax-analysis" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/expenses/tax-analysis" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Tax Analysis</Link></li>
                  <li><Link href="/expenses/tax-personal" onClick={closeMenuOnNavigation} className={`block px-4 py-2 text-xs transition-all ${pathname === "/expenses/tax-personal" ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>Personal Tax Calculator</Link></li>
                </ul>
              )}
            </li>

            {/* Till */}
            <li>
              <Link 
                href="/till" 
                onClick={closeMenuOnNavigation}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  pathname === "/till" 
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md" 
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <FontAwesomeIcon icon={faCashRegister} className="w-5 h-5 flex-shrink-0" />
                {isSidebarExpanded && <span className="text-sm font-medium">Till</span>}
              </Link>
            </li>

            {/* Support */}
            <li>
              <Link 
                href="/support" 
                onClick={closeMenuOnNavigation}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  pathname === "/support" 
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md" 
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <FontAwesomeIcon icon={faHeadset} className="w-5 h-5 flex-shrink-0" />
                {isSidebarExpanded && <span className="text-sm font-medium">Support</span>}
              </Link>
            </li>
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