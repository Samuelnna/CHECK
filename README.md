# CHECK

An explainable, browser-based AI content checker.

## Features

- AI-writing signal analysis
- Local phrase repetition and similarity-risk review
- Checkable factual claim extraction
- No server, API key, or account required

## Run

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Important limitation

This MVP provides heuristic indicators, not proof of AI authorship or plagiarism. Results should be treated as review leads and never as an accusation. Production fact verification requires authoritative sources and retrieval infrastructure.
