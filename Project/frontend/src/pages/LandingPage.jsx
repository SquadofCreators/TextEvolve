import React, { useState, useEffect, useRef } from 'react';
import BannerImg from '../assets/images/banner-bg.jpg';

// Logos
import TNLogo from '../assets/images/logos/tn-logo.svg';
import NMLogo from '../assets/images/logos/nm-logo.svg';
import NTLogo from '../assets/images/logos/nt-logo.svg';
import AULogo from '../assets/images/logos/au-logo.svg';
import { useTheme } from '../contexts/ThemeContext';

import docData from '../data/DocData';
import DocCard from '../components/DocCard';

function LandingPage() {
  const { darkMode } = useTheme();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Logos Data
  const bannerLogos = [
    {
      name: 'Tamil Nadu Govt.',
      logo: TNLogo,
      link: 'https://www.tn.gov.in/',
    },
    {
      name: 'Naan Mudhalvan',
      logo: NMLogo,
      link: 'https://naanmudhalvan.tn.gov.in/',
    },
    {
      name: 'Niral Thiruvizha',
      logo: NTLogo,
      link: 'https://niralthiruvizha.in/',
    },
    {
      name: 'Anna University',
      logo: AULogo,
      link: 'https://www.annauniv.edu/',
    },
  ];

  // Dropdown State
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const filters = ['All', 'Recent', 'Oldest', 'Favorites'];

  // Handle filter selection
  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
    setDropdownOpen(false);
    console.log(`Filter applied: ${filter}`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className='pb-12'>
      {/* Banner Image */}
      <div className="relative rounded-xl overflow-hidden border border-gray-700 dark:border-none select-none">
        <img
          src={BannerImg}
          alt="Banner Image"
          className="object-cover w-full h-64 shadow-lg"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-around py-6 gap-3 text-gray-800 dark:text-gray-200">
          {/* Logos */}
          <div className="flex items-center gap-8">
            {bannerLogos.map((logo, index) => (
              <a
                key={index}
                href={logo.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center"
              >
                <img
                  src={logo.logo}
                  alt={logo.name}
                  className="w-10 h-10 md:w-12 md:h-12 cursor-pointer"
                />
              </a>
            ))}
          </div>

          <h1 className="text-center text-2xl md:text-4xl font-bold text-gray-800">
            Digitize <span className="text-orange-500">History,</span> <br />
            Empower the Future
          </h1>

          <p className="hidden md:block text-base text-gray-500 text-center break-words max-w-2xl">
            Transform your handwritten records and archival documents into accessible, searchable digital formats with our advanced AI-powered OCR solution.
          </p>
        </div>
      </div>

      {/* Recent Files + Dropdown */}
      <div className="flex items-center px-1 mt-10">
        <p className="text-gray-800 dark:text-gray-300">Recent Files</p>

        {/* Dropdown Filter */}
        <div className="relative inline-block text-left ml-auto" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`inline-flex justify-center w-full px-4 py-2 text-sm font-medium border rounded-md shadow-sm ${
              darkMode
                ? 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            } cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            {selectedFilter}
            <svg
              className={`ml-2 -mr-1 h-5 w-5 transition-transform ${
                dropdownOpen ? 'rotate-180' : 'rotate-0'
              }`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.72-3.71a.75.75 0 011.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              className={`origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg z-10 transition-opacity ${
                darkMode
                  ? 'bg-gray-800 ring-1 ring-gray-700'
                  : 'bg-white ring-1 ring-black ring-opacity-5'
              }`}
            >
              <div className="py-1">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleFilterSelect(filter)}
                    className={`block px-4 py-2 text-sm w-full text-left cursor-pointer transition-colors ${
                      darkMode
                        ? 'text-gray-200 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    } ${
                      selectedFilter === filter
                        ? darkMode
                          ? 'bg-gray-700'
                          : 'bg-gray-200'
                        : ''
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Cards */}
      <div className="flex flex-wrap gap-4 px-1 mt-6">
        {docData.map((data) => (
          <DocCard key={data.uniqueId} data={data} />
        ))}
        {/* Pagination */}
        <div className="w-full flex items-center justify-center mt-6 md:col-span-3">
          <button
            className="px-4 py-1.5 rounded-full bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors cursor-pointer"
          >
            Load More
          </button>
        </div>
      </div>

    </div>
  );
}

export default LandingPage;
