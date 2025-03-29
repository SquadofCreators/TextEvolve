import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const steps = [
  "Initializing",
  "Extracting Text",
  "Processing Data",
  "Finalizing",
  "Completed",
];

const ExtractTextPage = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // Simulate progress update
  useEffect(() => {
    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        // Increase progress gradually
        setProgress((prev) => {
          const newProgress = prev + Math.floor(Math.random() * 20) + 5;
          if (newProgress >= 100) {
            setCurrentStep(steps.length - 1);
            return 100;
          }
          return newProgress;
        });
        // Move to next step when progress crosses threshold (simulate each step roughly)
        if (progress >= (currentStep + 1) * 20) {
          setCurrentStep((prevStep) => Math.min(prevStep + 1, steps.length - 1));
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [progress, currentStep]);

  // When extraction is complete, you might want to show results or navigate.
  const handleViewResults = () => {
    // Navigate to results page, for example:
    navigate(`/extraction-results/${batchId}`);
  };

  const handleCancel = () => {
    // Optionally cancel extraction, then navigate back
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-6">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
          Text Extraction Process
        </h1>
        <div className="mb-6">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Batch ID: <span className="font-semibold">{batchId}</span>
          </p>
        </div>

        {/* Process Steps */}
        <div className="mb-6">
          <ol className="flex justify-between">
            {steps.map((step, index) => (
              <li
                key={index}
                className={`flex-1 text-center px-2 py-1 rounded-full border-2 ${
                  index === currentStep
                    ? "bg-blue-600 text-white border-blue-600"
                    : index < currentStep
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-600 border-gray-300 dark:border-gray-600"
                }`}
              >
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-6">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Status Message */}
        <div className="mb-6 text-center">
          {currentStep < steps.length - 1 ? (
            <p className="text-lg text-gray-700 dark:text-gray-200">
              {steps[currentStep]}... ({progress}%)
            </p>
          ) : (
            <p className="text-lg text-green-600 dark:text-green-400">
              Extraction complete!
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={handleViewResults}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              View Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtractTextPage;
