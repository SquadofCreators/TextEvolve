import React, { useState, useMemo } from 'react';
// Link is only used for the Contact Support button now
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext'; // Adjust path if necessary
import ArticleCard from '../components/ArticleCard'; // Use updated path
import CategoryCard from '../components/CategoryCard'; // Use updated path
import TopicHubCard from '../components/TopicHubCard'; // Import the new Hub Card
import PageHeader from '../components/utility/PageHeader'; // Adjust path if necessary
import {
  FiSearch, FiLifeBuoy, FiSettings, FiShield, FiAlertCircle,
  FiHelpCircle, FiArrowRight, FiPlayCircle, FiEdit, FiDatabase, FiFileText
} from "react-icons/fi";

// --- Mock Data Definitions ---
const allArticlesData = [
    // ... (data remains the same)
  { id: 1, slug: "/", title: "Digitize Your Handwritten Letters", description: "Discover how TextEvolve converts handwritten letters into editable PDFs and Word documents for easy archiving.", categoryId: 1, lastUpdated: "2025-04-15", popular: true },
  { id: 2, slug: "/", title: "Convert Old Diaries with Ease", description: "Learn how to preserve your memories by transforming vintage diaries into digital formats using TextEvolve.", categoryId: 1, lastUpdated: "2025-04-10", popular: true },
  { id: 3, slug: "/", title: "Archive Historical Manuscripts", description: "Explore how libraries and museums use TextEvolve to digitize historical manuscripts for research and preservation.", categoryId: 1, lastUpdated: "2025-04-05", popular: true },
  { id: 4, slug: "/", title: "Improving OCR Accuracy", description: "Tips for scanning and preparing documents to get the best text recognition results from TextEvolve.", categoryId: 2, lastUpdated: "2025-04-12" },
  { id: 5, slug: "/", title: "Supported File Formats", description: "A comprehensive list of image and document formats TextEvolve can process.", categoryId: 1, lastUpdated: "2025-03-28" },
  { id: 6, slug: "/", title: "Understanding PDF Output Options", description: "Learn about searchable PDFs, PDF/A, and other formats TextEvolve can create.", categoryId: 1, lastUpdated: "2025-04-01" },
  { id: 7, slug: "/", title: "How Your Data is Secured", description: "Details on the encryption methods used by TextEvolve to protect your documents during processing and storage.", categoryId: 3, lastUpdated: "2025-04-16" },
  { id: 8, slug: "/", title: "TextEvolve and GDPR Compliance", description: "Information about how TextEvolve helps you meet General Data Protection Regulation requirements.", categoryId: 3, lastUpdated: "2025-03-20" },
  { id: 9, slug: "/", title: "Integrating TextEvolve with Your App (API)", description: "Technical documentation for developers looking to use the TextEvolve API.", categoryId: 4, lastUpdated: "2025-04-14" },
  { id: 10, slug: "/", title: "Troubleshooting Upload Errors", description: "Common solutions for issues encountered when uploading files to TextEvolve.", categoryId: 4, lastUpdated: "2025-04-08" },
  { id: 11, slug: "/", title: "Getting Started with TextEvolve", description: "A step-by-step walkthrough for new users, from first upload to final output.", categoryId: 5, lastUpdated: "2025-04-17", popular: true },
];

