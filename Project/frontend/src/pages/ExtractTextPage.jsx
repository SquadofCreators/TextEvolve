import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, Circle, XCircle, Eye } from 'lucide-react'; // Import icons
import PageHeader from '../components/utility/PageHeader'; // Assuming exists

// Define steps with potential keys for better mapping if needed later
const steps = [
  { name: "Initializing", key: "init" },
  { name: "Extracting Text", key: "extract" },
  { name: "Processing Data", key: "process" },
  { name: "Finalizing", key: "finalize" },
  { name: "Completed", key: "complete" },
];

const ExtractTextPage = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();

  // State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0); // Overall progress percentage (0-100)
  const [isProcessing, setIsProcessing] = useState(true); // Controls animation and button states
  const [error, setError] = useState(null); // Placeholder for potential errors

  // --- Simulation Logic (Replace with API polling later) ---
  useEffect(() => {
    // Don't start simulation if already completed or errored
    if (!isProcessing || error || currentStepIndex >= steps.length - 1) {
        // If completed, ensure progress is 100 and processing stops
        if (currentStepIndex >= steps.length - 1) {
            setProgress(100);
            setIsProcessing(false);
        }
      return;
    }

    const stepDuration = 1500; // Simulate time per step segment
    const progressIncrement = 100 / (steps.length -1) / 5; // Approximate progress per interval within a step

    const intervalId = setInterval(() => {
      setProgress((prev) => {
        const nextProgress = Math.min(prev + progressIncrement, 100);

        // Determine if step should advance based on progress thresholds
        const nextStepThreshold = (currentStepIndex + 1) * (100 / (steps.length - 1));
        if (nextProgress >= nextStepThreshold && currentStepIndex < steps.length - 2) {
           setCurrentStepIndex(prevStep => prevStep + 1);
        }

        // Handle completion
        if (nextProgress >= 100) {
          setCurrentStepIndex(steps.length - 1);
          setIsProcessing(false); // Stop processing animation/simulation
          clearInterval(intervalId); // Stop the interval
          return 100;
        }

        return nextProgress;
      });
    }, stepDuration / 5); // Update progress more frequently within a step

    // Cleanup interval on unmount or when processing stops
    return () => clearInterval(intervalId);

  }, [currentStepIndex, isProcessing, error]); // Dependencies for simulation effect

  // --- Actions ---
  const handleViewResults = () => {
    navigate(`/extraction-results/${batchId}`); // Navigate to a results page
  };

  const handleCancel = () => {
    // In a real scenario, this would call an API to cancel the backend job
    console.log("Cancel requested (currently navigates back)");
    setIsProcessing(false); // Stop local simulation
    // setError("Extraction cancelled by user."); // Optionally set an error/status
    navigate(-1); // Go back to the previous page
  };

  const isCompleted = currentStepIndex === steps.length - 1;

  // --- Render ---
  return (
    <div className="flex-1 h-full px-2 py-6 md:p-6 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8 transition-all">

        <PageHeader title="Text Extraction Progress" showBackArrow={true} />

        <div className="mt-6 mb-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Processing Batch ID:
          </p>
           <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 break-all">
             {batchId}
           </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
                isCompleted ? 'bg-green-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-8">
            Overall Progress: {progress.toFixed(0)}%
        </div>


        {/* Steps Indicator */}
        <div className="space-y-4 mb-10">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompletedStep = index < currentStepIndex || isCompleted; // Mark all as complete if overall is complete

            return (
              <div key={step.key || index} className="flex items-center gap-3 md:gap-4">
                <div className="flex-shrink-0">
                  {isCompletedStep ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : isActive && isProcessing ? (
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                  )}
                </div>
                <div className={`text-sm md:text-base font-medium ${
                    isCompletedStep ? 'text-gray-700 dark:text-gray-300' :
                    isActive ? 'text-indigo-600 dark:text-indigo-400' :
                    'text-gray-400 dark:text-gray-500'
                }`}>
                  {step.name}
                  {isActive && isProcessing && "..."}
                </div>
              </div>
            );
          })}
        </div>

         {/* Error Display Area */}
         {error && (
             <div className="mb-6 p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-center">
                <p className="text-sm text-red-600 dark:text-red-300 flex items-center justify-center gap-2">
                    <FiAlertTriangle/> {error}
                </p>
            </div>
         )}


        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          {!isCompleted ? (
            <button
              onClick={handleCancel}
              disabled={!isProcessing} // Disable if already completed or cancelled
              className="w-full sm:w-auto px-6 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <XCircle size={18}/> Cancel Process
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate(`/batch/${batchId}`)} // Go back to batch details
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2"
              >
                 Back to Batch
              </button>
              <button
                onClick={handleViewResults}
                className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2"
              >
                 <Eye size={18}/> View Results
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtractTextPage;