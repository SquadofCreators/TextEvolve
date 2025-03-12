import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ArticleCard from '../components/ArticleCard';
import CategoryCard from '../components/CategoryCard';

const SupportPage = () => {
  const { darkMode } = useTheme();

  const popularArticles = [
    {
      id: 1,
      title: "Digitize Your Handwritten Letters",
      description:
        "Discover how TextEvolve converts handwritten letters into editable PDFs and Word documents for easy archiving.",
    },
    {
      id: 2,
      title: "Convert Old Diaries with Ease",
      description:
        "Learn how to preserve your memories by transforming vintage diaries into digital formats using TextEvolve.",
    },
    {
      id: 3,
      title: "Archive Historical Manuscripts",
      description:
        "Explore how libraries and museums use TextEvolve to digitize historical manuscripts for research and preservation.",
    },
  ];
  
  // Example data for categories
  const categories = [
    {
      id: 1,
      title: "Conversion Tutorials",
      description:
        "Step-by-step guides on converting handwritten documents into digital text using TextEvolve.",
      articleCount: 12,
    },
    {
      id: 2,
      title: "Best Practices & Tips",
      description:
        "Learn how to prepare your handwritten documents for accurate digitization with our expert tips.",
      articleCount: 8,
    },
    {
      id: 3,
      title: "Data Security & Compliance",
      description:
        "Understand how TextEvolve ensures the security and compliance of your digitized documents.",
      articleCount: 5,
    },
  ];
  

  return (
    <div className="bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-lg border-1 border-gray-200 dark:border-gray-700 transition-colors rounded-xl">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            TextEvolve Support & FAQ
          </h1>
          <p className="text-base sm:text-lg">
            Find answers to questions about the application and usage that can help you convert handwritten text into digital formats. What is the purpose of life.
          </p>
        </header>

        {/* Search Bar */}
        <div className="flex justify-center mb-6">
          <input
            type="text"
            placeholder="Search for articles..."
            className="w-full sm:w-2/3 md:w-1/2 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        {/* Popular Articles Section */}
        <section className="mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">
            Popular Articles
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularArticles.map((article) => (
              <ArticleCard
                key={article.id}
                title={article.title}
                description={article.description}
              />
            ))}
          </div>
        </section>

        {/* Categories Section */}
        <section className="space-y-8">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              title={category.title}
              description={category.description}
              articleCount={category.articleCount}
            />
          ))}
        </section>
      </div>
    </div>
  );
};

export default SupportPage;
