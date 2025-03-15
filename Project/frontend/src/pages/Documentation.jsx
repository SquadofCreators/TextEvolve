// src/pages/Documentation.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/utility/PageHeader";
import DesignedBy from "../components/DesignedBy";
import { FaChevronUp, FaArrowLeft } from "react-icons/fa6";
import  TextEvolveLogo from "../assets/textevolve-logo.svg";

function Documentation() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Listen for scroll events to toggle back-to-top button visibility.
  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > 100) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="relative flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors">
        <PageHeader
          title="Documentation"
          heading="Learn how to use TextEvolve"
          description="Learn how to use TextEvolve effectively and discover all its features."
          link="/"
        />

        <div className="max-w-5xl mx-auto space-y-12 bg-gray-200/60 dark:bg-gray-800 p-8 rounded-xl shadow-md">
          {/* Logo Section */}
          <section className="flex flex-col items-center">
            <img 
              src={TextEvolveLogo}
              alt="Text Evolve Logo" 
              className="w-32 h-32 mx-auto mb-2"
            />
            <h2 className="text-3xl font-bold text-gray-700 dark:text-gray-200 mb-4">
              TextEvolve
            </h2>
          </section>

          {/* Overview Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
              Overview
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              TextEvolve is a cutting-edge solution for converting handwritten or scanned
              documents into searchable, editable digital formats. Using advanced OCR technology,
              it helps organizations digitize their archives, streamline data entry, and unlock
              valuable insights from historical records.
            </p>
          </section>

          {/* Getting Started */}
          <section>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
              Getting Started
            </h2>
            <ol className="list-decimal list-inside text-lg text-gray-600 dark:text-gray-300 leading-relaxed space-y-3">
              <li>
                <span className="font-semibold">Upload Documents:</span>{" "}
                Navigate to the "Upload" page and drag or select your files (JPEG, PNG, PDF, or DOCX).
              </li>
              <li>
                <span className="font-semibold">Conversion Process:</span>{" "}
                TextEvolve processes each file, extracting text using advanced OCR.
              </li>
              <li>
                <span className="font-semibold">Review & Download:</span> Once conversion is complete,
                review the extracted text or download the converted file.
              </li>
            </ol>
          </section>

          {/* Advanced Features */}
          <section>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
              Advanced Features
            </h2>
            <ul className="list-disc list-inside text-lg text-gray-600 dark:text-gray-300 leading-relaxed space-y-3">
              <li>
                <span className="font-semibold">OCR Accuracy Reports:</span> View detailed accuracy
                metrics on the Analytics page.
              </li>
              <li>
                <span className="font-semibold">Batch Processing:</span> Upload multiple files at once
                to streamline document workflows.
              </li>
              <li>
                <span className="font-semibold">History & Logs:</span> Track past conversions for easy
                reference and re-download.
              </li>
            </ul>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  Q: Which file formats are supported?
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  A: TextEvolve supports JPEG, PNG, PDF, and DOCX.
                </p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  Q: Can I process multiple files at once?
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  A: Yes. Simply select or drag multiple files on the Upload page.
                </p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  Q: How accurate is the OCR?
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  A: Accuracy depends on the quality of the source images, but our advanced OCR models
                  can achieve up to 98% accuracy.
                </p>
              </div>
            </div>
          </section>

          {/* Additional Resources */}
          <section>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
              Additional Resources
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              For more detailed information, visit our{" "}
              <a
                href="https://docs.example.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:underline transition-colors"
              >
                official documentation
              </a>{" "}
              or contact our{" "}
              <Link to="/support" className="text-orange-500 hover:underline transition-colors">
                Support
              </Link>{" "}
              team.
            </p>
          </section>

          {/* Back to Home */}
          <div className="w-full flex justify-center mt-12">
            <Link
              to="/"
              className="bg-orange-500 text-lg text-white px-3 py-2 rounded-lg shadow-md hover:bg-orange-600 transition-colors duration-300"
            >
              <FaArrowLeft className="inline-flex mb-0.5 mr-1" />     Back to Home
            </Link>
          </div>
        </div>

        {/* Back to Top Button */}
        {showBackToTop && (
          <div className="fixed bottom-4 right-4 z-50">
            <button
              onClick={scrollToTop}
              className="bg-orange-500 text-lg text-white p-3 rounded-full shadow-md hover:bg-orange-600 transition-colors duration-300 cursor-pointer"
            >
              <FaChevronUp />
            </button>
          </div>
        )}

        {/* Credits */}
        <div className="mt-12">
          <DesignedBy />
        </div>
      </div>
    </>
  );
}

export default Documentation;
