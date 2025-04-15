# TextEvolve - AI Historical Document Digitization Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) **Slogan:** Preserving History, Empowering Research | From Ink to Intelligence

**Live Application:** [http://www.textevolve.in](http://www.textevolve.in)

TextEvolve is an advanced AI-driven platform designed to digitize, transcribe, translate, and analyze historical handwritten documents. It leverages a unique Dual OCR approach combined with AI-powered text enhancement and translation features to make historical content accessible and searchable for researchers, students, archivists, and cultural institutions.

Developed by **Team Dynamic Dreamers**, Kathir College of Engineering, Coimbatore, India.

![TextEvolve Product Screenshot] *(Screenshot showing the TextEvolve application interface)*

## Key Features

* **Dual OCR Engine:** Combines a custom-trained Machine Learning model (TensorFlow/PyTorch/Keras) with leading commercial OCR APIs (Google Vision, Azure Vision, Amazon Textract) for high accuracy on diverse scripts.
* **AI Text Polishing:** Utilizes Google Gemini API to automatically correct grammar, spelling, and formatting in the extracted text.
* **Multi-Language Translation:** Integrates Google Translate API to translate digitized documents into various regional and international languages.
* **Interactive Query & Insights:** Allows users to ask natural language questions about the document content and receive summaries or specific information.
* **Multi-Format Export:** Exports digitized documents into editable formats like Word (.docx), PDF, and Plain Text (.txt).
* **User Management:** [Mention if user accounts/authentication are implemented].
* **[Planned] Community Platform:** Future feature to allow users to share digitized documents, annotations, and research findings.

## Technology Stack

* **Frontend:** React.js, Vite, Tailwind CSS, Framer Motion
* **Backend:** Python (Flask), Node.js
* **Database:** MongoDB (with Prisma ORM)
* **Machine Learning:** Python, TensorFlow, PyTorch, Keras
* **Core APIs:**
  * Google Cloud Vision API
  * Microsoft Azure Computer Vision OCR API
  * Amazon Textract API
  * Google Gemini API
  * Google Translate API
* **Deployment:** Hostinger VPS (KVM 2) or similar Linux VPS.
* **Development Tools:** Git, GitHub, VSCode, Postman, Docker (optional), etc.

## Setup and Installation

**Prerequisites:**

* Node.js (v18+) and npm/yarn
* Python (v3.9+) and pip
* MongoDB Server (local or cloud instance like MongoDB Atlas)
* Git

**Steps:**

1. **Clone the repository:**

    ```bash
    git clone [Your Repository URL for the Main Product]
    cd textevolve-product
    ```

2. **Backend Setup:**

    ```bash
    cd backend
    python -m venv venv         # Create virtual environment
    source venv/bin/activate    # Activate (Linux/macOS)
    # venv\Scripts\activate     # Activate (Windows)
    pip install -r requirements.txt # Install Python dependencies
    # Configure your .env file here with API keys and DB URI
    cd ..
    ```

3. **Frontend Setup:**

    ```bash
    cd frontend
    npm install                 # Install Node.js dependencies
    # Configure any necessary .env file for frontend (e.g., API endpoint URL)
    cd ..
    ```

4. **Database Setup:**
    * Ensure your MongoDB server is running.
    * Configure the `MONGODB_URI` in the backend `.env` file.
    * Run any necessary database migrations or seed scripts (if applicable, e.g., using Prisma: `npx prisma migrate dev` if Prisma is set up with the Node backend, or manage via Python script).

5. **[Optional] ML Model Setup:**
    * If the custom ML model needs separate setup or pre-trained file downloads, add instructions here.

## Running the Project

1. **Start Backend Server(s):**

    ```bash
    cd backend
    source venv/bin/activate  # Activate venv if not already active
    flask run                 # Or: python app.py (depends on your setup)
    # AND/OR if using Node backend components:
    # node server.js / npm run start:node (depends on your setup)
    ```

2. **Start Frontend Development Server:**

    ```bash
    cd frontend
    npm run dev
    ```

    The application should now be accessible, typically with the frontend at `http://localhost:5173` communicating with the backend running on its configured port (e.g., 5000 for Flask).

## Building for Production

1. **Build Frontend:**

    ```bash
    cd frontend
    npm run build
    ```

    This creates static assets in `frontend/dist/`.
2. **Deploy Backend:** Deploy the Python (Flask) / Node.js backend application to your hosting environment (like the Hostinger VPS) using tools like Gunicorn, PM2, or Docker. Ensure environment variables are set correctly in the production environment.
3. **Serve Frontend:** Configure your web server (e.g., Nginx, Apache) on the VPS to serve the static frontend files from `frontend/dist/` and proxy API requests to your running backend server(s).

## Folder Structure (Simplified)

```bash
textevolve-product/
├── backend/            # Python (Flask) / Node.js code, requirements.txt, .env.example
├── frontend/           # React (Vite) code, package.json
├── ml_models/          # Custom ML model training/inference code (optional)
├── docs/               # Project documentation
├── scripts/            # Utility scripts (e.g., DB seeding)
└── README.md
```

## Team

This project was proudly developed by **Team Dynamic Dreamers**, a group of passionate students from the **[Department of Artificial Intelligence and Data Science]** at **Kathir College of Engineering**, Coimbatore, Tamil Nadu, India (as of April 2025).

**Team Members:**

* **Yuva Nandhini M** - Project Lead / AI/ML Developer - [LinkedIn](https://www.linkedin.com/in/yuvanandhinim) / [GitHub](https://github.com/YUVANANDHINI1)
* **Praveenkumar S** - AI/MERN Developer - [LinkedIn](https://www.linkedin.com/in/praveensiva77) / [GitHub](https://github.com/PraveenSiva77)
* **Sibi Siddharth S** - AI/MERN Developer - [LinkedIn](https://www.linkedin.com/in/sibisiddharths) / [GitHub](https://github.com/sibisiddharth8)
* **Uma Maheswari P** - AI/ML Developer - [LinkedIn](https://www.linkedin.com/in/uma-maheswari-1530b8256) / [GitHub](https://github.com/Uma20042007)

**Under the Guidance of:**

* **Mrs. Kavitha M** - *Assistant Professor*, Department of Artificial Intelligence and Data Science

## Contributing

Contributions are welcome! Please follow standard Git workflow:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature/YourFeature`).
6. Open a Pull Request.

## License

This project is licensed under the [License Name] License - see the LICENSE.md file for details.

## Contact

Project developed by **Team Dynamic Dreamers**, Kathir College of Engineering, Coimbatore.

* Product Website: [http://www.textevolve.in](http://www.textevolve.in)
* Contact Email: [textevolve@gmail.com](mailto:textevolve@gmail.com)
