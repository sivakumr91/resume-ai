// --- STATE & CONFIGURATION ---
let resumeTextContent = "";
let overallScoreChartInstance = null;

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// --- DOM ELEMENTS ---
const tabButtons = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const themeBtn = document.getElementById('theme-btn');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const fileInfoBar = document.getElementById('file-info-bar');
const fileNameEl = document.getElementById('file-name');
const fileSizeEl = document.getElementById('file-size');
const btnClearFile = document.getElementById('btn-clear-file');
const resumeTextarea = document.getElementById('resume-text');
const jdTextarea = document.getElementById('jd-text');
const btnAnalyze = document.getElementById('btn-analyze');
const navDashboardBtn = document.getElementById('nav-dashboard-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const dashboardResults = document.getElementById('dashboard-results');
const apiStatusEl = document.getElementById('api-status');

// Dashboard metrics elements
const overallScoreVal = document.getElementById('overall-score-val');
const scoreRatingBadge = document.getElementById('score-rating-badge');
const valSkills = document.getElementById('val-skills');
const valKeywords = document.getElementById('val-keywords');
const valCompleteness = document.getElementById('val-completeness');
const valFormatting = document.getElementById('val-formatting');
const barSkills = document.getElementById('bar-skills');
const barKeywords = document.getElementById('bar-keywords');
const barCompleteness = document.getElementById('bar-completeness');
const barFormatting = document.getElementById('bar-formatting');

// Dashboard details elements
const containerFoundSkills = document.getElementById('container-found-skills');
const containerMissingSkills = document.getElementById('container-missing-skills');
const containerImprovements = document.getElementById('container-improvements');
const containerAtsTips = document.getElementById('container-ats-tips');
const resEmail = document.getElementById('res-email');
const resPhone = document.getElementById('res-phone');
const resLinkedin = document.getElementById('res-linkedin');
const resGithub = document.getElementById('res-github');
const analysisTypeBadge = document.getElementById('analysis-type-badge');
const analysisDate = document.getElementById('analysis-date');
const btnPrintPdf = document.getElementById('btn-print-pdf');

// --- THEME MANAGEMENT ---
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    updateThemeIcon('light');
} else {
    updateThemeIcon('dark');
}

themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThemeIcon(isLight ? 'light' : 'dark');
    
    // Redraw charts if dark mode changes to update grids/colors
    if (overallScoreChartInstance) {
        renderOverallScoreChart(parseInt(overallScoreVal.innerText));
    }
});

function updateThemeIcon(theme) {
    if (theme === 'light') {
        themeBtn.innerHTML = '<i data-lucide="sun"></i>';
    } else {
        themeBtn.innerHTML = '<i data-lucide="moon"></i>';
    }
    lucide.createIcons();
}

// --- TAB ROUTING ---
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTabId = btn.getAttribute('data-tab');
        switchTab(targetTabId);
    });
});

function switchTab(tabId) {
    tabButtons.forEach(b => {
        if (b.getAttribute('data-tab') === tabId) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });

    tabContents.forEach(content => {
        if (content.id === tabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    // Customize page title depending on tab
    const pageTitle = document.getElementById('page-title');
    if (tabId === 'analyze-tab') {
        pageTitle.innerText = "Resume & ATS Analyzer";
    } else if (tabId === 'dashboard-tab') {
        pageTitle.innerText = "Evaluation Dashboard";
    } else if (tabId === 'instructions-tab') {
        pageTitle.innerText = "Setup Instructions";
    }
}

// --- DRAG AND DROP FILE UPLOAD ---
dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
});

['dragleave', 'dragend'].forEach(event => {
    dropzone.addEventListener(event, () => {
        dropzone.classList.remove('dragover');
    });
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        processUploadedFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        processUploadedFile(e.target.files[0]);
    }
});

btnClearFile.addEventListener('click', () => {
    fileInput.value = "";
    fileInfoBar.style.display = "none";
    dropzone.style.display = "flex";
    resumeTextContent = "";
    resumeTextarea.value = "";
    resumeTextarea.disabled = false;
});

