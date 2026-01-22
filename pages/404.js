"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faEnvelope,
  faPhone,
  faArrowRight,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header section with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 sm:px-8 py-12 sm:py-16">
            <div className="flex justify-center mb-6">
              <div className="text-white text-5xl sm:text-6xl font-bold">
                <FontAwesomeIcon icon={faExclamationCircle} className="mr-4" />
                404
              </div>
            </div>
            <h1 className="text-white text-2xl sm:text-3xl font-bold text-center">
              Page Not Found
            </h1>
            <p className="text-blue-100 text-center mt-2 text-sm sm:text-base">
              We couldn't find the page you're looking for
            </p>
          </div>

          {/* Content section */}
          <div className="px-6 sm:px-8 py-12 sm:py-16">
            {/* Error description */}
            <div className="text-center mb-12">
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-4">
                The page you're trying to access doesn't exist or may have been moved. 
                This could be due to:
              </p>
              <ul className="text-left inline-block space-y-2 text-gray-600 text-sm sm:text-base">
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-3">•</span>
                  <span>An incorrect or outdated URL</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-3">•</span>
                  <span>A page that has been removed or archived</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-3">•</span>
                  <span>Insufficient permissions to access this resource</span>
                </li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              <Link href="/">
                <a className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105">
                  <FontAwesomeIcon icon={faHome} className="mr-2" />
                  Back to Dashboard
                </a>
              </Link>
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-300"
              >
                <FontAwesomeIcon icon={faArrowRight} className="mr-2 rotate-180" />
                Go Back
              </button>
            </div>

            {/* Support section */}
            <div className="border-t border-gray-200 pt-12">
              <h3 className="text-gray-900 font-bold text-lg sm:text-xl mb-8 text-center">
                Need Help?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Email support */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="text-blue-600 text-xl"
                    />
                  </div>
                  <h4 className="text-gray-900 font-semibold mb-2">Email Support</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    Reach out to our support team for assistance
                  </p>
                  <a
                    href="mailto:support@stmichaelshub.com"
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center justify-center transition"
                  >
                    support@stmichaelshub.com
                    <FontAwesomeIcon icon={faArrowRight} className="ml-2 text-xs" />
                  </a>
                </div>

                {/* Phone support */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
                    <FontAwesomeIcon
                      icon={faPhone}
                      className="text-cyan-600 text-xl"
                    />
                  </div>
                  <h4 className="text-gray-900 font-semibold mb-2">Phone Support</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    Call us during business hours for immediate assistance
                  </p>
                  <a
                    href="tel:+234XXXXXXXXXX"
                    className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm flex items-center justify-center transition"
                  >
                    +234 (XXX) XXX-XXXX
                    <FontAwesomeIcon icon={faArrowRight} className="ml-2 text-xs" />
                  </a>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="border-t border-gray-200 mt-12 pt-8">
              <p className="text-gray-600 text-center text-sm font-semibold mb-4 uppercase tracking-wide">
                Quick Navigation
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { label: "Products", href: "/manage/products" },
                  { label: "Customers", href: "/manage/customers" },
                  { label: "Orders", href: "/manage/orders" },
                  { label: "Reports", href: "/reporting/sales-report" },
                  { label: "Settings", href: "/setup/receipt-settings" },
                ].map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a className="px-3 py-1 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-600 text-xs sm:text-sm rounded-full transition">
                      {link.label}
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 sm:px-8 py-6 border-t border-gray-200">
            <p className="text-center text-gray-500 text-xs sm:text-sm">
              © 2024 St. Michael's Hub. All rights reserved. | Error Code: 404
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
