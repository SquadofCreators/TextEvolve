// src/pages/Documentation.jsx
import React, { useState, useEffect, createContext, useContext } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { FaChevronUp, FaArrowLeft } from "react-icons/fa6"; // Correct icons
import { FiBookOpen, FiPlayCircle, FiZap, FiHelpCircle, FiCode, FiTool, FiTerminal, FiKey, FiAlertTriangle } from "react-icons/fi";

// --- Translations Object (Keep as is) ---
const translations = {
    en: {
        pageHeader: { title: "Documentation", heading: "TextEvolve Documentation", description: "Learn how to use TextEvolve effectively and discover all its features." },
        sidebar: { overview: "Overview", gettingStarted: "Getting Started", features: "Features & Usage", faq: "FAQ", api: "API Reference", troubleshooting: "Troubleshooting" },
        overview: { title: "Overview", text: "TextEvolve leverages advanced Optical Character Recognition (OCR) technology to convert diverse documents – including handwritten letters, scanned forms, historical manuscripts, and standard PDFs/images – into searchable, editable, and structured digital data. Our platform is designed to streamline workflows for archivists, researchers, businesses, and developers, making valuable information accessible and actionable.", capabilities: "Key capabilities include high-accuracy text extraction, batch processing for large volumes, multiple output formats (Searchable PDF, DOCX, JSON), and a developer API for integration." },
        gettingStarted: {
            title: "Getting Started: Your First Conversion",
            steps: [
                { title: '1. Sign Up / Log In:', content: 'Create an account or log in to your existing TextEvolve dashboard.' },
                { title: '2. Navigate to Upload:', content: 'Click on the "Upload Batch" or equivalent button, usually found in the sidebar or dashboard.' },
                { title: '3. Select Files:', content: 'Drag and drop your document files (JPEG, PNG, PDF, DOCX) onto the upload area, or click to browse and select files from your computer. You can upload multiple files at once to create a batch.' },
                { title: '4. Start Conversion:', content: 'Once files are selected, review the batch details (you can often name the batch) and click "Start Conversion" or "Upload".' },
                { title: '5. Monitor Progress:', content: 'Track the conversion status on your Dashboard or History page. Processing time depends on file size and complexity.' },
                { title: '6. Review & Download:', content: 'Once a batch status shows "COMPLETED", click on it to view results. You can preview extracted text, download individual converted files (e.g., Searchable PDF, DOCX), or download the entire batch output.' },
            ],
            videoPlaceholder: "Watch our 2-minute quick start video (Placeholder)"
        },
        advancedFeatures: {
            title: "Features & Usage",
            features: [
                { title: 'Supported Formats:', content: 'Input: JPEG, PNG, TIFF, BMP, PDF (image-based and text-based), DOCX. Output: Searchable PDF, PDF/A, DOCX, TXT, JSON (for structured data). See the [API Reference](/documentation/api) for details on structured output.' },
                { title: 'Batch Processing:', content: 'Upload and manage hundreds or thousands of documents in logical groups (batches). Monitor batch status and download consolidated results.' },
                { title: 'OCR Engine Options:', content: '(Future Feature Placeholder) Select between different OCR models optimized for print, handwriting, or specific languages for enhanced accuracy.' },
                { title: 'Language Detection:', content: 'Automatic language detection for most common languages. Manual language selection is available for challenging documents.' },
                { title: 'History & Audit Trail:', content: 'Access detailed logs of all past batches, including upload time, processing duration, status, and download links. Stored securely for your reference.' },
                { title: 'Analytics Dashboard:', content: 'Visualize your usage statistics, average processing times, and document type distributions on the Analytics page.' },
                { title: 'Searchable PDF Generation:', content: 'Creates PDFs where the extracted text layer is invisible behind the original image, allowing you to search and copy text directly from the PDF.' },
            ],
        },
        faq: {
            title: "Frequently Asked Questions",
            questions: [
                { q: "Which file formats are supported for upload?", a: "We currently support JPEG, PNG, TIFF, BMP, single and multi-page PDF, and DOCX formats." },
                { q: "What are the output formats?", a: "You can typically download results as Searchable PDF, Microsoft Word (DOCX), Plain Text (TXT), and structured JSON (via API)." },
                { q: "Can I process multiple files at once?", a: "Yes, absolutely. The 'Upload Batch' feature is designed for processing multiple files together efficiently." },
                { q: "How accurate is the text recognition (OCR)?", a: "Accuracy is highly dependent on the input document quality (resolution, clarity, handwriting legibility). For clear printed text, accuracy often exceeds 95-98%. Handwritten text accuracy varies more but benefits from our specialized models." },
                { q: "Is my data secure?", a: "Yes. We employ industry-standard security practices, including encryption at rest and in transit. Please refer to our [Security & Compliance](/support) section for more details." },
                { q: "What are the limitations on file size or number of pages?", a: "Limits depend on your subscription plan. Please check the [Pricing](/#pricing) page or your account details for specific limitations." },
                { q: "How does billing work?", a: "We offer various subscription plans based on usage (e.g., pages processed per month). You can manage your subscription and view invoices in the [Account & Billing](/settings) section." },
            ],
        },
        apiReference: {
            title: "API Reference",
            text: "Integrate TextEvolve's powerful OCR and conversion capabilities directly into your applications using our RESTful API.",
            sections: [
                { title: "Authentication", content: "All API requests must be authenticated using an API key passed in the `Authorization: Bearer YOUR_API_KEY` header. You can generate and manage your keys in the [Settings](/settings) page.", icon: FiKey },
                { title: "Rate Limits", content: "API usage is subject to rate limits based on your subscription plan. Exceeding limits will result in `429 Too Many Requests` errors. Check response headers for current limit status.", icon: FiAlertTriangle },
                { title: "Key Endpoints", content: "Common endpoints include: `POST /api/v1/batches` (create batch & upload), `GET /api/v1/batches/:id` (get batch status/details), `GET /api/v1/batches/:id/results` (download results). Refer to the full specification for parameters and responses.", icon: FiTerminal },
            ],
            comingSoon: "Full interactive API documentation (Swagger/OpenAPI) coming soon.",
            codeExamplePlaceholder: "// Example: Creating a batch via API (Node.js - Placeholder)\n\nconst formData = new FormData();\nformData.append('files', fileInput.files[0]);\nformData.append('batchName', 'My API Batch');\n\nfetch('/api/v1/batches', {\n  method: 'POST',\n  headers: {\n    'Authorization': `Bearer YOUR_API_KEY`,\n    // Content-Type is set automatically by fetch for FormData\n  },\n  body: formData\n})\n.then(res => res.json())\n.then(data => console.log('Batch created:', data));"
        },
        troubleshooting: {
            title: "Troubleshooting",
            commonIssues: [
                { issue: "Upload Errors", solution: "Ensure your file format (JPG, PNG, PDF, DOCX) is supported and the file size is within your plan limits. Check your network connection. If errors persist, note the error message and contact [Support](/support)." },
                { issue: "Low OCR Accuracy", solution: "Improve source image quality: ensure good lighting, high resolution (300 DPI recommended), clear focus, and minimal skew. For handwritten text, ensure it's reasonably legible. Try selecting the correct language manually if auto-detection struggles." },
                { issue: "Processing Stuck/Failed", solution: "Check the batch details for specific error messages. Very large or complex documents may take longer. If a batch remains stuck for an extended period or fails unexpectedly, please contact [Support](/support) with the Batch ID." },
                { issue: "Incorrect Output Format", solution: "Verify the output format selected during batch creation or in your API request. Some formats might have specific requirements (e.g., generating searchable PDF requires a valid PDF input)." },
            ],
            linkToSupport: "Still having trouble? Our [Support](/support) team is here to help."
        },
        backToHome: "Back to Dashboard",
    },
    ta: {
        pageHeader: { title: "ஆவணங்கள்", heading: "TextEvolve ஆவணங்கள்", description: "TextEvolve ஐ திறமையாக பயன்படுத்துவது எப்படி மற்றும் அதன் அனைத்து அம்சங்களையும் கண்டறியுங்கள்." },
        sidebar: { overview: "மேலோட்டம்", gettingStarted: "தொடங்குதல்", features: "அம்சங்கள் & பயன்பாடு", faq: "அடிக்கடி கேட்கப்படும் கேள்விகள்", api: "API குறிப்பு", troubleshooting: "சிக்கல் தீர்த்தல்" },
        overview: {
            title: "மேலோட்டம்",
            text: "TextEvolve மேம்பட்ட ஆப்டிகல் கேரக்டர் ரெகக்னிஷன் (OCR) தொழில்நுட்பத்தைப் பயன்படுத்தி கையால் எழுதப்பட்ட கடிதங்கள், ஸ்கேன் செய்யப்பட்ட படிவங்கள், வரலாற்று கையெழுத்துப் பிரதிகள் மற்றும் நிலையான PDF/படங்கள் போன்ற பல்வேறு ஆவணங்களை தேடக்கூடிய, திருத்தக்கூடிய மற்றும் கட்டமைக்கப்பட்ட டிஜிட்டல் தரவுகளாக மாற்றுகிறது. எங்கள் தளம் காப்பகவாதிகள், ஆராய்ச்சியாளர்கள், வணிகங்கள் மற்றும் டெவலப்பர்களுக்கான பணிப்பாய்வுகளை ஒழுங்குபடுத்தவும், மதிப்புமிக்க தகவல்களை அணுகக்கூடியதாகவும் செயல்படக்கூடியதாகவும் மாற்றுவதற்காக வடிவமைக்கப்பட்டுள்ளது.",
            capabilities: "முக்கிய திறன்களில் உயர் துல்லியமான உரை பிரித்தெடுத்தல், பெரிய அளவுகளுக்கான தொகுதி செயலாக்கம், பல வெளியீட்டு வடிவங்கள் (தேடக்கூடிய PDF, DOCX, JSON) மற்றும் ஒருங்கிணைப்புக்கான டெவலப்பர் API ஆகியவை அடங்கும்."
        },
        gettingStarted: {
            title: "தொடங்குதல்: உங்கள் முதல் மாற்றம்",
            steps: [
                { title: '1. பதிவு / உள்நுழைவு:', content: 'ஒரு கணக்கை உருவாக்கவும் அல்லது உங்கள் தற்போதைய TextEvolve டாஷ்போர்டில் உள்நுழையவும்.' },
                { title: '2. பதிவேற்றத்திற்குச் செல்லவும்:', content: 'பக்கப்பட்டி அல்லது டாஷ்போர்டில் பொதுவாகக் காணப்படும் "பதிவேற்ற தொகுதி" அல்லது அதற்கு சமமான பொத்தானைக் கிளிக் செய்யவும்.' },
                { title: '3. கோப்புகளைத் தேர்ந்தெடுக்கவும்:', content: 'உங்கள் ஆவணக் கோப்புகளை (JPEG, PNG, PDF, DOCX) பதிவேற்றப் பகுதியில் இழுத்து விடவும் அல்லது உங்கள் கணினியிலிருந்து கோப்புகளைத் தேர்ந்தெடுக்க கிளிக் செய்யவும். ஒரு தொகுதியை உருவாக்க நீங்கள் ஒரே நேரத்தில் பல கோப்புகளைப் பதிவேற்றலாம்.' },
                { title: '4. மாற்றத்தைத் தொடங்கவும்:', content: 'கோப்புகள் தேர்ந்தெடுக்கப்பட்டதும், தொகுதி விவரங்களை மதிப்பாய்வு செய்து (நீங்கள் தொகுதிக்கு பெயரிடலாம்) "மாற்றத்தைத் தொடங்கு" அல்லது "பதிவேற்று" என்பதைக் கிளிக் செய்யவும்.' },
                { title: '5. முன்னேற்றத்தைக் கண்காணிக்கவும்:', content: 'உங்கள் டாஷ்போர்டு அல்லது வரலாறு பக்கத்தில் மாற்ற நிலையைக் கண்காணிக்கவும். செயலாக்க நேரம் கோப்பு அளவு மற்றும் சிக்கலான தன்மையைப் பொறுத்தது.' },
                { title: '6. ஆய்வு & பதிவிறக்கம்:', content: 'தொகுதி நிலை "முடிந்தது" எனக் காட்டியதும், முடிவுகளைப் பார்க்க அதைக் கிளிக் செய்யவும். பிரித்தெடுக்கப்பட்ட உரையை நீங்கள் முன்னோட்டமிடலாம், மாற்றப்பட்ட தனிப்பட்ட கோப்புகளை (எ.கா., தேடக்கூடிய PDF, DOCX) பதிவிறக்கலாம் அல்லது முழு தொகுதி வெளியீட்டையும் பதிவிறக்கலாம்.' },
            ],
            videoPlaceholder: "எங்கள் 2 நிமிட விரைவு தொடக்க வீடியோவைப் பார்க்கவும் (Placeholder)"
        },
        advancedFeatures: {
            title: "அம்சங்கள் & பயன்பாடு",
            features: [
                { title: 'ஆதரிக்கப்படும் வடிவங்கள்:', content: 'உள்ளீடு: JPEG, PNG, TIFF, BMP, PDF (படம் சார்ந்த மற்றும் உரை சார்ந்த), DOCX. வெளியீடு: தேடக்கூடிய PDF, PDF/A, DOCX, TXT, JSON (கட்டமைக்கப்பட்ட தரவுகளுக்கு). கட்டமைக்கப்பட்ட வெளியீடு குறித்த விவரங்களுக்கு [API குறிப்பு](/documentation/api) பார்க்கவும்.' },
                { title: 'தொகுதி செயலாக்கம்:', content: 'நூற்றுக்கணக்கான அல்லது ஆயிரக்கணக்கான ஆவணங்களை தர்க்கரீதியான குழுக்களாக (தொகுதிகள்) பதிவேற்றி நிர்வகிக்கவும். தொகுதி நிலையைக் கண்காணித்து ஒருங்கிணைந்த முடிவுகளைப் பதிவிறக்கவும்.' },
                { title: 'OCR இயந்திர விருப்பங்கள்:', content: '(எதிர்கால அம்சம் Placeholder) அச்சு, கையெழுத்து அல்லது குறிப்பிட்ட மொழிகளுக்காக மேம்படுத்தப்பட்ட வெவ்வேறு OCR மாதிரிகளுக்கு இடையே தேர்வு செய்யவும்.' },
                { title: 'மொழி கண்டறிதல்:', content: 'மிகவும் பொதுவான மொழிகளுக்கு தானியங்கி மொழி கண்டறிதல். சவாலான ஆவணங்களுக்கு கைமுறை மொழி தேர்வு உள்ளது.' },
                { title: 'வரலாறு & தணிக்கை தடம்:', content: 'பதிவேற்ற நேரம், செயலாக்க காலம், நிலை மற்றும் பதிவிறக்க இணைப்புகள் உட்பட அனைத்து கடந்த தொகுதிகளின் விரிவான பதிவுகளை அணுகவும். உங்கள் குறிப்புக்காக பாதுகாப்பாக சேமிக்கப்படுகிறது.' },
                { title: 'பகுப்பாய்வு டாஷ்போர்டு:', content: 'பகுப்பாய்வு பக்கத்தில் உங்கள் பயன்பாட்டு புள்ளிவிவரங்கள், சராசரி செயலாக்க நேரங்கள் மற்றும் ஆவண வகை விநியோகங்களைக் காட்சிப்படுத்தவும்.' },
                { title: 'தேடக்கூடிய PDF உருவாக்கம்:', content: 'பிரித்தெடுக்கப்பட்ட உரை அசல் படத்தின் பின்னால் கண்ணுக்கு தெரியாத வகையில் இருக்கும் PDFகளை உருவாக்குகிறது, இது PDF இலிருந்து நேரடியாக உரையைத் தேடவும் நகலெடுக்கவும் உங்களை அனுமதிக்கிறது.' },
            ],
        },
        faq: {
            title: "அடிக்கடி கேட்கப்படும் கேள்விகள்",
            questions: [
                { q: "பதிவேற்றத்திற்கு எந்த கோப்பு வடிவங்கள் ஆதரிக்கப்படுகின்றன?", a: "நாங்கள் தற்போது JPEG, PNG, TIFF, BMP, ஒற்றை மற்றும் பல பக்க PDF, மற்றும் DOCX வடிவங்களை ஆதரிக்கிறோம்." },
                { q: "வெளியீட்டு வடிவங்கள் யாவை?", a: "நீங்கள் பொதுவாக தேடக்கூடிய PDF, Microsoft Word (DOCX), Plain Text (TXT), மற்றும் கட்டமைக்கப்பட்ட JSON (API வழியாக) என முடிவுகளை பதிவிறக்கலாம்." },
                { q: "ஒரே நேரத்தில் பல கோப்புகளை செயலாக்க முடியுமா?", a: "ஆம், நிச்சயமாக. 'பதிவேற்ற தொகுதி' அம்சம் பல கோப்புகளை ஒரே நேரத்தில் திறமையாக செயலாக்க வடிவமைக்கப்பட்டுள்ளது." },
                { q: "உரை அங்கீகாரம் (OCR) எவ்வளவு துல்லியமானது?", a: "துல்லியம் உள்ளீட்டு ஆவணத்தின் தரத்தைப் பொறுத்தது (தெளிவு, கையெழுத்து தெளிவு). தெளிவான அச்சிடப்பட்ட உரைக்கு, துல்லியம் பெரும்பாலும் 95-98% ஐத் தாண்டும். கையால் எழுதப்பட்ட உரையின் துல்லியம் அதிகமாக மாறுபடும் ஆனால் எங்கள் சிறப்பு மாதிரிகளால் பயனடைகிறது." },
                { q: "எனது தரவு பாதுகாப்பானதா?", a: "ஆம். நாங்கள் தரமான பாதுகாப்பு நடைமுறைகளைப் பயன்படுத்துகிறோம், இதில் தரவு ஓய்வில் இருக்கும்போதும் பரிமாற்றத்தின் போதும் குறியாக்கம் அடங்கும். மேலும் விவரங்களுக்கு எங்கள் [பாதுகாப்பு & இணக்கம்](/support) பகுதியைப் பார்க்கவும்." },
                { q: "கோப்பு அளவு அல்லது பக்கங்களின் எண்ணிக்கையில் வரம்புகள் உள்ளதா?", a: "வரம்புகள் உங்கள் சந்தா திட்டத்தைப் பொறுத்தது. குறிப்பிட்ட வரம்புகளுக்கு [விலை நிர்ணயம்](/#pricing) பக்கம் அல்லது உங்கள் கணக்கு விவரங்களைப் பார்க்கவும்." },
                { q: "பில்லிங் எவ்வாறு செயல்படுகிறது?", a: "பயன்பாட்டின் அடிப்படையில் (எ.கா., மாதத்திற்கு செயலாக்கப்பட்ட பக்கங்கள்) பல்வேறு சந்தா திட்டங்களை நாங்கள் வழங்குகிறோம். உங்கள் சந்தாவை நிர்வகிக்கலாம் மற்றும் [கணக்கு & பில்லிங்](/settings) பிரிவில் இன்வாய்ஸ்களைப் பார்க்கலாம்." },
            ],
        },
        apiReference: {
            title: "API குறிப்பு",
            text: "எங்கள் RESTful API ஐப் பயன்படுத்தி TextEvolve இன் சக்திவாய்ந்த OCR மற்றும் மாற்றும் திறன்களை உங்கள் பயன்பாடுகளில் நேரடியாக ஒருங்கிணைக்கவும்.",
            sections: [
                { title: "அங்கீகாரம்", content: "அனைத்து API கோரிக்கைகளும் `Authorization: Bearer YOUR_API_KEY` தலைப்பில் அனுப்பப்பட்ட API விசையைப் பயன்படுத்தி அங்கீகரிக்கப்பட வேண்டும். உங்கள் விசைகளை [அமைப்புகள்](/settings) பக்கத்தில் உருவாக்கலாம் மற்றும் நிர்வகிக்கலாம்.", icon: FiKey },
                { title: "விகித வரம்புகள்", content: "API பயன்பாடு உங்கள் சந்தா திட்டத்தின் அடிப்படையிலான விகித வரம்புகளுக்கு உட்பட்டது. வரம்புகளை மீறுவது `429 Too Many Requests` பிழைகளை ஏற்படுத்தும். தற்போதைய வரம்பு நிலைக்கு மறுமொழி தலைப்புகளைச் சரிபார்க்கவும்.", icon: FiAlertTriangle },
                { title: "முக்கிய இறுதிப்புள்ளிகள்", content: "பொதுவான இறுதிப்புள்ளிகள்: `POST /api/v1/batches` (தொகுதியை உருவாக்கி பதிவேற்றுதல்), `GET /api/v1/batches/:id` (தொகுதி நிலை/விவரங்கள் பெறுதல்), `GET /api/v1/batches/:id/results` (முடிவுகளைப் பதிவிறக்குதல்). அளவுருக்கள் மற்றும் பதில்களுக்கான முழு விவரக்குறிப்பைப் பார்க்கவும்.", icon: FiTerminal },
            ],
            comingSoon: "முழுமையான ஊடாடும் API ஆவணங்கள் (Swagger/OpenAPI) விரைவில் வரும்.",
            codeExamplePlaceholder: "// எ.கா: API வழியாக தொகுதி உருவாக்குதல் (Node.js - Placeholder)\n\n..."
        },
        troubleshooting: {
            title: "சிக்கல் தீர்த்தல்",
            commonIssues: [
                { issue: "பதிவேற்றப் பிழைகள்", solution: "உங்கள் கோப்பு வடிவம் (JPG, PNG, PDF, DOCX) ஆதரிக்கப்படுவதையும், கோப்பு அளவு உங்கள் திட்ட வரம்புகளுக்குள் இருப்பதையும் உறுதிப்படுத்தவும். உங்கள் இணைய இணைப்பைச் சரிபார்க்கவும். பிழைகள் தொடர்ந்தால், பிழைச் செய்தியைக் குறித்து [ஆதரவை](/support) தொடர்பு கொள்ளவும்." },
                { issue: "குறைந்த OCR துல்லியம்", solution: "மூலப் படத் தரத்தை மேம்படுத்தவும்: நல்ல வெளிச்சம், உயர் தெளிவுத்திறன் (300 DPI பரிந்துரைக்கப்படுகிறது), தெளிவான கவனம் மற்றும் குறைந்தபட்ச சாய்வு ஆகியவற்றை உறுதிப்படுத்தவும். கையால் எழுதப்பட்ட உரைக்கு, அது நியாயமான முறையில் படிக்கக்கூடியதாக இருப்பதை உறுதிப்படுத்தவும். தானியங்கு கண்டறிதல் சிரமப்பட்டால், சரியான மொழியை கைமுறையாகத் தேர்ந்தெடுக்க முயற்சிக்கவும்." },
                { issue: "செயலாக்கம் நிற்கிறது/தோல்வியடைந்தது", solution: "குறிப்பிட்ட பிழைச் செய்திகளுக்கு தொகுதி விவரங்களைச் சரிபார்க்கவும். மிக பெரிய அல்லது சிக்கலான ஆவணங்கள் அதிக நேரம் எடுக்கலாம். ஒரு தொகுதி நீண்ட காலத்திற்கு நிற்கவில்லை அல்லது எதிர்பாராத விதமாக தோல்வியுற்றால், தொகுதி ஐடியுடன் [ஆதரவை](/support) தொடர்பு கொள்ளவும்." },
                { issue: "தவறான வெளியீட்டு வடிவம்", solution: "தொகுதி உருவாக்கம் அல்லது உங்கள் API கோரிக்கையின் போது தேர்ந்தெடுக்கப்பட்ட வெளியீட்டு வடிவத்தைச் சரிபார்க்கவும். சில வடிவங்களுக்கு குறிப்பிட்ட தேவைகள் இருக்கலாம் (எ.கா., தேடக்கூடிய PDF ஐ உருவாக்க சரியான PDF உள்ளீடு தேவை)." },
            ],
            linkToSupport: "இன்னும் சிக்கல் உள்ளதா? எங்கள் [ஆதரவு](/support) குழு உதவ இங்கே உள்ளது."
        },
        backToHome: "டாஷ்போர்டுக்கு திரும்பு",
    },
};

