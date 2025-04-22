// src/pages/DocumentationPage.jsx

import React, { useState, useEffect, createContext, useContext, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom"; // Only needed for 'Back to App' link now
import { FaChevronUp, FaArrowLeft } from "react-icons/fa6";
import {
    FiBookOpen, FiPlayCircle, FiZap, FiHelpCircle, FiCode, FiTool, FiTerminal,
    FiKey, FiAlertTriangle, FiInfo, FiCopy, FiCheck, FiCamera, FiUploadCloud, FiXCircle, FiUser, FiImage,
    FiFileText, FiFile // Added missing File icons
} from "react-icons/fi";
import { motion } from 'framer-motion';

// Import Translations (Keep this separate for organization)
import { translations } from "../data/docTranslations"; // Adjust path if needed

// --- Language Context ---
const LanguageContext = createContext(["en", () => {}]); // Provide default value structure
const useLanguage = () => useContext(LanguageContext);

// --- Helper: Slugify Title ---
// Creates a URL-friendly slug from a string
const createSlug = (title = '') => {
    if (!title) return `section-${Math.random().toString(36).substring(7)}`; // Fallback ID
    return title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except space/hyphen
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single
};

// --- Helper: Simple Markdown Link Renderer ---
function SimpleMarkdownLink({ text = "" }) {
    // Basic regex to find [text](url) - won't handle complex/nested cases
    const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
    return (
        <>
            {parts.map((part, index) => {
                const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
                if (match) {
                    const linkText = match[1];
                    const url = match[2];
                    const isExternal = url.startsWith('http') || url.startsWith('mailto');
                    if (isExternal) {
                        return <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">{linkText}</a>;
                    } else if (url.startsWith('#')) {
                         // Internal hash link - let default behavior handle scrolling now
                         return <a key={index} href={url} className="text-orange-600 dark:text-orange-400 hover:underline font-medium">{linkText}</a>;
                    } else {
                        // Internal app link (use React Router Link if appropriate outside docs)
                        return <Link key={index} to={url} className="text-orange-600 dark:text-orange-400 hover:underline font-medium">{linkText}</Link>;
                    }
                }
                // Return plain text parts, ensuring keys are unique enough
                return <React.Fragment key={`${index}-${part?.substring(0, 10)}`}>{part}</React.Fragment>;
            })}
        </>
    );
};

// --- Helper: Docs Section Wrapper ---
// Now accepts sectionId directly
const DocsSection = ({ sectionId, title, children, className = "" }) => {
    return (
        <section id={sectionId} className={`mb-12 md:mb-16 scroll-mt-20 ${className}`}>
            {title && (
                // Main section headings are h2
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-6 pb-2 border-b border-gray-300 dark:border-gray-700">
                    {title}
                </h2>
            )}
             {/* Apply prose styling for content within the section */}
            <div className="prose prose-base md:prose-lg dark:prose-invert max-w-none prose-orange dark:prose-orange prose-a:font-medium hover:prose-a:underline prose-headings:scroll-mt-20 prose-headings:font-semibold dark:prose-headings:text-gray-200 prose-code:before:content-none prose-code:after:content-none prose-code:bg-orange-100/50 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-normal prose-li:marker:text-orange-500">
                {children}
            </div>
        </section>
    );
};

// --- Helper: Code Block Component ---
function CodeBlock({ children, className = "" }) {
    const [isCopied, setIsCopied] = useState(false);
    const codeRef = useRef(null);
    const handleCopy = useCallback(async () => {
        if (codeRef.current?.textContent) {
            try {
                await navigator.clipboard.writeText(codeRef.current.textContent);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch (err) { console.error('Copy failed:', err); alert('Copy failed.'); }
        }
    }, []);

    return (
        <div className={`relative group my-6 ${className}`}>
            <pre className="block whitespace-pre p-4 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-gray-100 overflow-x-auto shadow-inner scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
                <code ref={codeRef}>{children}</code>
            </pre>
            <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 bg-gray-300 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 hover:bg-gray-400 dark:hover:bg-gray-600" aria-label={isCopied ? "Copied!" : "Copy code"}>
                {isCopied ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
            </button>
        </div>
    );
}

// --- Helper: Callout Component ---
function Callout({ type = 'note', title, children }) {
    const styles = {
        note: { icon: FiInfo, bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-500 dark:border-blue-600', title: 'text-blue-900 dark:text-blue-200', text: 'text-blue-800 dark:text-blue-300', iconColor: 'text-blue-600 dark:text-blue-400' },
        warning: { icon: FiAlertTriangle, bg: 'bg-yellow-50 dark:bg-yellow-900/30', border: 'border-yellow-500 dark:border-yellow-600', title: 'text-yellow-900 dark:text-yellow-200', text: 'text-yellow-800 dark:text-yellow-300', iconColor: 'text-yellow-600 dark:text-yellow-400' },
        tip: { icon: FiZap, bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-500 dark:border-green-600', title: 'text-green-900 dark:text-green-200', text: 'text-green-800 dark:text-green-300', iconColor: 'text-green-600 dark:text-green-400' },
        danger: { icon: FiAlertTriangle, bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-500 dark:border-red-600', title: 'text-red-900 dark:text-red-200', text: 'text-red-800 dark:text-red-300', iconColor: 'text-red-600 dark:text-red-400' },
    };
    const selectedStyle = styles[type] || styles.note;
    const Icon = selectedStyle.icon;
    return (
        <div className={`my-6 p-4 rounded-lg border-l-4 shadow-sm ${selectedStyle.bg} ${selectedStyle.border}`}>
            <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex-shrink-0 ${selectedStyle.iconColor}`}> <Icon className="w-5 h-5" /> </div>
                <div>
                    {title && <h4 className={`text-base font-semibold mb-1 ${selectedStyle.title}`}>{title}</h4>}
                    {/* Apply base text styles, let prose handle internal formatting */}
                    <div className={`text-sm ${selectedStyle.text}`}>{children}</div>
                </div>
            </div>
        </div>
    );
}

// --- Helper: Right TOC Component ---
function RightSidebarTOC({ headings = [], activeId }) {
    const handleTocClick = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
             const headerOffset = 80; // Sticky header height compensation
             const elementPosition = element.getBoundingClientRect().top;
             const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
             window.scrollTo({ top: offsetPosition, behavior: "smooth" });
             window.history.pushState(null, null, `#${id}`); // Update hash
        }
    };

    if (headings.length === 0) { return null; }

    return (
        <nav className="w-64 flex-shrink-0 hidden xl:block sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pl-10 pb-10 text-sm">
             <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3 uppercase tracking-wider">On this page</h4>
            <ul className="space-y-2 border-l border-gray-200 dark:border-gray-700">
                {headings.map((heading) => (
                    // Indent based on level (h2=level 2, h3=level 3)
                    <li key={heading.id} style={{ paddingLeft: `${Math.max(0, heading.level - 2) * 1}rem` }} className="ml-[-1px]">
                        <a
                            href={`#${heading.id}`}
                            onClick={(e) => handleTocClick(e, heading.id)}
                            className={`block border-l pl-4 py-1 transition-colors duration-150 ${
                                activeId === heading.id // Use activeId passed from parent
                                    ? 'border-orange-500 dark:border-orange-400 text-orange-600 dark:text-orange-400 font-semibold'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}


// --- Section Content Components (Defined Inline) ---

function OverviewSection() {
    const [language] = useLanguage();
    const t = translations[language].overview;
    // sectionId uses the key defined in sidebarSections map below
    return ( <DocsSection sectionId="overview" title={t.title}><p className="lead">{t.text}</p><p className="mt-4 text-base italic text-gray-600 dark:text-gray-400">{t.capabilities}</p></DocsSection> );
}

function GettingStartedSection() {
    const [language] = useLanguage();
    const t = translations[language].gettingStarted;
    return (
        <DocsSection sectionId="getting-started" title={t.title}>
            <ol className="list-decimal !pl-5 space-y-5">
                {t.steps.map((step, index) => (
                    <li key={index} className="pl-2">
                         <strong className="block font-semibold text-gray-800 dark:text-gray-100">{step.title}</strong>
                         <span className="text-gray-700 dark:text-gray-300"><SimpleMarkdownLink text={step.content} /></span>
                    </li>
                ))}
            </ol>
            {/* Placeholder for Video - replace with actual video embed if available */}
            <Callout type="tip" title="Quick Start Video">
                 <p className="flex items-center justify-center gap-2">{t.videoPlaceholder}</p>
                  {/* Example embed: <iframe width="560" height="315" src="YOUR_VIDEO_URL" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe> */}
            </Callout>
        </DocsSection>
    );
}

function AdvancedFeaturesSection() {
     const [language] = useLanguage();
     const t = translations[language].advancedFeatures;
     return (
         <DocsSection sectionId="features-and-usage" title={t.title}>
             <div className="space-y-8">
                 {t.features.map((feature, index) => (
                     <div key={feature.id || index} id={feature.id || createSlug(feature.title)} className="scroll-mt-20">
                         {/* Use H3 for sub-sections */}
                         <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">{feature.title}</h3>
                         <p className="text-base text-gray-700 dark:text-gray-300"><SimpleMarkdownLink text={feature.content} /></p>
                     </div>
                 ))}
             </div>
             <Callout type="note" title="Continuous Improvement">
                 We are constantly working on enhancing TextEvolve. Check back for new features and improvements!
             </Callout>
         </DocsSection>
     );
 }

function FaqSection() {
    const [language] = useLanguage();
    const t = translations[language].faq;
    return (
        <DocsSection sectionId="faq" title={t.title}>
            <div className="space-y-6">
                {t.questions.map((item, index) => (
                    <div key={item.id || index} id={item.id || createSlug(item.q)} className="p-4 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 shadow-sm scroll-mt-20">
                         {/* Use H3 for questions */}
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-1.5">{item.q}</h3>
                        <p className="text-base text-gray-700 dark:text-gray-300"><SimpleMarkdownLink text={item.a} /></p>
                    </div>
                ))}
            </div>
        </DocsSection>
    );
}

function ApiReferenceSection() {
     const [language] = useLanguage();
     const t = translations[language].apiReference;
     const sectionIcons = { "Authentication": FiKey, "Rate Limits": FiAlertTriangle, "Key Endpoints": FiTerminal };

    return (
        <DocsSection sectionId="api-reference" title={t.title}>
            <p className="lead mb-8">{t.text}</p>
            <div className="space-y-10">
                {t.sections.map(sec => {
                    const Icon = sectionIcons[sec.title] || FiTerminal;
                    // Use explicitly defined ID or generate one
                    const sectionId = sec.id || createSlug(sec.title);
                    return (
                        <div key={sec.title} id={sectionId} className="scroll-mt-20">
                             <h3 className="flex items-center gap-2 text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100 border-t border-gray-200 dark:border-gray-700 pt-6">
                                 <Icon className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" /> {sec.title}
                            </h3>
                             {/* Ensure SimpleMarkdownLink is used correctly */}
                             <div className="ml-7 text-base"><SimpleMarkdownLink text={sec.content} /></div>
                        </div> );
                })}
            </div>
            <Callout type="warning" title="API Key Security">Treat your API keys like passwords! Do not expose them client-side. Store and use them securely on your backend servers.</Callout>
             <div className="mt-10 scroll-mt-20" id="example-request">
                 <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 border-t border-gray-200 dark:border-gray-700 pt-6">Example Request</h3>
                 <CodeBlock>{t.codeExamplePlaceholder}</CodeBlock>
             </div>
            <Callout type="note" title="Coming Soon">{t.comingSoon}</Callout>
        </DocsSection>
    );
}

function TroubleshootingSection() {
    const [language] = useLanguage();
    const t = translations[language].troubleshooting;
    return (
        <DocsSection sectionId="troubleshooting" title={t.title}>
            <div className="space-y-6 mb-8">
                {t.commonIssues.map((item, index) => (
                    <div key={item.id || index} id={item.id || createSlug(item.issue)} className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 scroll-mt-20">
                         {/* Use H3 for issues */}
                         <h3 className="font-semibold text-lg text-yellow-900 dark:text-yellow-200 mb-1">{item.issue}</h3>
                         <p className="text-yellow-800 dark:text-yellow-300"><SimpleMarkdownLink text={item.solution} /></p>
                     </div>
                ))}
            </div>
            <p><SimpleMarkdownLink text={t.linkToSupport} /></p>
        </DocsSection>
    );
}


// --- Main Documentation Layout Component ---
function DocumentationPage() {
    const [language, setLanguage] = useState("en");
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState(''); // Start empty, let scrollspy set it
    const [headingsForTOC, setHeadingsForTOC] = useState([]);
    const mainContentRef = useRef(null);

    const t = translations[language];

    // Define sidebar structure using slugs for keys
    const sidebarSections = useMemo(() => [
        { key: 'overview', title: t.sidebar.overview, icon: FiBookOpen },
        { key: 'getting-started', title: t.sidebar.gettingStarted, icon: FiPlayCircle },
        { key: 'features-and-usage', title: t.sidebar.features, icon: FiZap }, // Matched slug for Features section title
        { key: 'faq', title: t.sidebar.faq, icon: FiHelpCircle },
        { key: 'api-reference', title: t.sidebar.api, icon: FiCode },
        { key: 'troubleshooting', title: t.sidebar.troubleshooting, icon: FiTool },
    ], [t]);

    // --- Smooth Scroll for Links ---
    const handleLinkClick = useCallback((e, sectionId) => {
        e.preventDefault();
        const element = document.getElementById(sectionId);
        if (element) {
            const headerOffset = 80; // Adjust as needed
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            window.history.pushState(null, null, `#${sectionId}`); // Update hash
            setActiveSectionId(sectionId); // Set active immediately
        } else { console.warn(`Element with ID "${sectionId}" not found.`); }
    }, []);

    // --- Scroll Effects ---
    useEffect(() => { // Back to Top Button
        const handleScroll = () => setShowBackToTop(window.pageYOffset > 400);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => { // Scroll to hash on load/language change
        const initialHash = window.location.hash.replace('#', '');
        const element = document.getElementById(initialHash || sidebarSections[0]?.key || 'overview'); // Default to first section
        if (element) {
             const headerOffset = 80;
             const elementPosition = element.getBoundingClientRect().top;
             const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
             // Scroll instantly on load, smooth scrolling for clicks
             window.scrollTo({ top: offsetPosition, behavior: "auto" });
             setActiveSectionId(initialHash || sidebarSections[0]?.key || 'overview');
        } else {
            window.scrollTo(0, 0); // Scroll to top if no hash/element
            setActiveSectionId(sidebarSections[0]?.key || 'overview');
        }
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language]); // Only run on language change and initial mount


    // --- Dynamic Heading Extraction & Scrollspy ---
    useEffect(() => {
        if (!mainContentRef.current) return;

        // 1. Extract Headings for Right TOC
        const headingElements = mainContentRef.current.querySelectorAll('h2[id], h3[id]');
        const extractedHeadings = Array.from(headingElements).map(el => ({
            id: el.id,
            text: el.textContent || '',
            level: parseInt(el.tagName.substring(1), 10)
        })).filter(h => h.text && h.id);
        setHeadingsForTOC(extractedHeadings);

        // 2. Setup Intersection Observer for Scrollspy (Main Sections for Left Sidebar & Right TOC)
        const sectionElements = sidebarSections.map(sec => document.getElementById(sec.key)).filter(el => el);
        if (sectionElements.length === 0) return () => {}; // Ensure cleanup function is always returned

        const observerCallback = (entries) => {
            let currentActive = null;
            // Find the topmost intersecting entry within the top part of the viewport
            const intersectingEntries = entries.filter(entry => entry.isIntersecting);

            if (intersectingEntries.length > 0) {
                 // Sort by vertical position
                 intersectingEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                 currentActive = intersectingEntries[0].target.id; // Highlight the topmost visible section
            } else {
                 // If nothing is intersecting in the target zone, find the last one that was active above the zone
                 // Requires keeping track of previous active or more complex logic - keep it simple for now
                 // Maybe check which section's bottom edge is closest to the top margin
                 let closestAbove = null;
                 let minDistanceAbove = Infinity;
                 entries.forEach(entry => {
                     const distance = 80 - entry.boundingClientRect.bottom; // Distance above the -80px top margin
                     if (distance > 0 && distance < minDistanceAbove) {
                         minDistanceAbove = distance;
                         closestAbove = entry.target.id;
                     }
                 });
                 if(closestAbove) currentActive = closestAbove;
                 // else keep the last active ID? Handled by useState update conditional below
            }

            if (currentActive) {
                setActiveSectionId(currentActive);
            }
        };

        const observer = new IntersectionObserver(observerCallback, {
            rootMargin: "-80px 0px -50% 0px", // Top margin accounts for sticky header, bottom margin looks in upper half
            threshold: 0 // Trigger immediately
        });

        sectionElements.forEach(el => observer.observe(el));
        return () => sectionElements.forEach(el => { if(el) observer.unobserve(el); }); // Check el exists before unobserve

    }, [language, sidebarSections]); // Rerun if language changes or sidebar items change


    // --- Language Toggle Button ---
    const LanguageButton = ({ langCode, children }) => (
         <button onClick={() => setLanguage(langCode)}
             className={`px-2.5 py-1 rounded text-xs font-medium transition-colors duration-150 ease-in-out border ${language === langCode ? 'bg-orange-500 border-orange-500 text-white shadow-sm' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`} >
             {children}
         </button>
     );

    // --- Scroll to Top Function ---
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });


    // --- Render ---
    return (
        <LanguageContext.Provider value={[language, setLanguage]}>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

                {/* Sticky Header */}
                <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
                    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            {/* Use anchor link for title to scroll to top/overview */}
                            <Link to="/" className="text-xl font-bold text-gray-600 dark:text-orange-500 flex items-center gap-2">
                                <span className="flex items-center justify-center font-medium hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-150 ease-in-out">
                                    <FaArrowLeft className="md" /> 
                                </span>
                                 TextEvolve Docs
                            </Link>
                            <div className="flex items-center space-x-2">
                                <LanguageButton langCode="en">EN</LanguageButton>
                                <LanguageButton langCode="ta">தமிழ்</LanguageButton>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area with Sidebars */}
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row py-8 lg:py-10 gap-8 xl:gap-10">

                        {/* Left Sidebar */}
                        <aside className="w-full lg:w-60 xl:w-64 lg:flex-shrink-0 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] mb-6 lg:mb-0 lg:border-r lg:pr-6 xl:pr-8 border-gray-200 dark:border-gray-700/50">
                            <div className="h-full overflow-y-auto pb-10 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                               
                                {/* Nav Links */}
                                <nav className="space-y-1">
                                    {sidebarSections.map(link => {
                                         const sectionId = link.key;
                                         const isActive = activeSectionId === sectionId;
                                         return (
                                             <a
                                                key={link.key}
                                                href={`#${sectionId}`}
                                                onClick={(e) => handleLinkClick(e, sectionId)}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out group ${
                                                     isActive
                                                         ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-semibold'
                                                         : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                                                 }`}
                                             >
                                                <link.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                                                <span>{link.title}</span>
                                            </a>
                                         );
                                    })}
                                </nav>
                             </div>
                        </aside>

                        {/* Main Content Wrapper & Right TOC */}
                        <div className="flex flex-1 min-w-0">
                            {/* Main Content Area */}
                            <main ref={mainContentRef} className="flex-1 min-w-0 lg:pr-8">
                                {/* Page Header Inside Main */}
                                <div className="mb-10">
                                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 mb-2">{t.pageHeader.heading}</h1>
                                    <p className="text-lg text-gray-600 dark:text-gray-400">{t.pageHeader.description}</p>
                                </div>
                                {/* Render ALL sections sequentially */}
                                <OverviewSection />
                                <GettingStartedSection />
                                <AdvancedFeaturesSection />
                                <FaqSection />
                                <ApiReferenceSection />
                                <TroubleshootingSection />
                            </main>

                            {/* Right Table of Contents Sidebar */}
                            <RightSidebarTOC headings={headingsForTOC} activeId={activeSectionId} />
                        </div>
                    </div>
                </div>

                {/* Back to Top Button */}
                 {showBackToTop && (
                     <div className="fixed bottom-6 right-6 z-50">
                         <button onClick={scrollToTop} aria-label="Scroll back to top" className="bg-orange-500 text-white p-3 rounded-full shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-950 transition-all duration-300 hover:scale-105">
                             <FaChevronUp className="w-4 h-4" />
                         </button>
                     </div>
                 )}
            </div>
        </LanguageContext.Provider>
    );
}

// Default export the main component
export default DocumentationPage;