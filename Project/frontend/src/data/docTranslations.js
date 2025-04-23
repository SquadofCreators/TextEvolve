// src/pages/docSections/docTranslations.js
// Note: Icons are used in components, not defined here.

export const translations = {
    en: {
      pageHeader: { title: "Documentation", heading: "TextEvolve Documentation", description: "Learn how to use TextEvolve effectively and discover all its features." },
      sidebar: { overview: "Overview", gettingStarted: "Getting Started", features: "Features & Usage", faq: "FAQ", api: "API Reference", troubleshooting: "Troubleshooting" },
      overview: {
          id: "overview", // Section ID for linking
          title: "Overview",
          text: "TextEvolve leverages advanced Optical Character Recognition (OCR) technology alongside AI enhancements to convert diverse documents – including handwritten letters, scanned forms, historical manuscripts, and standard PDFs/images – into searchable, editable, and structured digital data. Our platform is designed to streamline workflows for archivists, researchers, businesses, and developers, making valuable information accessible and actionable.",
          capabilities: "Key capabilities include high-accuracy text extraction (Dual OCR), AI text polishing, multi-language translation, interactive querying, batch processing for large volumes, multiple output formats (Searchable PDF, DOCX, JSON), and a developer API for integration."
      },
      gettingStarted: {
          id: "getting-started", // Section ID
          title: "Getting Started: Your First Conversion",
          steps: [
              { title: '1. Sign Up / Log In:', content: 'Create an account or log in to your existing TextEvolve dashboard at [app.textevolve.in](http://www.textevolve.in).' },
              { title: '2. Create/Select a Batch:', content: 'Navigate to the "Batches" section and click "Create New Batch". Give it a descriptive name (e.g., "April Meeting Notes"). You can also select an existing batch.' },
              { title: '3. Upload Documents:', content: 'Inside the batch view or via the "Upload" page, drag and drop your document files (JPEG, PNG, PDF, etc.) onto the upload area, or click to select files.' },
              { title: '4. Initiate Processing:', content: 'Once files are uploaded to the batch, review the settings (like language if needed) and click "Start Processing" or "Analyze Batch".' },
              { title: '5. Monitor Progress:', content: 'Track the batch status on your Dashboard or the Batches page. Statuses include PENDING, PROCESSING, COMPLETED, FAILED.' },
              { title: '6. Review & Download:', content: 'Once status is "COMPLETED", click the batch to view results. Preview extracted text, query the content, or download converted files (Searchable PDF, DOCX, TXT).' },
          ],
          videoPlaceholder: "Watch our 2-minute quick start video! (Video component placeholder)"
      },
      advancedFeatures: {
          id: "features-and-usage", // Section ID (slugified from sidebar title)
          title: "Features & Usage",
          features: [
              { id: 'supported-formats', title: 'Supported Formats:', content: 'Input: JPEG, PNG, TIFF, BMP, PDF (image-based and text-based), DOCX. Output: Searchable PDF, PDF/A, DOCX, TXT, JSON (via API). See the [API Reference](#api-reference) section for details.' },
              { id: 'batch-processing', title: 'Batch Processing:', content: 'Upload and manage documents in logical groups (batches). Monitor status and download consolidated results.' },
              { id: 'dual-ocr', title: 'Dual OCR & AI Polishing:', content: 'Our unique engine combines custom models with leading APIs for high accuracy. Google Gemini integration refines grammar and clarity.' },
              { id: 'translation', title: 'Multi-Language Translation:', content: 'Translate digitized text instantly using integrated Google Translate.' },
              { id: 'interactive-query', title: 'Interactive Query:', content: 'Ask natural language questions directly about your processed document content and receive concise answers or summaries.' },
              { id: 'mobile-connect', title: 'Mobile Connect & Upload:', content: 'Securely link your mobile device using a QR code or ID to upload photos or files directly into a batch.' },
              { id: 'history-audit', title: 'History & Audit Trail:', content: 'Access logs of past batches, including upload time, status, and results. Stored securely.' },
          ],
      },
      faq: {
          id: "faq", // Section ID
          title: "Frequently Asked Questions",
          questions: [
              { id: "faq-formats", q: "Which file formats are supported?", a: "Input: JPEG, PNG, TIFF, BMP, PDF, DOCX. Output: Searchable PDF, DOCX, TXT. API can provide JSON." },
              { id: "faq-accuracy", q: "How accurate is the OCR?", a: "Highly dependent on input quality (scan resolution, clarity, legibility). Clear print often exceeds 95-98%. Handwritten accuracy varies but benefits from our AI enhancements." },
              { id: "faq-multiple-files", q: "Can I process multiple files at once?", a: "Yes, the Batch system is designed for uploading and processing multiple documents together efficiently." },
              { id: "faq-data-security", q: "Is my data secure?", a: "Yes. We use encryption and industry-standard practices. Documents are processed securely and access is restricted. Refer to our Privacy Policy and Terms of Service." }, // Removed links here, handle in component if needed
              { id: "faq-mobile-upload", q: "How does mobile upload work?", a: "Generate a secure code on desktop, then use the ID or scan the QR on your mobile within the TextEvolve web app to link the session temporarily for uploads." },
              { id: "faq-api-access", q: "Is there an API?", a: "Yes, a RESTful API is available for integration. See the [API Reference](#api-reference) section for details." },
              // Add more FAQs as needed
          ],
      },
      apiReference: {
          id: "api-reference", // Section ID
          title: "API Reference",
          text: "Integrate TextEvolve's capabilities into your applications using our RESTful API.",
          sections: [
              // IDs match headings for TOC
              { id: "authentication", title: "Authentication", content: "Authenticate requests using an API key in the `Authorization: Bearer YOUR_API_KEY` header. Manage keys in your [Settings](/settings) page.", iconName: "FiKey" }, // Pass icon name string
              { id: "rate-limits", title: "Rate Limits", content: "Usage is rate-limited based on your plan. Check `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers.", iconName: "FiAlertTriangle" },
              { id: "key-endpoints", title: "Key Endpoints", content: "`POST /api/batches` (create), `POST /api/batches/:id/documents` (upload), `GET /api/batches/:id` (status), `GET /api/batches/:id/documents/:docId/results?format=text` (get results).", iconName: "FiTerminal" },
          ],
          comingSoon: "Full interactive API documentation (Swagger/OpenAPI) is planned.",
          codeExamplePlaceholder: "// Example: Uploading a document (Node.js - using axios & FormData)\n\nimport axios from 'axios';\nimport FormData from 'form-data';\nimport fs from 'fs';\n\nconst API_KEY = 'YOUR_API_KEY';\nconst BATCH_ID = 'YOUR_BATCH_ID';\nconst FILE_PATH = './path/to/your_document.pdf';\n\nconst formData = new FormData();\nformData.append('documents', fs.createReadStream(FILE_PATH));\n\naxios.post(`https://api.textevolve.in/api/batches/${BATCH_ID}/documents`, formData, {\n  headers: {\n    ...formData.getHeaders(), // Important for multipart\n    'Authorization': `Bearer ${API_KEY}`,\n  }\n})\n.then(response => {\n  console.log('Upload successful:', response.data);\n})\n.catch(error => {\n  console.error('Upload error:', error.response?.data || error.message);\n});"
      },
      troubleshooting: {
          id: "troubleshooting", // Section ID
          title: "Troubleshooting",
          commonIssues: [
               { id: "ts-upload", issue: "Upload Errors", solution: "Check supported formats (JPG, PNG, PDF). Ensure file size is within limits. Check network connection. Contact [Support](/contact) with error details if needed." },
               { id: "ts-accuracy", issue: "Low OCR Accuracy", solution: "Improve source image quality (300 DPI+, good lighting, clear focus). For handwriting, legibility is key. Ensure correct language is selected." },
               { id: "ts-processing", issue: "Processing Stuck/Failed", solution: "Check batch status for error messages. Large files take longer. Contact [Support](/contact) with Batch ID if stuck for an extended time." },
               { id: "ts-mobile-connect", issue: "Mobile Connect Fails", solution: "Ensure both devices are online. Check if the Connection ID is entered correctly and hasn't expired (usually 5 mins). Regenerate ID/QR on desktop if needed. Ensure camera permissions are granted for QR scanning." },
          ],
          linkToSupport: "Still having trouble? Our [Support Team](/contact) is ready to assist."
      },
      backToHome: "Back to App",
    },
    ta: {
      pageHeader: { title: "ஆவணங்கள்", heading: "TextEvolve ஆவணங்கள்", description: "TextEvolve ஐ திறமையாக பயன்படுத்துவது எப்படி மற்றும் அதன் அனைத்து அம்சங்களையும் கண்டறியுங்கள்." },
      sidebar: { overview: "மேலோட்டம்", gettingStarted: "தொடங்குதல்", features: "அம்சங்கள் & பயன்பாடு", faq: "அகேகே", api: "API குறிப்பு", troubleshooting: "சிக்கல் தீர்த்தல்" }, //அகேகே = அடிக்கடி கேட்கப்படும் கேள்விகள்
      overview: {
          id: "overview",
          title: "மேலோட்டம்",
          text: "TextEvolve மேம்பட்ட ஆப்டிகல் கேரக்டர் ரெகக்னிஷன் (OCR) தொழில்நுட்பம் மற்றும் AI மேம்பாடுகளைப் பயன்படுத்தி, கையால் எழுதப்பட்ட கடிதங்கள், ஸ்கேன் செய்யப்பட்ட படிவங்கள், வரலாற்று கையெழுத்துப் பிரதிகள் மற்றும் பொதுவான PDF/படங்கள் போன்ற பல்வேறு ஆவணங்களை தேடக்கூடிய, திருத்தக்கூடிய மற்றும் கட்டமைக்கப்பட்ட டிஜிட்டல் தரவுகளாக மாற்றுகிறது. காப்பகவாதிகள், ஆராய்ச்சியாளர்கள், வணிகங்கள் மற்றும் டெவலப்பர்களின் பணிப்பாய்வுகளை எளிமைப்படுத்தவும், மதிப்புமிக்க தகவல்களை அணுகக்கூடியதாகவும், செயல்படக்கூடியதாகவும் மாற்றுவதே எங்கள் தளத்தின் நோக்கமாகும்.",
          capabilities: "முக்கிய திறன்கள்: உயர் துல்லிய உரை பிரித்தெடுத்தல் (Dual OCR), AI உரை மெருகூட்டல், பன்மொழி மொழிபெயர்ப்பு, ஊடாடும் வினவல், பெரிய அளவிலான தொகுதி செயலாக்கம், பல வெளியீட்டு வடிவங்கள் (தேடக்கூடிய PDF, DOCX, JSON), மற்றும் ஒருங்கிணைப்புக்கான டெவலப்பர் API."
      },
      gettingStarted: {
          id: "getting-started",
          title: "தொடங்குதல்: உங்கள் முதல் மாற்றம்",
          steps: [
              { title: '1. பதிவு / உள்நுழைவு:', content: 'ஒரு புதிய கணக்கை உருவாக்கவும் அல்லது [app.textevolve.in](http://www.textevolve.in) இல் உங்கள் TextEvolve டாஷ்போர்டில் உள்நுழையவும்.' },
              { title: '2. தொகுதியை உருவாக்கவும்/தேர்ந்தெடுக்கவும்:', content: '"தொகுதிகள்" பகுதிக்குச் சென்று "புதிய தொகுதியை உருவாக்கு" என்பதைக் கிளிக் செய்யவும். அதற்கு ஒரு விளக்கமான பெயரைக் கொடுங்கள் (எ.கா., "ஏப்ரல் கூட்டக் குறிப்புகள்"). ஏற்கனவே உள்ள தொகுதியையும் நீங்கள் தேர்ந்தெடுக்கலாம்.' },
              { title: '3. ஆவணங்களைப் பதிவேற்றவும்:', content: 'தொகுதிப் பார்வையில் அல்லது "பதிவேற்றம்" பக்கத்தின் வழியாக, உங்கள் ஆவணக் கோப்புகளை (JPEG, PNG, PDF, போன்றவை) பதிவேற்றப் பகுதியில் இழுத்து விடவும் அல்லது கோப்புகளைத் தேர்ந்தெடுக்க கிளிக் செய்யவும்.' },
              { title: '4. செயலாக்கத்தைத் தொடங்கவும்:', content: 'கோப்புகள் தொகுதிக்கு பதிவேற்றப்பட்டதும், அமைப்புகளை (தேவைப்பட்டால் மொழி போன்றவை) மதிப்பாய்வு செய்து, "செயலாக்கத்தைத் தொடங்கு" அல்லது "தொகுதியை பகுப்பாய்வு செய்" என்பதைக் கிளிக் செய்யவும்.' },
              { title: '5. முன்னேற்றத்தைக் கண்காணிக்கவும்:', content: 'உங்கள் டாஷ்போர்டு அல்லது தொகுதிகள் பக்கத்தில் தொகுதி நிலையைக் கண்காணிக்கவும். நிலைகளில் PENDING, PROCESSING, COMPLETED, FAILED ஆகியவை அடங்கும்.' },
              { title: '6. ஆய்வு & பதிவிறக்கம்:', content: 'நிலை "COMPLETED" ஆனதும், முடிவுகளைப் பார்க்க தொகுதியைக் கிளிக் செய்யவும். பிரித்தெடுக்கப்பட்ட உரையை முன்னோட்டமிடலாம், உள்ளடக்கத்தை வினவலாம் அல்லது மாற்றப்பட்ட கோப்புகளை (தேடக்கூடிய PDF, DOCX, TXT) பதிவிறக்கலாம்.' },
          ],
          videoPlaceholder: "எங்கள் 2 நிமிட விரைவு தொடக்க வீடியோவைப் பாருங்கள்! (வீடியோ கூறு Placeholder)"
      },
      advancedFeatures: {
          id: "features-and-usage",
          title: "அம்சங்கள் & பயன்பாடு",
          features: [
              { id: 'supported-formats', title: 'ஆதரிக்கப்படும் வடிவங்கள்:', content: 'உள்ளீடு: JPEG, PNG, TIFF, BMP, PDF (படம் மற்றும் உரை சார்ந்த), DOCX. வெளியீடு: தேடக்கூடிய PDF, PDF/A, DOCX, TXT, JSON (API வழியாக). விவரங்களுக்கு [API குறிப்பு](#api-reference) பகுதியைப் பார்க்கவும்.' },
              { id: 'batch-processing', title: 'தொகுதி செயலாக்கம்:', content: 'ஆவணங்களை தர்க்கரீதியான குழுக்களாக (தொகுதிகள்) பதிவேற்றி நிர்வகிக்கவும். நிலையை கண்காணித்து ஒருங்கிணைந்த முடிவுகளைப் பதிவிறக்கவும்.' },
              { id: 'dual-ocr', title: 'இரட்டை OCR & AI மெருகூட்டல்:', content: 'எங்கள் தனித்துவமான இயந்திரம், உயர் துல்லியத்திற்காக தனிப்பயன் மாதிரிகள் மற்றும் முன்னணி APIகளை ஒருங்கிணைக்கிறது. Google Gemini ஒருங்கிணைப்பு இலக்கணம் மற்றும் தெளிவை மேம்படுத்துகிறது.' },
              { id: 'translation', title: 'பன்மொழி மொழிபெயர்ப்பு:', content: 'ஒருங்கிணைக்கப்பட்ட Google Translate ஐப் பயன்படுத்தி டிஜிட்டல் மயமாக்கப்பட்ட உரையை உடனடியாக மொழிபெயர்க்கவும்.' },
              { id: 'interactive-query', title: 'ஊடாடும் வினவல்:', content: 'உங்கள் செயலாக்கப்பட்ட ஆவண உள்ளடக்கம் குறித்து நேரடியாக இயல்பான மொழி கேள்விகளைக் கேட்டு சுருக்கமான பதில்கள் அல்லது சுருக்கங்களைப் பெறுங்கள்.' },
              { id: 'mobile-connect', title: 'மொபைல் இணைப்பு & பதிவேற்றம்:', content: 'உங்கள் மொபைல் சாதனத்தை QR குறியீடு அல்லது ID ஐப் பயன்படுத்தி பாதுகாப்பாக இணைத்து, புகைப்படங்கள் அல்லது கோப்புகளை நேரடியாக ஒரு தொகுதியில் பதிவேற்றவும்.' },
              { id: 'history-audit', title: 'வரலாறு & தணிக்கை தடம்:', content: 'பதிவேற்ற நேரம், நிலை மற்றும் முடிவுகள் உட்பட கடந்த தொகுதிகளின் பதிவுகளை அணுகவும். பாதுகாப்பாக சேமிக்கப்படுகிறது.' },
          ],
      },
      faq: {
          id: "faq",
          title: "அடிக்கடி கேட்கப்படும் கேள்விகள்",
          questions: [
              { id: "faq-formats", q: "எந்த கோப்பு வடிவங்கள் ஆதரிக்கப்படுகின்றன?", a: "உள்ளீடு: JPEG, PNG, TIFF, BMP, PDF, DOCX. வெளியீடு: தேடக்கூடிய PDF, DOCX, TXT. API ஆனது JSON ஐ வழங்க முடியும்." },
              { id: "faq-accuracy", q: "OCR எவ்வளவு துல்லியமானது?", a: "உள்ளீட்டின் தரத்தைப் பொறுத்தது (ஸ்கேன் தரம், தெளிவு, கையெழுத்து). தெளிவான அச்சுக்கு 95-98% க்கு மேல் துல்லியம் இருக்கும். கையெழுத்து துல்லியம் மாறுபடும், ஆனால் எங்கள் AI மேம்பாடுகளால் பயனடைகிறது." },
              { id: "faq-multiple-files", q: "ஒரே நேரத்தில் பல கோப்புகளை செயலாக்க முடியுமா?", a: "ஆம், தொகுதி அமைப்பு பல ஆவணங்களை ஒன்றாக திறமையாக பதிவேற்றி செயலாக்க வடிவமைக்கப்பட்டுள்ளது." },
              { id: "faq-data-security", q: "எனது தரவு பாதுகாப்பானதா?", a: "ஆம். நாங்கள் குறியாக்கம் மற்றும் தொழில்துறை தர நடைமுறைகளைப் பயன்படுத்துகிறோம். ஆவணங்கள் பாதுகாப்பாக செயலாக்கப்படுகின்றன. எங்கள் தனியுரிமைக் கொள்கை மற்றும் சேவை விதிமுறைகளைப் பார்க்கவும்." },
              { id: "faq-mobile-upload", q: "மொபைல் பதிவேற்றம் எவ்வாறு செயல்படுகிறது?", a: "டெஸ்க்டாப்பில் ஒரு பாதுகாப்பான குறியீட்டை உருவாக்கவும், பின்னர் உங்கள் மொபைலில் உள்ள TextEvolve இணைய பயன்பாட்டில் ID அல்லது QR ஐப் பயன்படுத்தி பதிவேற்றங்களுக்காக தற்காலிகமாக இணைக்கவும்." },
              { id: "faq-api-access", q: "API உள்ளதா?", a: "ஆம், ஒருங்கிணைப்புக்கு RESTful API உள்ளது. விவரங்களுக்கு [API குறிப்பு](#api-reference) பகுதியைப் பார்க்கவும்." },
          ],
      },
      apiReference: {
          id: "api-reference",
          title: "API குறிப்பு",
          text: "எங்கள் RESTful API ஐப் பயன்படுத்தி TextEvolve இன் திறன்களை உங்கள் பயன்பாடுகளில் ஒருங்கிணைக்கவும்.",
          sections: [
              { id: "api-auth", title: "அங்கீகாரம்", content: "`Authorization: Bearer YOUR_API_KEY` தலைப்பில் API விசையைப் பயன்படுத்தி கோரிக்கைகளை அங்கீகரிக்கவும். உங்கள் [அமைப்புகள்](/settings) பக்கத்தில் விசைகளை நிர்வகிக்கவும்.", iconName: "FiKey" },
              { id: "api-rate-limits", title: "விகித வரம்புகள்", content: "பயன்பாடு உங்கள் திட்டத்தின் அடிப்படையில் விகித வரம்புக்கு உட்பட்டது. `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` தலைப்புகளைச் சரிபார்க்கவும்.", iconName: "FiAlertTriangle" },
              { id: "api-endpoints", title: "முக்கிய இறுதிப்புள்ளிகள்", content: "`POST /api/batches` (உருவாக்கு), `POST /api/batches/:id/documents` (பதிவேற்று), `GET /api/batches/:id` (நிலை), `GET /api/batches/:id/documents/:docId/results?format=text` (முடிவுகளைப் பெறு).", iconName: "FiTerminal" },
          ],
          comingSoon: "முழுமையான ஊடாடும் API ஆவணங்கள் (Swagger/OpenAPI) திட்டமிடப்பட்டுள்ளது.",
          codeExamplePlaceholder: "// Example: Uploading a document (Node.js - using axios & FormData)\n// (குறியீடு உதாரணம் ஆங்கிலத்தில் உள்ளது)" // Indicate code is in English
      },
      troubleshooting: {
          id: "troubleshooting",
          title: "சிக்கல் தீர்த்தல்",
          commonIssues: [
               { id: "ts-upload", issue: "பதிவேற்றப் பிழைகள்", solution: "ஆதரிக்கப்படும் வடிவங்களை (JPG, PNG, PDF) சரிபார்க்கவும். கோப்பு அளவு வரம்புகளுக்குள் இருப்பதை உறுதிப்படுத்தவும். இணைய இணைப்பைச் சரிபார்க்கவும். தேவைப்பட்டால் பிழை விவரங்களுடன் [ஆதரவை](/contact) தொடர்பு கொள்ளவும்." },
               { id: "ts-accuracy", issue: "குறைந்த OCR துல்லியம்", solution: "மூலப் படத் தரத்தை மேம்படுத்தவும் (300 DPI+, நல்ல வெளிச்சம், தெளிவான கவனம்). கையெழுத்துக்கு, தெளிவு முக்கியம். சரியான மொழி தேர்ந்தெடுக்கப்பட்டுள்ளதா என்பதை உறுதிப்படுத்தவும்." },
               { id: "ts-processing", issue: "செயலாக்கம் நிற்கிறது/தோல்வியடைந்தது", solution: "பிழைச் செய்திகளுக்கு தொகுதி நிலையைச் சரிபார்க்கவும். பெரிய கோப்புகள் அதிக நேரம் எடுக்கும். நீண்ட நேரம் நின்றால் தொகுதி ஐடியுடன் [ஆதரவை](/contact) தொடர்பு கொள்ளவும்." },
               { id: "ts-mobile-connect", issue: "மொபைல் இணைப்பு தோல்விகள்", solution: "இரு சாதனங்களும் ஆன்லைனில் இருப்பதை உறுதிப்படுத்தவும். இணைப்பு ஐடி சரியாக உள்ளிடப்பட்டுள்ளதா மற்றும் காலாவதியாகவில்லையா என சரிபார்க்கவும் (பொதுவாக 5 நிமிடங்கள்). தேவைப்பட்டால் டெஸ்க்டாப்பில் ஐடி/QR ஐ மீண்டும் உருவாக்கவும். QR ஸ்கேனிங்கிற்கு கேமரா அனுமதிகள் வழங்கப்பட்டுள்ளதா என்பதை உறுதிப்படுத்தவும்." },
          ],
          linkToSupport: "இன்னும் சிக்கல் உள்ளதா? எங்கள் [ஆதரவு குழு](/contact) உதவ தயாராக உள்ளது."
      },
      backToHome: "செயலிக்கு திரும்பு",
    },
  };
  
  // Helper function to get icon component by name string (used in API section)
  export const getIconComponent = (iconName) => {
      switch (iconName) {
          case 'FiKey': return FiKey;
          case 'FiAlertTriangle': return FiAlertTriangle;
          case 'FiTerminal': return FiTerminal;
          default: return FiTool; // Fallback icon
      }
  };