// --- Helper to parse simple markdown links ---
const SimpleMarkdownLink = ({ text }) => {
    const parts = text.split(/(\[.*?\]\(.*?\))/g);
    return (
        <>
            {parts.map((part, index) => {
                const match = part.match(/\[(.*?)\]\((.*?)\)/);
                if (match) {
                    const linkText = match[1];
                    const url = match[2];
                    const isExternal = url.startsWith('http');
                    if (isExternal) {
                        return <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">{linkText}</a>;
                    } else {
                        return <Link key={index} to={url} className="text-orange-600 dark:text-orange-400 hover:underline font-medium">{linkText}</Link>;
                    }
                }
                return part;
            })}
        </>
    );
};

// --- Language Context ---
const LanguageContext = React.createContext();
export const useLanguage = () => useContext(LanguageContext); // Export hook

// --- Reusable Section Wrapper ---
export const DocsSection = ({ title, children, className = "" }) => ( // Ensure export if used outside this file
    <section className={`mb-12 scroll-mt-20 ${className}`} id={title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-6 pb-2 border-b border-gray-300 dark:border-gray-700">
            {title}
        </h2>
        <div className="prose prose-base md:prose-lg dark:prose-invert max-w-none prose-a:text-orange-600 dark:prose-a:text-orange-400 hover:prose-a:underline prose-li:marker:text-orange-600 dark:prose-li:marker:text-orange-400 prose-code:before:content-none prose-code:after:content-none prose-code:bg-gray-200 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-normal">
            {children}
        </div>
    </section>
);

// --- Section Components (Exported) ---
export function OverviewSection() {
    const [language] = useLanguage();
    const t = translations[language].overview;
    return (
        <DocsSection title={t.title}>
            <p>{t.text}</p>
            <p className="mt-4 italic text-gray-600 dark:text-gray-400 text-base">{t.capabilities}</p>
        </DocsSection>
    );
 }
export function GettingStartedSection() {
    const [language] = useLanguage();
    const t = translations[language].gettingStarted;
    return (
        <DocsSection title={t.title}>
            <ol className="space-y-5">
                {t.steps.map((step, index) => (
                    <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-orange-500 dark:bg-orange-600 text-white dark:text-gray-900 rounded-full text-sm font-bold flex items-center justify-center">{index + 1}</span>
                        <div>
                            <strong className="block font-semibold text-gray-800 dark:text-gray-100">{step.title}</strong>
                            <span className="text-gray-700 dark:text-gray-300">{step.content}</span>
                        </div>
                    </li>
                ))}
            </ol>
            <div className="mt-8 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center bg-gray-100 dark:bg-gray-800/50">
                <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
                    <FiPlayCircle /> {t.videoPlaceholder}
                </p>
            </div>
        </DocsSection>
    );
 }
export function AdvancedFeaturesSection() {
    const [language] = useLanguage();
    const t = translations[language].advancedFeatures;
    return (
        <DocsSection title={t.title}>
            <ul className="space-y-5">
                {t.features.map((feature, index) => (
                    <li key={index} className="ml-2">
                        <strong className="block font-semibold text-gray-800 dark:text-gray-100">{feature.title}</strong>
                        <span className="text-gray-700 dark:text-gray-300"><SimpleMarkdownLink text={feature.content} /></span>
                    </li>
                ))}
            </ul>
        </DocsSection>
    );
 }
export function FaqSection() {
    const [language] = useLanguage();
    const t = translations[language].faq;
    return (
        <DocsSection title={t.title}>
            <div className="space-y-6">
                {t.questions.map((item, index) => (
                    <div key={index} className="p-4 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 shadow-sm">
                        <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1.5">
                            {item.q}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            <SimpleMarkdownLink text={item.a} />
                        </p>
                    </div>
                ))}
            </div>
        </DocsSection>
    );
 }
export function ApiReferenceSection() {
    const [language] = useLanguage();
    const t = translations[language].apiReference;
    const codeBlockClass = "block whitespace-pre-wrap break-words p-4 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm font-mono text-gray-900 dark:text-gray-100 overflow-x-auto shadow-inner";

    return (
        <DocsSection title={t.title}>
            <p className="mb-8">{t.text}</p>
            <div className="space-y-8">
                {t.sections.map(sec => (
                    <div key={sec.title} className="flex items-start gap-4 p-4 rounded-md bg-gray-100 dark:bg-gray-800/50 border-l-4 border-orange-500 dark:border-orange-400">
                        <div className="mt-1 text-orange-600 dark:text-orange-400 flex-shrink-0">
                            <sec.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-1 text-gray-800 dark:text-gray-100">{sec.title}</h3>
                            <p><SimpleMarkdownLink text={sec.content} /></p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-10">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Example Request</h3>
                <pre className={codeBlockClass}>
                    <code>
                        {t.codeExamplePlaceholder}
                    </code>
                </pre>
            </div>
            <div className="mt-8 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                <p className="text-gray-500 dark:text-gray-400">{t.comingSoon}</p>
            </div>
        </DocsSection>
    );
 }
export function TroubleshootingSection() {
    const [language] = useLanguage();
    const t = translations[language].troubleshooting;
    return (
        <DocsSection title={t.title}>
            <div className="space-y-6 mb-8">
                {t.commonIssues.map((item, index) => (
                    <div key={index} className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30">
                        <p className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">{item.issue}</p>
                        <p className="text-yellow-800 dark:text-yellow-300"><SimpleMarkdownLink text={item.solution} /></p>
                    </div>
                ))}
            </div>
            <p>
                <SimpleMarkdownLink text={t.linkToSupport} />
            </p>
        </DocsSection>
    );
 }


// --- Main Documentation Layout Component (Corrected) ---
function DocumentationLayout() {
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [language, setLanguage] = useState("en");
    const location = useLocation();

    const t = translations[language]; // Get translations for the selected language

    // Define sidebar links using translations
    const sidebarLinks = [
        { key: 'overview', title: t.sidebar.overview, path: '/documentation/overview', icon: FiBookOpen },
        { key: 'gettingStarted', title: t.sidebar.gettingStarted, path: '/documentation/getting-started', icon: FiPlayCircle },
        { key: 'features', title: t.sidebar.features, path: '/documentation/features', icon: FiZap },
        { key: 'faq', title: t.sidebar.faq, path: '/documentation/faq', icon: FiHelpCircle },
        { key: 'api', title: t.sidebar.api, path: '/documentation/api', icon: FiCode },
        { key: 'troubleshooting', title: t.sidebar.troubleshooting, path: '/documentation/troubleshooting', icon: FiTool },
    ];

    // --- Scroll Handling Effects ---
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    useEffect(() => {
        const handleScroll = () => setShowBackToTop(window.pageYOffset > 300);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (!location.hash) {
            window.scrollTo(0, 0);
        } else {
            setTimeout(() => {
                const id = location.hash.replace('#', '');
                const element = document.getElementById(id);
                if (element) {
                    const headerOffset = 80; // Adjust as needed
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                }
            }, 100);
        }
    }, [location.pathname, location.hash]);

    // --- Language Toggle Button Component ---
    const LanguageButton = ({ langCode, children }) => (
        <button
            onClick={() => setLanguage(langCode)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors duration-150 ease-in-out border ${
                language === langCode
                    ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
        >
            {children}
        </button>
    );

    return (
        <LanguageContext.Provider value={[language, setLanguage]}>
            <div className="min-h-screen bg-gray-100 dark:bg-gray-950">

                {/* Sticky Header */}
                <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
                   <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.pageHeader.title}</h1>
                            </div>
                            <div className="flex items-center space-x-2">
                                <LanguageButton langCode="en">EN</LanguageButton>
                                <LanguageButton langCode="ta">தமிழ்</LanguageButton>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area with Sidebar */}
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row py-8">

                        {/* Sidebar */}
                        <aside className="w-full md:w-56 lg:w-64 md:flex-shrink-0 md:sticky md:top-16 md:h-[calc(100vh-4rem)] mb-8 md:mb-0 md:border-r md:pr-6 lg:pr-8 border-gray-200 dark:border-gray-700">
                           <div className="h-full overflow-y-auto pb-10">

                             {/* Back to Dashboard Link */}
                             <Link
                                to="/" // Adjust path if needed
                                className="flex items-center gap-3 px-3 py-2 mb-4 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-150 ease-in-out group"
                             >
                                <FaArrowLeft className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                                <span>{t.backToHome}</span>
                             </Link>

                             {/* Documentation Navigation (Corrected) */}
                             <nav className="space-y-1">
                                {sidebarLinks.map(link => (
                                    <NavLink
                                        key={link.key}
                                        to={link.path}
                                        className={({ isActive }) => {
                                            const isLinkActive = isActive || (link.key === 'overview' && (location.pathname === '/documentation' || location.pathname === '/documentation/'));
                                            return `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out group ${
                                                isLinkActive
                                                    ? 'bg-orange-100 dark:bg-gray-800 text-orange-700 dark:text-orange-300 font-semibold'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                                            }`;
                                        }}
                                        end={link.key === 'overview'}
                                    >
                                        {({ isActive }) => {
                                            const isChildActive = isActive || (link.key === 'overview' && (location.pathname === '/documentation' || location.pathname === '/documentation/'));
                                            return (
                                                <>
                                                    <link.icon
                                                        className={`w-4 h-4 flex-shrink-0 ${
                                                            isChildActive
                                                                ? 'text-orange-600 dark:text-orange-400'
                                                                : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                                                        }`}
                                                    />
                                                    <span>{link.title}</span>
                                                </>
                                            );
                                        }}
                                    </NavLink>
                                ))}
                             </nav>
                           </div>
                        </aside>

                        {/* Main Content */}
                        <main className="flex-1 md:pl-6 lg:pl-8 min-w-0">
                            <Outlet /> {/* Renders the matched nested route component */}
                        </main>
                    </div>
                </div>

                {/* Back to Top Button */}
                {showBackToTop && (
                    <div className="fixed bottom-6 right-6 z-50">
                         <button
                            onClick={scrollToTop}
                            aria-label="Scroll back to top"
                            className="bg-orange-500 text-white p-3 rounded-full shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-950 transition-all duration-300 hover:scale-105"
                        >
                            <FaChevronUp className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </LanguageContext.Provider>
    );
}

export default DocumentationLayout; // Default export

