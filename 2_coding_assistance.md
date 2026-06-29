# Prompt Log 2: AI-Assisted Coding

This log records the prompts and responses for generating the core source code files.

## 1. Backend Server Implementation (`server.py`)

### Prompt
> "Write a standard Python script `server.py` that loads variables from `.env` manually (since python-dotenv is not installed), serves static files from a `public/` directory (where the root translates to `index.html`), and has a POST handler for `/api/analyze`. It needs to send a request to Google's Gemini 2.5 Flash API with `responseMimeType: 'application/json'` and return the JSON response to the client. Handle cases where the API key is not present by returning a fallback flag."

### AI Coding Output
The AI generated the complete `server.py` using `http.server.SimpleHTTPRequestHandler` and `urllib.request`. Key highlights:
- Manual `.env` line reader that strips quotes and handles comments.
- Custom path translation mapping GET requests to the local `public/` folder.
- Dynamic error handling for timeouts and API failures to ensure the server doesn't crash on bad inputs.

---

## 2. Dynamic Frontend & Local Parser (`public/app.js`)

### Prompt
> "Write the javascript file `app.js` that loads PDF.js and Mammoth.js from CDN, extracts text, handles the UI states (tabs, theme toggle), and posts the parsed text to the server. Also, implement a highly robust local fallback analyzer in JavaScript that parses emails, phones, links, calculates keyword matches, checks for sections like 'Experience' or 'Education', checks skill matches using a pre-defined dictionary, and returns the exact same JSON format as Gemini. This is so that the UI does not break if the user runs the app without a Gemini API Key."

### AI Coding Output
The AI successfully generated `public/app.js` containing:
- PDF.js text extractor parsing `ArrayBuffer` page-by-page.
- Mammoth.js raw text retriever.
- Local NLP rules parser using Jaccard Similarity and a comprehensive dictionary containing 50+ key software engineering and soft skills.
- Chart.js controller that handles instantiating and destroying chart objects.
- Print handler triggering native `window.print()` to output reports to PDF.