// --- PARSE FILE CONTENT (PDF/DOCX) ---
function processUploadedFile(file) {
    // Check file format
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'pdf' && extension !== 'docx') {
        alert("Please upload only PDF or DOCX documents.");
        return;
    }

    // Display loading inside dropzone
    dropzone.style.display = "none";
    fileInfoBar.style.display = "flex";
    fileNameEl.innerText = file.name;
    fileSizeEl.innerText = formatBytes(file.size);
    
    // Disable raw text area to avoid confusion, show placeholder
    resumeTextarea.value = "Reading document text content...";
    resumeTextarea.disabled = true;

    const reader = new FileReader();
    
    if (extension === 'pdf') {
        reader.onload = async function() {
            try {
                const arrayBuffer = this.result;
                const text = await extractTextFromPDF(arrayBuffer);
                resumeTextContent = text;
                resumeTextarea.value = text;
                console.log("[Client] PDF parsed successfully, characters: " + text.length);
            } catch (err) {
                console.error("PDF Parsing error: ", err);
                alert("Failed to parse PDF file. Please paste your resume text manually.");
                btnClearFile.click();
            }
        };
        reader.readAsArrayBuffer(file);
    } else if (extension === 'docx') {
        reader.onload = function() {
            const arrayBuffer = this.result;
            mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                .then(function(result) {
                    resumeTextContent = result.value;
                    resumeTextarea.value = result.value;
                    console.log("[Client] Word Document parsed successfully, characters: " + result.value.length);
                })
                .catch(function(err) {
                    console.error("DOCX Parsing error: ", err);
                    alert("Failed to parse Word file. Please paste your resume text manually.");
                    btnClearFile.click();
                });
        };
        reader.readAsArrayBuffer(file);
    }
}

async function extractTextFromPDF(arrayBuffer) {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }
    return fullText;
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// --- CHECK SERVER CONNECTION STATUS ---
async function checkServerStatus() {
    try {
        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resume_text: '', job_description: '' })
        });
        if (res.status === 200) {
            const data = await res.json();
            // If the server reports a missing key, update UI
            if (data.fallback) {
                apiStatusEl.innerHTML = '<span class="status-dot orange"></span><span class="status-text">Server: Local Fallback</span>';
            } else {
                apiStatusEl.innerHTML = '<span class="status-dot green"></span><span class="status-text">Server: Gemini Active</span>';
            }
        }
    } catch (e) {
        apiStatusEl.innerHTML = '<span class="status-dot orange"></span><span class="status-text">Client Offline Fallback</span>';
    }
}

// Check status on page load
checkServerStatus();

// --- TRIGGER RESUME ANALYSIS ---
btnAnalyze.addEventListener('click', async () => {
    // Take text either from file parse cache or manual text input
    const resumeText = resumeTextarea.value.trim();
    const jobDescription = jdTextarea.value.trim();

    if (!resumeText || resumeText === "Reading document text content...") {
        alert("Please upload a resume file or paste your resume text first.");
        return;
    }

    if (!jobDescription) {
        alert("Please paste the target job description to match against.");
        return;
    }

    // Prepare UI state for loading
    navDashboardBtn.removeAttribute('disabled');
    switchTab('dashboard-tab');
    loadingSpinner.style.display = "flex";
    dashboardResults.style.display = "none";
    
    // Status text loader
    const steps = [
        "Reading resume contents...",
        "Identifying standard ATS sections...",
        "Analyzing skill alignment...",
        "Contact details integrity audit...",
        "Connecting to Gemini API proxy...",
    ];
    let stepIndex = 0;
    const statusTextEl = document.getElementById('loading-status-text');
    statusTextEl.innerText = steps[0];
    
    const interval = setInterval(() => {
        if (stepIndex < steps.length - 1) {
            stepIndex++;
            statusTextEl.innerText = steps[stepIndex];
        }
    }, 1500);

    try {
        // Send request to server
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resume_text: resumeText,
                job_description: jobDescription
            })
        });

        clearInterval(interval);

        if (response.ok) {
            const data = await response.json();
            if (data.fallback === true) {
                // Server responded with fallback request because api key is missing in .env
                console.log("[Client] Server requested fallback. Running local NLP parser...");
                const localResult = performLocalAnalysis(resumeText, jobDescription);
                renderResults(localResult, "Local Fallback Engine");
            } else {
                console.log("[Client] Server successfully processed API request.");
                renderResults(data.analysis, "Gemini AI Engine");
            }
        } else {
            console.warn("[Client] Server returned status " + response.status + ". Using local fallback.");
            const localResult = performLocalAnalysis(resumeText, jobDescription);
            renderResults(localResult, "Local Fallback Engine (Server Error)");
        }
    } catch (error) {
        clearInterval(interval);
        console.error("[Client] Network error querying backend server: ", error);
        console.log("[Client] Using local parsing engine.");
        const localResult = performLocalAnalysis(resumeText, jobDescription);
        renderResults(localResult, "Local Fallback Engine (Offline Mode)");
    }
});

