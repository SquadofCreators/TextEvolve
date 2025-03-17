// src/pages/Documentation.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/utility/PageHeader";
import DesignedBy from "../components/DesignedBy";
import { FaChevronUp, FaArrowLeft } from "react-icons/fa6";
import TextEvolveLogo from "../assets/textevolve-logo.svg";

const translations = {
  en: {
    pageHeader: {
      title: "Documentation",
      heading: "Learn how to use TextEvolve",
      description:
        "Learn how to use TextEvolve effectively and discover all its features.",
    },
    overview: {
      title: "Overview",
      text: "TextEvolve is a cutting-edge solution for converting handwritten or scanned documents into searchable, editable digital formats. Using advanced OCR technology, it helps organizations digitize their archives, streamline data entry, and unlock valuable insights from historical records.",
    },
    gettingStarted: {
      title: "Getting Started",
      steps: [
        'Upload Documents: Navigate to the "Upload" page and drag or select your files (JPEG, PNG, PDF, or DOCX).',
        "Conversion Process: TextEvolve processes each file, extracting text using advanced OCR.",
        "Review & Download: Once conversion is complete, review the extracted text or download the converted file.",
      ],
    },
    advancedFeatures: {
      title: "Advanced Features",
      features: [
        "OCR Accuracy Reports: View detailed accuracy metrics on the Analytics page.",
        "Batch Processing: Upload multiple files at once to streamline document workflows.",
        "History & Logs: Track past conversions for easy reference and re-download.",
      ],
    },
    faq: {
      title: "Frequently Asked Questions",
      questions: [
        {
          q: "Which file formats are supported?",
          a: "TextEvolve supports JPEG, PNG, PDF, and DOCX.",
        },
        {
          q: "Can I process multiple files at once?",
          a: "Yes. Simply select or drag multiple files on the Upload page.",
        },
        {
          q: "How accurate is the OCR?",
          a: "Accuracy depends on the quality of the source images, but our advanced OCR models can achieve up to 98% accuracy.",
        },
      ],
    },
    additionalResources: {
      title: "Additional Resources",
      text: "For more detailed information, visit our official documentation or contact our Support team.",
    },
    backToHome: "Back to Home",
  },
  ta: {
    pageHeader: {
      title: "ஆவண குறிப்புகள்",
      heading: "TextEvolve ஐ பயன்படுத்துவது எப்படி என்பதை கற்றுக்கொள்ளுங்கள்",
      description:
        "TextEvolve ஐ திறமையாக பயன்படுத்துவது எப்படி மற்றும் அதன் அனைத்து அம்சங்களையும் கண்டறியுங்கள்.",
    },
    overview: {
      title: "மேலோட்டம்",
      text: "TextEvolve என்பது கையால் எழுதப்பட்ட அல்லது ஸ்கேன் செய்யப்பட்ட ஆவணங்களை தேடக்கூடிய, திருத்தக்கூடிய டிஜிட்டல் வடிவங்களில் மாற்றுவதற்கான முன்னணி தீர்வு ஆகும். மேம்பட்ட OCR தொழில்நுட்பத்தை பயன்படுத்தி, இது நிறுவனங்களுக்கு தங்களின் களஞ்சியங்களை டிஜிட்டல் செய்ய, தரவு உள்ளீட்டை மேம்படுத்த மற்றும் வரலாற்று ஆவணங்களில் உள்ள மதிப்புமிக்க உள்ளடக்கங்களை வெளியிட உதவுகிறது.",
    },
    gettingStarted: {
      title: "தொடக்கம்",
      steps: [
        'ஆவணங்களைப் பதிவேற்றவும்: பதிவேற்ற பக்கத்திற்கு செல்லவும் மற்றும் உங்கள் கோப்புகளை (JPEG, PNG, PDF, அல்லது DOCX) இழுத்து அல்லது தேர்வு செய்யவும்.',
        "மாற்று செயல்முறை: TextEvolve ஒவ்வொரு கோப்பையும் மேம்பட்ட OCR-ஐ பயன்படுத்தி, உரையைப் பிரித்தெடுக்க செயலாக்குகிறது.",
        "பரிசீலனை மற்றும் பதிவிறக்கம்: மாற்று செயல்முறை முடிந்ததும், பிரிக்கப்பட்ட உரையை பரிசீலிக்கவோ அல்லது மாற்றப்பட்ட கோப்பை பதிவிறக்கம் செய்யவோ முடியும்.",
      ],
    },
    advancedFeatures: {
      title: "மேம்பட்ட அம்சங்கள்",
      features: [
        "OCR துல்லியம் அறிக்கைகள்: ஆனாலிடிக்ஸ் பக்கத்தில் விரிவான துல்லியம் அளவுகோல்களை காணுங்கள்.",
        "தொகுப்பு செயலாக்கம்: ஆவணங்களின் வேலைவெளிகளை ஒழுங்குபடுத்த, ஒரே நேரத்தில் பல கோப்புகளை பதிவேற்றுங்கள்.",
        "வரலாறு மற்றும் பதிவு: எளிதில் குறிப்பு எடுக்க மற்றும் மீண்டும் பதிவிறக்கம் செய்ய, கடந்த மாற்றுகளை பின்தொடருங்கள்.",
      ],
    },
    faq: {
      title: "அடிக்கடி கேட்கப்படும் கேள்விகள்",
      questions: [
        {
          q: "எந்த கோப்பு வடிவங்களை ஆதரிக்கிறது?",
          a: "TextEvolve JPEG, PNG, PDF மற்றும் DOCX வடிவங்களை ஆதரிக்கிறது.",
        },
        {
          q: "ஒரே நேரத்தில் பல கோப்புகளை செயலாக்க முடியுமா?",
          a: "ஆம். பதிவேற்ற பக்கத்தில் பல கோப்புகளை தேர்வு அல்லது இழுத்து பயன்படுத்துங்கள்.",
        },
        {
          q: "OCR எவ்வளவு துல்லியமானது?",
          a: "துல்லியம், மூலப் படங்களின் தரத்தின் அடிப்படையில் இருக்கும், ஆனால் எங்கள் மேம்பட்ட OCR மாதிரிகள் 98% வரை துல்லியம் அடையக்கூடியவை.",
        },
      ],
    },
    additionalResources: {
      title: "கூடுதல் வளங்கள்",
      text: "மேலும் விரிவான தகவலுக்கு, எங்கள் அதிகாரப்பூர்வ ஆவணங்களைப் பார்க்கவும் அல்லது எங்கள் ஆதரவு குழுவைத் தொடர்பு கொள்ளவும்.",
    },
    backToHome: "முகப்புக்கு திரும்பு",
  },
};

