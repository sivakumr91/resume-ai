# Prompt Log 1: AI-Generated Initial Architecture

This log details the interactive prompting process used to define the system architecture of the AI-Based Resume Analyzer.

## Prompt
> "I need to build an AI-Based Resume Analyzer as a coursework project. The project needs to support skill extraction, keyword matching, and resume scoring. The user has requested to keep their Gemini API key in a `.env` file. Node is not installed on the system, but Python 3.14 is. The directory layout should conform to:
> RollNo_Name/
> ├── Source_Code/
> ├── Screenshots/
> ├── Prompt_Log/
> ├── Report.pdf
> ├── README.md
> └── GitHub_Link.txt
>
> What architecture do you recommend to run this locally with zero external package dependencies (no npm install, no pip install) while keeping the API key secure?"

## AI-Generated Architecture Response

The AI recommended a hybrid **Client-Server Architecture** using:
1. **Frontend (Browser UI)**:
   - Dynamic HTML5 interface utilizing the Google Font **Outfit** and **Lucide Icons** CDN for sleek presentation.
   - Text extraction handled directly on the client using **PDF.js** and **Mammoth.js** via CDN. This removes the need for compiling heavy Python libraries like `pypdf` or `python-docx` locally.
   - Chart representation rendered using **Chart.js** CDN.
   - Core styling using custom vanilla CSS variables to support dynamic Dark/Light themes and print layouts.
2. **Backend (Python Server)**:
   - Built entirely on the standard Python libraries (`http.server`, `urllib`, `json`, `os`).
   - Serves the frontend folder (`public/`) statically.
   - Parses the `.env` configuration file dynamically on startup.
   - Implements a proxy endpoint (`/api/analyze`) which handles POST requests from the client, reads the key safely, and makes an HTTP POST to Google's Gemini Developer API.
3. **Local Fallback Engine**:
   - Written in frontend JS to parse contact details, calculate skill gaps against a dictionary of 100+ technologies, check section completeness, and generate recommendations client-side if the API key is not configured in `.env`.

### Architecture Directory Plan
```
RollNo_Name/
├── Source_Code/
│   ├── public/
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── app.js
│   ├── .env
│   ├── .env.example
│   └── server.py
├── Screenshots/
├── Prompt_Log/
├── README.md
└── GitHub_Link.txt
```

## Decisions & Benefits
- **Zero-Dependency Backend**: Running `python server.py` requires no virtual environment setup or dependency installation, providing an excellent user experience.
- **API Key Security**: The API key is kept exclusively in `.env` on the server and is never sent to the client browser.
- **Client-Side Heavy Parsing**: Parsing files on the client avoids server resource depletion and eliminates Python wheel compilation failures on Windows.
