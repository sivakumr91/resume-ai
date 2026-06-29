import os
import json
import urllib.request
import urllib.parse
import urllib.error
from http.server import SimpleHTTPRequestHandler, HTTPServer

PORT = 3000

# Simple utility to load environment variables from a .env file
def load_env():
    env_vars = {}
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        key, val = line.split('=', 1)
                        # Strip spaces and optional quotes
                        key = key.strip()
                        val = val.strip().strip('"').strip("'")
                        env_vars[key] = val
    return env_vars

# Load environment variables
ENV = load_env()
GEMINI_API_KEY = ENV.get('GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY', ''))

class ResumeAnalyzerHandler(SimpleHTTPRequestHandler):
    
    def translate_path(self, path):
        # Map URL path to 'public/' directory
        root_dir = os.path.join(os.path.dirname(__file__), 'public')
        
        parsed_url = urllib.parse.urlparse(path)
        url_path = parsed_url.path
        
        # Default file is index.html
        if url_path == '/' or not url_path:
            url_path = '/index.html'
            
        rel_path = url_path.lstrip('/')
        full_path = os.path.join(root_dir, rel_path)
        return full_path

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        
        if parsed_url.path == '/api/analyze':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                # Parse request data
                data = json.loads(post_data.decode('utf-8'))
                resume_text = data.get('resume_text', '')
                job_desc = data.get('job_description', '')
                
                # Check if API key is present
                if not GEMINI_API_KEY:
                    print("[Server] GEMINI_API_KEY is not configured in .env. Informing client to fallback.")
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'fallback': True,
                        'message': 'Gemini API key missing in .env. Performing local rule-based analysis.'
                    }).encode('utf-8'))
                    return
                
                print(f"[Server] Gemini API Key found. Querying Gemini 2.5 Flash for analysis...")
                
                # Setup Gemini API Call
                api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
                
                prompt = f"""
You are an expert ATS (Applicant Tracking System) optimizer and professional recruiter.
Analyze the following Resume against the Job Description.

Resume Text:
\"\"\"
{resume_text}
\"\"\"

Job Description:
\"\"\"
{job_desc}
\"\"\"

Perform a deep analysis and output ONLY a JSON object (no markdown formatting, no ```json tags, just raw JSON).
The JSON object must follow this exact schema:
{{
  "overall_score": 85,
  "score_breakdown": {{
    "skill_match": 80,
    "keyword_match": 85,
    "completeness": 90,
    "formatting": 85
  }},
  "skills_found": ["Skill 1", "Skill 2"],
  "skills_missing": ["Skill A", "Skill B"],
  "improvements": [
    "Identify issue and specify how to improve (e.g. 'Add details about deployment in your AWS project')",
    "Another improvement suggestion"
  ],
  "ats_tips": [
    "Provide a general advice for ATS optimization based on their formatting or structure",
    "Another tip"
  ]
}}
"""

                payload = {
                    "contents": [{
                        "parts": [{
                            "text": prompt
                        }]
                    }],
                    "generationConfig": {
                        "responseMimeType": "application/json"
                    }
                }

                req_data = json.dumps(payload).encode('utf-8')
                req = urllib.request.Request(
                    api_url,
                    data=req_data,
                    headers={'Content-Type': 'application/json'}
                )
                
                # Make HTTP Request to Gemini API
                with urllib.request.urlopen(req, timeout=30) as response:
                    res_body = response.read().decode('utf-8')
                    res_json = json.loads(res_body)
                    
                    # Extract Gemini's text response
                    text_response = res_json['candidates'][0]['content']['parts'][0]['text']
                    
                    # Verify it can be parsed as JSON to validate response integrity
                    analysis_result = json.loads(text_response.strip())
                    
                    # Return success response
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'fallback': False,
                        'analysis': analysis_result
                    }).encode('utf-8'))
                    print("[Server] Analysis successfully completed and returned.")
                    
            except urllib.error.HTTPError as he:
                error_body = he.read().decode('utf-8')
                print(f"[Server] Gemini API HTTP Error: {he.code} - {error_body}")
                self.send_response(he.code)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': f'Gemini API error: {he.reason}',
                    'details': error_body
                }).encode('utf-8'))
                
            except Exception as e:
                print(f"[Server] General Server Error: {str(e)}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': f'Internal Server Error: {str(e)}'
                }).encode('utf-8'))
        else:
            # For POST requests other than /api/analyze
            self.send_response(404)
            self.end_headers()

def run_server():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, ResumeAnalyzerHandler)
    print(f"\n==================================================")
    print(f" AI Resume Analyzer Server running at:")
    print(f" http://localhost:{PORT}")
    print(f"==================================================")
    if not GEMINI_API_KEY:
        print("[Warning] GEMINI_API_KEY is not set in .env.")
        print("[Warning] App will run in fallback (local rule-based) analysis mode.")
    else:
        print("[Success] GEMINI_API_KEY successfully loaded from .env.")
    print("Press Ctrl+C to stop the server.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