const categoriesData = [
    // ... (data remains the same)
  { id: 5, slug: "/", title: "Getting Started", description: "New to TextEvolve? Start here for essential guides and setup information.", articleCount: 1, icon: FiPlayCircle, keyArticles: [ { slug: 'getting-started-textevolve', title: 'Step-by-Step Guide' } ] },
  { id: 1, slug: "/", title: "Conversion Process & Features", description: "Guides on converting documents, features like PDF/Word output, and understanding OCR.", articleCount: 4, icon: FiEdit, keyArticles: [ { slug: 'digitize-handwritten-letters', title: 'Digitize Letters' }, { slug: 'understanding-pdf-options', title: 'PDF Output Options' }, { slug: 'supported-file-formats', title: 'Supported Formats' } ] },
  { id: 2, slug: "/", title: "Best Practices & Preparation", description: "Prepare documents for accurate digitization and get the most out of TextEvolve.", articleCount: 1, icon: FiSettings, keyArticles: [ { slug: 'ocr-accuracy-tips', title: 'Improving OCR Accuracy' } ] },
  { id: 3, slug: "/", title: "Data Security & Compliance", description: "How TextEvolve ensures the security, privacy, and compliance of your documents.", articleCount: 2, icon: FiShield, keyArticles: [ { slug: 'data-encryption', title: 'How Data is Secured' }, { slug: 'gdpr-compliance', title: 'GDPR Information' } ] },
  { id: 4, slug: "/", title: "Troubleshooting & API", description: "Solutions for common issues and developer resources for API integration.", articleCount: 2, icon: FiAlertCircle, keyArticles: [ { slug: 'troubleshooting-uploads', title: 'Upload Errors' }, { slug: 'api-integration-guide', title: 'API Guide' } ] },
  { id: 6, slug: "/", title: "Account & Billing", description: "Manage your subscription, update payment details, and view invoices.", articleCount: 0, icon: FiDatabase, keyArticles: [] },
];

// --- Helper Functions ---
const highlightText = (text, query) => {
  if (!query || !text) {
    return text;
  }
  const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-orange-200 dark:bg-orange-400/50 text-black dark:text-white rounded px-0.5 py-0">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return dateString;
  }
};


