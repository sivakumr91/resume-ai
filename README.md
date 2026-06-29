# AI-Based Resume Analyzer & ATS Optimizer

An AI-powered coursework mini-project designed to evaluate resumes against target job descriptions, identify skill gaps, verify contact integrity, and provide ATS optimization recommendations.

---

## Folder Structure

```
RollNo_Name/
├── Source_Code/
│   ├── public/
│   │   ├── index.html       # Main UI structure
│   │   ├── styles.css       # Styles (Glassmorphism, Dark/Light mode)
│   │   └── app.js           # Client orchestration & Fallback parser
│   ├── .env                 # API Key configuration
│   ├── .env.example         # Template for environment configuration
│   └── server.py            # Zero-dependency Python server
├── Screenshots/             # Directory to store evaluation screenshots
├── Prompt_Log/              # AI-Assisted development logs
│   ├── 1_architecture.md    # Architecture planning log
│   ├── 2_coding_assistance.md # Coding generation log
│   ├── 3_debugging_log.md    # Issues & bugfixes log
│   └── 4_documentation_gen.md # Documentation generation log
├── Report.md                # Comparative analysis & Academic Report
├── README.md                # System documentation (This file)
└── GitHub_Link.txt          # File containing the repository URL
```

---

## Features

- **Dual PDF/DOCX Support**: Upload files directly; text is extracted in-browser using PDF.js and Mammoth.js.
- **Gemini AI Integration**: Uses Google's `gemini-2.5-flash` model to analyze resume strengths and write specific bullet points.
- **Offline NLP Fallback**: If run without an API key, it switches to a local JS dictionary scanner using Jaccard Similarity and regex.
- **Dynamic CSS UI**: Interactive dashboard, Chart.js visualizations, responsive layout, and smooth dark/light theme switching.
- **Export to PDF**: Custom print styling prints a clean, page-breaks-managed layout of the report.

---

## Setup & Running Guide

### Step 1: Configure API Key (Optional but Recommended)
1. Go to [Google AI Studio](https://aistudio.google.com/) and click **Create API Key**.
2. Open the file `Source_Code/.env` in a text editor.
3. Replace the placeholder value with your key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_from_google_ai_studio
   ```

### Step 2: Run the Server
The project is built on standard Python libraries and requires **no external packages** (no `pip install` required).
1. Open your terminal/command prompt.
2. Navigate to the `Source_Code` directory:
   ```bash
   cd RollNo_Name/Source_Code
   ```
3. Start the server:
   ```bash
   python server.py
   ```
4. The server will launch on port 3000. Open your browser and go to:
   **[http://localhost:3000](http://localhost:3000)**

---

## Exporting Reports

To generate the `Report.pdf` requested for submission, you can follow these options:
1. **Technical Report**: Open `Report.md` in VS Code, right-click, and select "Markdown PDF: Export (pdf)" (if using the Markdown PDF extension), or open it in a browser and save-to-pdf.
2. **Resume Analysis Report**: Run the analyzer on your resume, click **Export Report (PDF)** on the dashboard, and select **Save as PDF** in the browser print dialog.

---


