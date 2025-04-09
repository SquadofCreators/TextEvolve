// src/pages/AnalyticsPage.jsx
import React from 'react';
import {
  FiTrendingUp,
  FiBarChart2,
  FiPieChart,
  FiRefreshCcw,
} from 'react-icons/fi';

function AnalyticsPage() {
  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Analytics Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          View your document conversion analytics and usage statistics here.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Documents Converted */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              Documents Converted
            </h2>
            <FiBarChart2 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2">1,234</p>
          <p className="text-sm text-green-500 mt-1 flex items-center gap-1">
            <FiTrendingUp /> +12% this week
          </p>
        </div>

        {/* OCR Accuracy */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              Average OCR Accuracy
            </h2>
            <FiPieChart className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2">98%</p>
          <p className="text-sm text-green-500 mt-1 flex items-center gap-1">
            <FiTrendingUp /> +3% this month
          </p>
        </div>

        {/* Documents per Day */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              Avg. Docs / Day
            </h2>
            <FiRefreshCcw className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2">86</p>
          <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
            <FiTrendingUp className="transform rotate-180" /> -4% this week
          </p>
        </div>

        {/* Pages Processed */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              Pages Processed
            </h2>
            <FiBarChart2 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2">15,678</p>
          <p className="text-sm text-green-500 mt-1 flex items-center gap-1">
            <FiTrendingUp /> +6% this month
          </p>
        </div>
      </div>

      {/* Charts / Detailed Analytics */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Trend Chart Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 h-72 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Conversion Trends
          </h2>
          <div className="flex-1 flex items-center justify-center">
            {/* Replace with actual chart library */}
            <p className="text-gray-500 dark:text-gray-400">Chart Placeholder</p>
          </div>
        </div>

        {/* Document Type Distribution Chart Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 h-72 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Document Types
          </h2>
          <div className="flex-1 flex items-center justify-center">
            {/* Replace with actual chart library */}
            <p className="text-gray-500 dark:text-gray-400">Chart Placeholder</p>
          </div>
        </div>
      </div>

      {/* Table / Detailed List Placeholder */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
          Detailed Conversion Log
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 px-3 text-gray-500 dark:text-gray-400">Document</th>
                <th className="py-2 px-3 text-gray-500 dark:text-gray-400">Pages</th>
                <th className="py-2 px-3 text-gray-500 dark:text-gray-400">Accuracy</th>
                <th className="py-2 px-3 text-gray-500 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              {/* Sample row data - replace with actual */}
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <td className="py-2 px-3">Annual Report 2024</td>
                <td className="py-2 px-3">42</td>
                <td className="py-2 px-3">96%</td>
                <td className="py-2 px-3">March 14, 2025</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <td className="py-2 px-3">Meeting Notes</td>
                <td className="py-2 px-3">5</td>
                <td className="py-2 px-3">99%</td>
                <td className="py-2 px-3">March 12, 2025</td>
              </tr>
              <tr>
                <td className="py-2 px-3">Research Paper</td>
                <td className="py-2 px-3">18</td>
                <td className="py-2 px-3">94%</td>
                <td className="py-2 px-3">March 8, 2025</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