// --- The Main Support Page Component ---
const SupportPage = () => {
  const { darkMode } = useTheme(); // darkMode state from context
  const [searchQuery, setSearchQuery] = useState('');

  // --- Memoized Filtering Logic ---
  const searchResults = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return { articles: [], categories: [] };

    const lowerCaseQuery = trimmedQuery.toLowerCase();

    const filteredArticles = allArticlesData.filter(article =>
      article.title.toLowerCase().includes(lowerCaseQuery) ||
      article.description.toLowerCase().includes(lowerCaseQuery)
    );

    const filteredCategories = categoriesData.filter(category =>
      category.title.toLowerCase().includes(lowerCaseQuery) ||
      category.description.toLowerCase().includes(lowerCaseQuery)
    );

    return { articles: filteredArticles, categories: filteredCategories };
  }, [searchQuery]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  return (
    // Using dark: prefixes for base styles
    <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-300 transition-colors duration-300 ease-in-out">
      <div className="px-4 sm:px-6 lg:px-8 py-12">

        {/* Header & Search Bar */}
        <div className="text-center mb-12">
          {/* PageHeader component assumed to handle its own internal dark styling */}
          <PageHeader
            title="Support Center"
            link="/"
            heading="How can we help?"
            description="Search for specific issues or explore topics to find solutions."
          />
        </div>
        <div className="relative mb-16 flex justify-center">
          <div className="relative w-full sm:w-3/4 md:w-2/3 lg:w-1/2">
            <input
              type="search"
              placeholder="Search help articles (e.g., 'PDF conversion', 'security')"
              value={searchQuery}
              onChange={handleSearchChange}
              aria-label="Search support articles and categories"
              // Consistent dark: prefixes for input styling
              className="w-full pl-12 pr-4 py-3 text-base border rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors duration-300 ease-in-out
                         bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-orange-500 focus:border-orange-600 focus:ring-offset-gray-50
                         dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:ring-orange-500 dark:focus:border-orange-600 dark:focus:ring-offset-gray-900"
            />
            {/* Consistent dark: prefix for icon */}
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 pointer-events-none text-gray-400 dark:text-gray-500" />
          </div>
        </div>


        {/* --- Main Content Area --- */}
        {searchQuery ? (
          // ===== SEARCH RESULTS VIEW =====
          <section className="space-y-10">
            {/* Consistent dark: prefixes for heading */}
            <h2 className="text-2xl font-semibold text-center sm:text-left border-b pb-3 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
              Search Results for "{searchQuery}"
            </h2>

            {/* Matching Articles */}
            {searchResults.articles.length > 0 && (
              <div>
                {/* Consistent dark: prefix for subheading */}
                <h3 className="text-xl font-medium mb-4 text-gray-700 dark:text-gray-300">Matching Articles</h3>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {searchResults.articles.map((article) => (
                    <div
                      key={`search-article-${article.id}`}
                      // Consistent dark: prefix for focus ring offset
                      className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 dark:focus-visible:ring-offset-gray-900"
                      aria-label={article.title}
                    >
                      {/* ArticleCard handles its internal dark styling */}
                      <ArticleCard
                        title={highlightText(article.title, searchQuery)}
                        description={highlightText(article.description, searchQuery)}
                        footerText={`Updated: ${formatDate(article.lastUpdated)}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

             {/* Matching Categories */}
            {searchResults.categories.length > 0 && (
              <div>
                 {/* Consistent dark: prefix for subheading */}
                <h3 className="text-xl font-medium mb-4 text-gray-700 dark:text-gray-300">Related Topics</h3>
                <div className="space-y-4">
                  {searchResults.categories.map((category) => {
                    const CategoryIconComponent = category.icon || FiHelpCircle;
                    const categoryIconElement = <CategoryIconComponent className="h-5 w-5" />;
                    return (
                      <div
                        key={`search-cat-${category.id}`}
                         // Consistent dark: prefix for focus ring offset
                        className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 dark:focus-visible:ring-offset-gray-900"
                        aria-label={category.title}
                      >
                         {/* CategoryCard handles its internal dark styling */}
                        <CategoryCard
                          icon={categoryIconElement}
                          title={highlightText(category.title, searchQuery)}
                          description={highlightText(category.description, searchQuery)}
                          articleCount={category.articleCount}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Results Found */}
            {searchResults.articles.length === 0 && searchResults.categories.length === 0 && (
                // Consistent dark: prefixes for no results section
                <div className="text-center py-16 px-6 rounded-lg bg-gray-100 dark:bg-gray-800/50">
                  <FiHelpCircle className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-6" />
                  <p className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">No Results Found</p>
                  <p className="max-w-md mx-auto text-gray-600 dark:text-gray-400">
                    We couldn't find anything matching "{searchQuery}". Please try different keywords or explore the topics below.
                  </p>
              </div>
            )}
          </section>

        ) : (
          // ===== DEFAULT VIEW (TOPIC HUBS) =====
          <section>
             {/* Consistent dark: prefix for heading */}
            <h2 className="text-2xl sm:text-3xl font-bold mb-10 text-center sm:text-left text-gray-900 dark:text-gray-100">
              Explore Topics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {categoriesData.map((category) => (
                 // TopicHubCard handles its internal dark styling
                <TopicHubCard
                  key={category.id}
                  icon={category.icon}
                  title={category.title}
                  description={category.description}
                  // categorySlug prop removed as per previous request
                />
              ))}
            </div>
          </section>
        )}

        {/* Contact Support Section */}
         <section className="mt-12 sm:mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
             {/* Consistent dark: prefixes for contact section */}
            <div className="rounded-lg p-6 text-center bg-orange-50 dark:bg-gray-800">
                <FiLifeBuoy className="h-10 w-10 mx-auto mb-3 text-orange-600 dark:text-orange-400" />
                <h2 className="text-lg sm:text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">Can't find what you're looking for?</h2>
                <p className="mb-4 text-gray-600 dark:text-gray-400">
                    Our support team is here to help. Reach out to us for further assistance.
                </p>
                <Link
                    // to="/contact"
                    // Consistent dark: prefixes for button
                    className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2
                               bg-orange-500 hover:bg-orange-600 focus:ring-orange-500 focus:ring-offset-orange-50
                               dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-500 dark:focus:ring-offset-gray-800"
                >
                    Contact Support
                </Link>
            </div>
        </section>

      </div>
    </div>
  );
};

export default SupportPage;