import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faCog,
  faBox,
  faBarcode,
  faChartLine,
  faCashRegister,
  faUsers,
  faChevronRight,
  faCoins,
  faClipboardList,
  faTags,
  faShoppingCart,
  faFileInvoice,
  faExclamationTriangle,
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

  const closeMenu = () => {
    setOpenMenu(null);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

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

  // Consistent styling for nav items - DESKTOP
  const baseLink = "px-2 py-4 text-gray-600 transition-all duration-300 hover:bg-sky-50 hover:text-sky-600 flex items-center justify-center flex-col text-xs cursor-pointer border-l-4 border-transparent hidden md:flex";
  const activeLink = `px-2 py-4 text-white bg-gradient-to-r from-sky-600 to-sky-700 flex items-center justify-center flex-col text-xs cursor-pointer font-semibold border-l-4 border-sky-900 transition-all duration-300 shadow-md hidden md:flex`;

  // MOBILE styles
  const mobileBaseLink = "px-3 py-3 text-gray-700 transition-all duration-300 hover:bg-sky-50 hover:text-sky-600 border-l-4 border-transparent flex items-center gap-3 text-sm";
  const mobileActiveLink = "px-3 py-3 text-white bg-gradient-to-r from-sky-600 to-sky-700 border-l-4 border-sky-900 flex items-center gap-3 text-sm font-semibold";

  const renderMenuItem = (href, icon, label) => (
    <li key={href} className={pathname === href ? activeLink : baseLink}>
      <Link href={href} onClick={closeMenu}>
        <div className="flex flex-col items-center justify-center gap-1">
          <FontAwesomeIcon icon={icon} className="w-5 h-5" />
          <span className="text-xs font-medium text-center">{label}</span>
        </div>
      </Link>
    </li>
  );

  const renderSubMenu = (items) =>
    items.map(({ href, label, icon, indent = false }) => {
      const isActive = pathname === href;
      return (
        <li
          key={href}
          className={`border-b border-gray-100 last:border-b-0 transition-all duration-300 group`}
          onClick={closeMenu}
        >
          <Link 
            href={href} 
            className={`w-full h-14 flex items-center gap-3 text-sm font-medium transition-all duration-300 ${
              indent ? "px-8 py-3" : "px-4 py-3"
            } ${
              isActive
                ? "bg-gradient-to-r from-sky-50 to-transparent border-l-4 border-sky-600 text-sky-700 shadow-sm"
                : "text-gray-700 hover:bg-sky-50 hover:text-sky-600 border-l-4 border-transparent"
            }`}
          >
            {icon && <FontAwesomeIcon icon={icon} className="w-4 h-4 flex-shrink-0" />}
            <span className="flex-1">{label}</span>
            {isActive && (
              <span className="text-sky-600 text-lg font-bold">›</span>
            )}
          </Link>
        </li>
      );
    });

  // Menu structure organized by category
  const menuStructure = [
    { section: "Main", items: [] },
    {
      section: "Setup",
      icon: faCog,
      submenu: [
        { href: "/setup/setup", label: "Company Details", icon: faCog },
        { href: "/setup/Hero-Promo-setup", label: "Promotions", icon: faTags },
        { href: "/setup/receipts", label: "Receipts", icon: faFileInvoice },
        { href: "/setup/pos-tenders", label: "POS Tenders", icon: faCashRegister },
        { href: "/setup/location-items", label: "Location Tenders", icon: faCoins },
        { href: "/setup/till-management", label: "Till Management", icon: faCashRegister },
      ],
    },
    {
      section: "Products",
      icon: faBox,
      submenu: [
        { href: "/manage/products", label: "Product List", icon: faBox },
        { href: "/manage/archived", label: "Archived", icon: faExclamationTriangle },
        { href: "/manage/categories", label: "Categories", icon: faTags },
        { href: "/manage/promotions", label: "Promotions", icon: faTags },
      ],
    },
    {
      section: "Sales",
      icon: faShoppingCart,
      submenu: [
        { href: "/manage/orders", label: "Orders", icon: faShoppingCart },
        { href: "/manage/promotions-management", label: "Promotions", icon: faTags },
        { href: "/manage/campaigns", label: "Campaigns", icon: faChartLine },
      ],
    },
    {
      section: "People",
      icon: faUsers,
      submenu: [
        { href: "/manage/staff", label: "Staff", icon: faUsers },
        { href: "/manage/customers", label: "Customers", icon: faUsers },
        { href: "/manage/customer-search", label: "Customer Search", icon: faClipboardList },
      ],
    },
    {
      section: "Stock",
      icon: faBox,
      submenu: [
        { href: "/stock/add", label: "Add Stock", icon: faBox },
        { href: "/stock/movement", label: "Stock Movement", icon: faBarcode },
        { href: "/stock/inventory", label: "Inventory", icon: faBarcode },
      ],
    },
    {
      section: "Reports",
      icon: faChartLine,
      submenu: [
        { href: "/reporting/daily-sales", label: "Daily Sales", icon: faChartLine },
        { href: "/reporting/end-of-day", label: "End of Day", icon: faCashRegister },
        { href: "/reporting/expenses", label: "Expenses", icon: faCoins },
      ],
    },
  ];

  return (
    <>
      {/* MOBILE HAMBURGER BUTTON */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-12 bg-gradient-to-r from-sky-600 to-sky-700 flex items-center gap-3 px-4 z-40 shadow-md">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white text-xl transition-all"
          aria-label="Toggle menu"
        >
          <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
        </button>
        <span className="text-white font-semibold text-sm flex-1">Menu</span>
      </div>

      {/* MOBILE BACKDROP */}
      {isMobileMenuOpen && isMobile && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 top-12"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="fixed top-12 left-0 w-20 h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 border-r-2 border-gray-200 z-10 shadow-lg overflow-y-auto hidden md:block">
        <nav className="mt-6">
          <ul className="space-y-1">
            {/* Home */}
            {renderMenuItem("/", faHome, "Home")}

            {/* Dynamic Menu Items */}
            {menuStructure.map(({ section, icon, submenu }) => {
              if (!submenu) return null;
              
              const isActive = submenu.some(item => pathname.startsWith(item.href.split('/').slice(0, 2).join('/')));
              
              return (
                <li
                  key={section}
                  className={isActive ? activeLink : baseLink}
                >
                  <div
                    className="flex flex-col items-center justify-center cursor-pointer gap-1"
                    onClick={() => toggleMenu(section)}
                    title={section}
                  >
                    <FontAwesomeIcon icon={icon} className="w-5 h-5" />
                    <span className="text-xs font-medium text-center">{section.split(' ')[0]}</span>
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className={`w-3 h-3 transition-transform duration-300 ${
                        openMenu === section ? "rotate-90" : ""
                      }`}
                    />
                  </div>

                  {/* Desktop Submenu */}
                  <ul
                    className={`absolute left-full pt-12 top-0 w-64 bg-white border-r-2 border-gray-200 h-screen shadow-2xl transition-all duration-300 ease-in-out z-50 overflow-y-auto ${
                      openMenu === section
                        ? "translate-x-0 opacity-100 text-gray-700 pointer-events-auto"
                        : "translate-x-64 opacity-0 pointer-events-none"
                    }`}
                  >
                    {/* Section Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-sky-600 to-sky-700 text-white px-4 py-4 border-b-2 border-sky-800 z-10">
                      <p className="text-sm font-bold uppercase tracking-wider">{section}</p>
                    </div>

                    {/* Submenu Items */}
                    {renderSubMenu(submenu)}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* MOBILE SIDEBAR - FULL SCREEN */}
      {isMobileMenuOpen && isMobile && (
        <nav className="fixed top-12 left-0 right-0 bottom-0 w-full bg-white shadow-2xl z-40 overflow-y-auto">
          <ul className="space-y-0 pb-20">
            {/* Home */}
            <li onClick={closeMenu}>
              <Link href="/" className={`${mobileBaseLink} ${pathname === "/" ? mobileActiveLink : ""}`}>
                <FontAwesomeIcon icon={faHome} className="w-5 h-5" />
                <span>Home</span>
              </Link>
            </li>

            {/* Mobile Dynamic Menu Items */}
            {menuStructure.map(({ section, icon, submenu }) => {
              if (!submenu) return null;

              const isActive = submenu.some(item => pathname.startsWith(item.href.split('/').slice(0, 2).join('/')));

              return (
                <li key={section}>
                  {/* Section Header - Collapsible */}
                  <button
                    onClick={() => toggleMenu(section)}
                    className={`w-full ${isActive ? mobileActiveLink : mobileBaseLink} justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={icon} className="w-5 h-5" />
                      <span>{section}</span>
                    </div>
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className={`w-4 h-4 transition-transform duration-300 ${
                        openMenu === section ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {/* Mobile Submenu - Collapsible */}
                  {openMenu === section && (
                    <ul className="bg-gray-50 border-l-4 border-sky-600">
                      {submenu.map(({ href, label, icon: subIcon }) => {
                        const isSubActive = pathname === href;
                        return (
                          <li key={href} onClick={closeMenu}>
                            <Link
                              href={href}
                              className={`block pl-12 pr-4 py-3 text-sm transition-all ${
                                isSubActive
                                  ? "bg-sky-50 text-sky-700 font-semibold border-l-4 border-sky-600"
                                  : "text-gray-700 hover:bg-sky-50 hover:text-sky-600 border-l-4 border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {subIcon && <FontAwesomeIcon icon={subIcon} className="w-4 h-4" />}
                                <span>{label}</span>
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {/* Loading Indicator */}
      {loading && <Loader size="sm" variant="dots" fullScreen text="" />}
    </>
  );
}