// --- LOCAL RULES-BASED PARSER (NLP & REGEX FALLBACK) ---
function performLocalAnalysis(resumeText, jobDesc) {
    const cleanResume = resumeText.toLowerCase();
    const cleanJd = jobDesc.toLowerCase();

    // 1. Regular Expressions for Contact details
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi;
    const githubRegex = /github\.com\/[a-zA-Z0-9_-]+/gi;

    const emails = resumeText.match(emailRegex) || [];
    const phones = resumeText.match(phoneRegex) || [];
    const linkedinMatches = resumeText.match(linkedinRegex) || [];
    const githubMatches = resumeText.match(githubRegex) || [];

    const parsedEmail = emails.length > 0 ? emails[0] : null;
    const parsedPhone = phones.length > 0 ? phones[0] : null;
    const parsedLinkedin = linkedinMatches.length > 0 ? "https://" + linkedinMatches[0] : null;
    const parsedGithub = githubMatches.length > 0 ? "https://" + githubMatches[0] : null;

    // 2. Dictionary of Common Technical and Soft Skills
    const skillsDictionary = {
        // Frontend
        "html": ["html", "html5"],
        "css": ["css", "css3", "sass", "less"],
        "javascript": ["javascript", "js", "es6"],
        "typescript": ["typescript", "ts"],
        "react": ["react", "react.js", "reactjs"],
        "vue": ["vue", "vue.js", "vuejs"],
        "angular": ["angular", "angularjs"],
        "next.js": ["next.js", "nextjs"],
        "tailwind": ["tailwind", "tailwindcss"],
        "bootstrap": ["bootstrap"],
        // Backend
        "node.js": ["node.js", "nodejs", "node"],
        "express": ["express", "expressjs"],
        "python": ["python", "py"],
        "django": ["django"],
        "flask": ["flask"],
        "fastapi": ["fastapi"],
        "java": ["java"],
        "spring boot": ["spring boot", "spring"],
        "c#": ["c#", "csharp", ".net"],
        "c++": ["c++", "cpp"],
        "php": ["php", "laravel"],
        "ruby": ["ruby", "rails"],
        // Data & Cloud
        "sql": ["sql", "mysql", "postgresql", "sqlite"],
        "nosql": ["nosql", "mongodb", "redis", "firebase"],
        "aws": ["aws", "amazon web services", "ec2", "s3"],
        "azure": ["azure"],
        "gcp": ["gcp", "google cloud"],
        "docker": ["docker"],
        "kubernetes": ["kubernetes", "k8s"],
        "git": ["git", "github", "gitlab"],
        "ci/cd": ["ci/cd", "jenkins", "github actions"],
        "machine learning": ["machine learning", "ml", "nlp"],
        "pytorch": ["pytorch"],
        "tensorflow": ["tensorflow"],
        "pandas": ["pandas", "numpy", "matplotlib"],
        "scikit-learn": ["scikit-learn", "sklearn"],
        // Soft Skills / Methodologies
        "agile": ["agile", "scrum", "kanban"],
        "communication": ["communication", "communicating"],
        "leadership": ["leadership", "led", "manage", "mentor"],
        "teamwork": ["teamwork", "collaboration", "collaborative"],
        "problem solving": ["problem solving", "analytical", "troubleshooting"],
        "project management": ["project management", "pm"],
        "sdlc": ["sdlc", "software development life cycle"]
    };

    // Extract skills requested by job description
    const jdSkills = [];
    for (const [skillKey, synonyms] of Object.entries(skillsDictionary)) {
        for (const syn of synonyms) {
            // Check if word is present in JD
            const regex = new RegExp(`\\b${escapeRegExp(syn)}\\b`, 'i');
            if (regex.test(cleanJd)) {
                jdSkills.push(skillKey);
                break; // move to next skill key
            }
        }
    }

    // Default target skills if job description is generic and none match
    if (jdSkills.length === 0) {
        jdSkills.push("javascript", "python", "sql", "git", "communication", "problem solving");
    }

    // Extract which of the JD skills are found in the resume
    const skillsFound = [];
    const skillsMissing = [];

    jdSkills.forEach(skill => {
        const synonyms = skillsDictionary[skill];
        let found = false;
        for (const syn of synonyms) {
            const regex = new RegExp(`\\b${escapeRegExp(syn)}\\b`, 'i');
            if (regex.test(cleanResume)) {
                found = true;
                break;
            }
        }
        if (found) {
            skillsFound.push(capitalize(skill));
        } else {
            skillsMissing.push(capitalize(skill));
        }
    });

    // 3. Keyword Match Calculation (Jaccard Similarity over normalized tokens)
    const stopWords = new Set(['the', 'and', 'a', 'to', 'of', 'in', 'i', 'is', 'that', 'it', 'on', 'you', 'this', 'for', 'with', 'was', 'as', 'at', 'by', 'an', 'be', 'or', 'are', 'from', 'at', 'about', 'our', 'your', 'we']);
    const getWords = (text) => {
        const words = text.match(/\b[a-zA-Z]{3,}\b/g) || [];
        return new Set(words.map(w => w.toLowerCase()).filter(w => !stopWords.has(w)));
    };
    
    const resumeWords = getWords(cleanResume);
    const jdWords = getWords(cleanJd);

    let intersectionCount = 0;
    jdWords.forEach(word => {
        if (resumeWords.has(word)) {
            intersectionCount++;
        }
    });

    const keywordMatchScore = jdWords.size > 0 ? Math.round((intersectionCount / jdWords.size) * 100) : 50;

    // 4. Section completeness checks
    const sections = {
        "experience": ["experience", "employment history", "work history", "professional background"],
        "education": ["education", "academic background", "qualification"],
        "projects": ["projects", "personal projects", "portfolio"],
        "skills": ["skills", "technical skills", "areas of expertise", "competencies"],
        "summary": ["summary", "profile", "objective", "about me"]
    };

    let sectionCount = 0;
    const missingSections = [];
    for (const [secName, markers] of Object.entries(sections)) {
        let found = false;
        for (const marker of markers) {
            const regex = new RegExp(`\\b${escapeRegExp(marker)}\\b`, 'i');
            if (regex.test(cleanResume)) {
                found = true;
                break;
            }
        }
        if (found) {
            sectionCount++;
        } else {
            missingSections.push(secName);
        }
    }

    const completenessScore = Math.round((sectionCount / Object.keys(sections).length) * 100);

    // 5. Formatting calculations
    let formattingScore = 100;
    const formattingTips = [];

    // Length check
    const wordCount = (resumeText.match(/\S+/g) || []).length;
    if (wordCount < 200) {
        formattingScore -= 20;
        formattingTips.push("Your resume is very short (under 200 words). Expand your bullet points with details.");
    } else if (wordCount > 1000) {
        formattingScore -= 15;
        formattingTips.push("Your resume is quite long (over 1000 words). Keep it concise, ideally under 2 pages.");
    }

    // Contact link validations
    if (!parsedEmail) {
        formattingScore -= 20;
        formattingTips.push("Email address was not detected. Ensure your email is clearly visible.");
    }
    if (!parsedPhone) {
        formattingScore -= 15;
        formattingTips.push("Phone number was not detected. Add a phone number for recruiters.");
    }
    if (!parsedLinkedin) {
        formattingScore -= 10;
        formattingTips.push("LinkedIn profile URL was not detected. Standard ATS filters value LinkedIn profiles.");
    }
    if (!parsedGithub && (cleanJd.includes('developer') || cleanJd.includes('engineer') || cleanJd.includes('programmer'))) {
        formattingScore -= 10;
        formattingTips.push("GitHub link not found. For software development roles, adding a portfolio is highly recommended.");
    }

    formattingScore = Math.max(20, formattingScore);

    // Calculate Skill Match Score
    const totalSkillsNeeded = jdSkills.length;
    const skillMatchScore = totalSkillsNeeded > 0 ? Math.round((skillsFound.length / totalSkillsNeeded) * 100) : 60;

    // Overall ATS score formula: weighted average
    const overallScore = Math.round(
        (skillMatchScore * 0.40) +
        (keywordMatchScore * 0.30) +
        (completenessScore * 0.15) +
        (formattingScore * 0.15)
    );

    // Build Improvements suggestions list
    const improvements = [];
    skillsMissing.slice(0, 4).forEach(skill => {
        improvements.push(`Incorporate experience with '${skill}' to directly align with the job requirements.`);
    });

    missingSections.forEach(section => {
        improvements.push(`Create an explicit '${capitalize(section)}' section to organize your information for ATS parser compliance.`);
    });

    if (improvements.length === 0) {
        improvements.push("Your resume aligns closely with the job requirements! Try adding numerical achievements to further improve readability.");
    }

    // Build general ATS tips
    const atsTips = [
        "Avoid placing important info in floating text boxes, headers, or footers as standard ATS algorithms might skip them.",
        "Ensure your resume uses standard bullet formats (•) rather than complex icon shapes.",
        "Submit your resume in PDF format unless specified otherwise. Keep tables to a minimum."
    ];
    formattingTips.forEach(tip => atsTips.unshift(tip));

    return {
        overall_score: overallScore,
        score_breakdown: {
            skill_match: skillMatchScore,
            keyword_match: keywordMatchScore,
            completeness: completenessScore,
            formatting: formattingScore
        },
        skills_found: skillsFound,
        skills_missing: skillsMissing,
        improvements: improvements,
        ats_tips: atsTips,
        meta: {
            email: parsedEmail,
            phone: parsedPhone,
            linkedin: parsedLinkedin,
            github: parsedGithub
        }
    };
}