function Documentation() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [language, setLanguage] = useState("en");

  // Shortcut for current translations
  const t = translations[language];

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
          title={t.pageHeader.title}
          heading={t.pageHeader.heading}
          description={t.pageHeader.description}
          link="/"
        />

        {/* Language Toggle Bar */}
        <div className="flex justify-end mb-4 space-x-2">
          <button
            onClick={() => setLanguage("en")}
            className={`px-4 py-2 rounded ${
              language === "en"
                ? "bg-orange-500 text-white"
                : "border border-orange-500 text-orange-500"
            } transition-colors`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage("ta")}
            className={`px-4 py-2 rounded ${
              language === "ta"
                ? "bg-orange-500 text-white"
                : "border border-orange-500 text-orange-500"
            } transition-colors`}
          >
            தமிழ்
          </button>
        </div>

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
              {t.overview.title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              {t.overview.text}
            </p>
          </section>

          {/* Getting Started */}
          <section>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
              {t.gettingStarted.title}
            </h2>
            <ol className="list-decimal list-inside text-lg text-gray-600 dark:text-gray-300 leading-relaxed space-y-3">
              {t.gettingStarted.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </section>

          {/* Advanced Features */}
          <section>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
              {t.advancedFeatures.title}
            </h2>
            <ul className="list-disc list-inside text-lg text-gray-600 dark:text-gray-300 leading-relaxed space-y-3">
              {t.advancedFeatures.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
              {t.faq.title}
            </h2>
            <div className="space-y-6">
              {t.faq.questions.map((item, index) => (
                <div key={index}>
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                    Q: {item.q}
                  </p>
                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    A: {item.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Additional Resources */}
          <section>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
              {t.additionalResources.title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              {t.additionalResources.text.split("official documentation")[0]}
              <a
                href="https://docs.example.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:underline transition-colors"
              >
                official documentation
              </a>
              {t.additionalResources.text.split("official documentation")[1] ||
                " "}
              or{" "}
              <Link
                to="/support"
                className="text-orange-500 hover:underline transition-colors"
              >
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
              <FaArrowLeft className="inline-flex mb-0.5 mr-1" /> {t.backToHome}
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
