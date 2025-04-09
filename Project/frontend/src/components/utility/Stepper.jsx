import React from "react";
import { IoCheckmark } from "react-icons/io5";
import { XCircle, AlertTriangle } from "lucide-react";

const Stepper = ({ steps, currentStep, status }) => {
  return (
    <div className="relative flex justify-between items-center mb-10">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const hasError = isCurrent && status === "error";
        const hasWarning = isCurrent && status === "warning";

        return (
          <div key={index} className="relative flex-1 flex flex-col items-center">
            {index !== 0 && (
              <div
                className={`absolute -left-12 top-6 -z-0 w-full h-1 transition-all ${
                  isCompleted ? "bg-green-500" : "bg-gray-300"
                }`}
              ></div>
            )}

            {/* Step Icon */}
            <div
              className={`relative w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all shadow-md
                ${
                  isCompleted
                    ? "border-green-500 bg-green-100 text-green-600"
                    : isCurrent
                    ? "border-blue-500 bg-blue-100 text-blue-600"
                    : "border-gray-300 bg-gray-200 text-gray-500"
                }
                `}
            >
              {hasError ? (
                <XCircle className="text-red-600 text-2xl" />
              ) : hasWarning ? (
                <AlertTriangle className="text-yellow-600 text-2xl" />
              ) : isCompleted ? (
                <IoCheckmark className="text-green-600 text-2xl" />
              ) : (
                <step.icon className="w-6 h-6" />
              )}
            </div>

            {/* Step Labels */}
            <p
              className={`mt-2 text-sm font-medium ${
                isCurrent ? "text-black" : "text-gray-500"
              }`}
            >
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default Stepper;
