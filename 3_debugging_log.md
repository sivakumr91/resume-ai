# Prompt Log 3: AI-Assisted Debugging

This log details the troubleshooting processes and how bugs were addressed during development.

## Bug 1: Terminal Environment lacks Node.js / NPM
- **Issue**: Attempting to run `npm install` returned "term 'npm' is not recognized".
- **Debugging Prompt**: "The target system doesn't have Node or npm installed, but Python is available. How can we pivot the backend while still supporting the `.env` requirements?"
- **AI Solution**: Replaced the Node.js Express server with a standard library Python server (`server.py`). This eliminated the dependency on Node entirely, while preserving the backend security structure for the API key.

---

## Bug 2: Chart.js Canvas Reuse Error
- **Issue**: Hovering over the overall ATS doughnut chart after running multiple analyses caused the chart to flicker and revert to previous scores.
- **Debugging Prompt**: "Every time I click analyze a second time, the chart flickers back and forth between the new score and the old score on hover. How do I fix this in Chart.js?"
- **AI Solution**: Introduced chart object tracking in `app.js`. Added a check `if (overallScoreChartInstance) { overallScoreChartInstance.destroy(); }` before instantiating a new chart to release the canvas properly.

---

## Bug 3: Regex Pattern Escaping in Fallback Parser
- **Issue**: When searching for skills like `c++` or `next.js` using local regex dictionary lookups, the parser threw errors or failed to match because special characters (like `+` and `.`) were interpreted as regex modifiers.
- **Debugging Prompt**: "My local skill matcher fails to identify 'C++' or 'next.js' because they contain special characters. How do I match these string literals safely?"
- **AI Solution**: Created an `escapeRegExp(string)` utility function that escapes regex special characters:
  ```javascript
  function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  ```
  This allowed safe creation of word-bounded regexes: `new RegExp('\\b' + escapeRegExp(skill) + '\\b', 'i')`.