// Utility regex escapers
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- RENDER RESULTS TO DOM ---
function renderResults(analysis, typeLabel) {
    loadingSpinner.style.display = "none";
    dashboardResults.style.display = "block";

    // Set engine type badge & date
    analysisTypeBadge.innerText = typeLabel;
    
    // Set current date
    const d = new Date();
    analysisDate.innerText = d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Populate overall score numbers
    overallScoreVal.innerText = analysis.overall_score;

    // Apply color rating badge classes
    scoreRatingBadge.className = "rating-badge";
    if (analysis.overall_score < 50) {
        scoreRatingBadge.innerText = "Low Match";
        scoreRatingBadge.classList.add('low');
    } else if (analysis.overall_score >= 50 && analysis.overall_score < 75) {
        scoreRatingBadge.innerText = "Good Match";
        scoreRatingBadge.classList.add('mid');
    } else {
        scoreRatingBadge.innerText = "Excellent Match";
        scoreRatingBadge.classList.add('high');
    }

    // Populate parameter scores & animate bars
    valSkills.innerText = analysis.score_breakdown.skill_match + "%";
    barSkills.style.width = analysis.score_breakdown.skill_match + "%";

    valKeywords.innerText = analysis.score_breakdown.keyword_match + "%";
    barKeywords.style.width = analysis.score_breakdown.keyword_match + "%";

    valCompleteness.innerText = analysis.score_breakdown.completeness + "%";
    barCompleteness.style.width = analysis.score_breakdown.completeness + "%";

    valFormatting.innerText = analysis.score_breakdown.formatting + "%";
    barFormatting.style.width = analysis.score_breakdown.formatting + "%";

    // Clear and populate Skills Tags
    containerFoundSkills.innerHTML = "";
    if (analysis.skills_found && analysis.skills_found.length > 0) {
        analysis.skills_found.forEach(s => {
            const span = document.createElement('span');
            span.className = "tag t-found";
            span.innerText = s;
            containerFoundSkills.appendChild(span);
        });
    } else {
        containerFoundSkills.innerHTML = "<span class='text-muted' style='font-size: 13px;'>No matching skills identified.</span>";
    }

    containerMissingSkills.innerHTML = "";
    if (analysis.skills_missing && analysis.skills_missing.length > 0) {
        analysis.skills_missing.forEach(s => {
            const span = document.createElement('span');
            span.className = "tag t-missing";
            span.innerText = s;
            containerMissingSkills.appendChild(span);
        });
    } else {
        containerMissingSkills.innerHTML = "<span class='text-muted' style='font-size: 13px;'>Perfect match! No missing skills detected.</span>";
    }

    // Populate Improvements Checklist
    containerImprovements.innerHTML = "";
    if (analysis.improvements && analysis.improvements.length > 0) {
        analysis.improvements.forEach(imp => {
            const li = document.createElement('li');
            li.innerText = imp;
            containerImprovements.appendChild(li);
        });
    } else {
        containerImprovements.innerHTML = "<li>No significant improvements required. Good job!</li>";
    }

    // Populate ATS Tips Checklist
    containerAtsTips.innerHTML = "";
    if (analysis.ats_tips && analysis.ats_tips.length > 0) {
        analysis.ats_tips.forEach(tip => {
            const li = document.createElement('li');
            li.innerText = tip;
            containerAtsTips.appendChild(li);
        });
    }

    // Populate Meta contact details
    // If it's a fallback run, it has custom meta object.
    // If it's a Gemini run, it might have extracted them, or let's use client-side parser to extract them anyway to ensure they are always displayed!
    const localMeta = performLocalAnalysis(resumeTextarea.value, jdTextarea.value).meta;
    
    resEmail.innerText = localMeta.email || "Not Found";
    resPhone.innerText = localMeta.phone || "Not Found";
    
    if (localMeta.linkedin) {
        resLinkedin.innerHTML = `<a href="${localMeta.linkedin}" target="_blank" class="meta-link">${localMeta.linkedin.replace("https://", "")}</a>`;
    } else {
        resLinkedin.innerText = "Not Found";
    }

    if (localMeta.github) {
        resGithub.innerHTML = `<a href="${localMeta.github}" target="_blank" class="meta-link">${localMeta.github.replace("https://", "")}</a>`;
    } else {
        resGithub.innerText = "Not Found";
    }

    // Render Doughnut Overall Score Chart
    renderOverallScoreChart(analysis.overall_score);
}

