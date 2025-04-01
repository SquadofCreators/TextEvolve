import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Loader2, Circle } from "lucide-react";


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
  const [isLoading, setIsLoading] = useState(true); // Controls loader spinning

  // Simulate progress update
  useEffect(() => {
    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.floor(Math.random() * 20) + 5;
          if (newProgress >= 100) {
            setCurrentStep(steps.length - 1);
            setIsLoading(false); // Stop loader animation
            return 100;
          }
          return newProgress;
        });

        if (progress >= (currentStep + 1) * 20) {
          setCurrentStep((prevStep) => Math.min(prevStep + 1, steps.length - 1));
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [progress, currentStep]);

  // Navigate to results
  const handleViewResults = () => {
    navigate(`/extraction-results/${batchId}`);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="flex-1 h-full px-4 py-6 md:p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 transition-all">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
          Text Extraction Progress
        </h1>
        <div className="mb-6 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Batch ID: <span className="font-semibold">{batchId}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleCancel}
              className="px-8 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={handleViewResults}
              className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all"
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
