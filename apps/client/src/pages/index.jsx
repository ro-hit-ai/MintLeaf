// apps/client/src/pages/index.jsx
import React from "react";
import { Link } from "react-router-dom";

const CLIENT_VERSION = import.meta.env.VITE_CLIENT_VERSION || "unknown";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-6">
      {/* Logo / Branding */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400">
          Peppermint
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          The open-source ticket management system
        </p>
      </div>

      {/* Hero Content */}
      <div className="max-w-2xl text-center mb-10">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-4">
          Welcome to Your Support Portal
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Submit tickets, track issues, and stay updated — all in one place.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-12">
        <Link
          to="/auth/login"
          className="group bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
        >
          <div className="text-green-600 dark:text-green-400 mb-3">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Log In</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Access your dashboard</p>
        </Link>

        <Link
          to="/submit"
          className="group bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
        >
          <div className="text-blue-600 dark:text-blue-400 mb-3">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Submit Ticket</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Create a new request</p>
        </Link>

        <a
          href="https://docs.peppermint.sh"
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
        >
          <div className="text-purple-600 dark:text-purple-400 mb-3">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Documentation</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Learn how to use Peppermint</p>
        </a>
      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Version{" "}
          <a
            href="https://github.com/Peppermint-Lab/peppermint/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-green-700/10 px-2 py-1 text-xs font-medium text-green-600 ring-1 ring-inset ring-green-500/20 hover:bg-green-700/20 transition"
          >
            {CLIENT_VERSION}
          </a>
        </p>
        <p className="mt-2">
          &copy; {new Date().getFullYear()} Peppermint. Open Source.{" "}
          <a href="https://github.com/Peppermint-Lab/peppermint" className="underline">
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Home;