// --- RENDER SCORE CHART (CHART.JS) ---
function renderOverallScoreChart(score) {
    if (overallScoreChartInstance) {
        overallScoreChartInstance.destroy();
    }

    const ctx = document.getElementById('overallScoreChart').getContext('2d');
    const isLightTheme = document.body.classList.contains('light-theme');
    
    // Choose colors based on score value
    let scoreColor = '#10b981'; // Green
    let scoreGlow = 'rgba(16, 185, 129, 0.1)';
    if (score < 50) {
        scoreColor = '#ef4444'; // Red
        scoreGlow = 'rgba(239, 68, 68, 0.1)';
    } else if (score >= 50 && score < 75) {
        scoreColor = '#f59e0b'; // Amber
        scoreGlow = 'rgba(245, 158, 11, 0.1)';
    }

    const trackColor = isLightTheme ? '#e2e8f0' : 'rgba(255, 255, 255, 0.05)';

    overallScoreChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: [scoreColor, trackColor],
                borderWidth: 0,
                hoverBackgroundColor: [scoreColor, trackColor]
            }]
        },
        options: {
            cutout: '83%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: { enabled: false },
                legend: { display: false }
            },
            animation: {
                animateRotate: true,
                duration: 1200,
                easing: 'easeOutBack'
            }
        }
    });
}

// --- EXPORT PDF ACTION ---
btnPrintPdf.addEventListener('click', () => {
    window.print();
});
