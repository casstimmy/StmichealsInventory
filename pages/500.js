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
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";

export default function ServerError() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header section with gradient */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 sm:px-8 py-12 sm:py-16">
            <div className="flex justify-center mb-6">
              <div className="text-white text-5xl sm:text-6xl font-bold">
                <FontAwesomeIcon icon={faCircleExclamation} className="mr-4" />
                500
              </div>
            </div>
            <h1 className="text-white text-2xl sm:text-3xl font-bold text-center">
              Server Error
            </h1>
            <p className="text-red-100 text-center mt-2 text-sm sm:text-base">
              Something went wrong on our end
            </p>
          </div>

          {/* Content section */}
          <div className="px-6 sm:px-8 py-12 sm:py-16">
            {/* Error description */}
            <div className="text-center mb-12">
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-4">
                We encountered an unexpected error while processing your request. 
                Our technical team has been notified and is working to resolve this issue.
              </p>
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded text-left">
                <p className="text-red-800 text-sm font-semibold mb-2">What you can do:</p>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• Try refreshing the page</li>
                  <li>• Clear your browser cache and cookies</li>
                  <li>• Try again in a few moments</li>
                  <li>• Contact our support team if the problem persists</li>
                </ul>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              <Link href="/">
                <a className="flex items-center justify-center bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105">
                  <FontAwesomeIcon icon={faHome} className="mr-2" />
                  Back to Dashboard
                </a>
              </Link>
              <button
                onClick={() => router.reload()}
                className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-300"
              >
                <FontAwesomeIcon icon={faArrowRight} className="mr-2 rotate-180" />
                Refresh Page
              </button>
            </div>

            {/* Support section */}
            <div className="border-t border-gray-200 pt-12">
              <h3 className="text-gray-900 font-bold text-lg sm:text-xl mb-8 text-center">
                Contact Support
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Email support */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="text-red-600 text-xl"
                    />
                  </div>
                  <h4 className="text-gray-900 font-semibold mb-2">Email Support</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    Report this issue to our technical team
                  </p>
                  <a
                    href="mailto:support@stmichaelshub.com?subject=Error%20500%20Report"
                    className="text-red-600 hover:text-red-700 font-semibold text-sm flex items-center justify-center transition"
                  >
                    support@stmichaelshub.com
                    <FontAwesomeIcon icon={faArrowRight} className="ml-2 text-xs" />
                  </a>
                </div>

                {/* Phone support */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <FontAwesomeIcon
                      icon={faPhone}
                      className="text-orange-600 text-xl"
                    />
                  </div>
                  <h4 className="text-gray-900 font-semibold mb-2">Phone Support</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    Call us for immediate assistance
                  </p>
                  <a
                    href="tel:+234XXXXXXXXXX"
                    className="text-orange-600 hover:text-orange-700 font-semibold text-sm flex items-center justify-center transition"
                  >
                    +234 (XXX) XXX-XXXX
                    <FontAwesomeIcon icon={faArrowRight} className="ml-2 text-xs" />
                  </a>
                </div>
              </div>
            </div>

            {/* Status information */}
            <div className="border-t border-gray-200 mt-12 pt-8 bg-gray-50 -mx-6 sm:-mx-8 px-6 sm:px-8 py-8 rounded-b-2xl">
              <p className="text-gray-600 text-center text-sm mb-4">
                <strong>Error ID:</strong> {Math.random().toString(36).substr(2, 9).toUpperCase()}
              </p>
              <p className="text-gray-500 text-center text-xs">
                Please include this Error ID when contacting support to help us investigate the issue faster.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
