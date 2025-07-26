# PDF Outline Extraction

## Overview
This project extracts a structured outline (title, H1, H2, H3 headings) from PDF documents. The output is a JSON file for each PDF, containing the document title and a hierarchical list of headings with their levels and page numbers. The solution is designed to work robustly across a variety of PDF layouts, including forms and structured reports.

## Approach
The extractor works in several steps:
1. **Text Extraction:** We use `pdfjs-dist` to extract all text, font, and position information from each page of the PDF.
2. **Line Grouping:** Text is grouped into lines based on their vertical position, so headings that are split across multiple text blocks are merged.
3. **Title Detection:** The largest font lines on the first two pages are combined to form the document title, ignoring known section names and junk lines.
4. **Heading Detection:**
   - Headings are detected using a combination of font size, numbering patterns (like `1.`, `2.1`, `3.1.1`), and known section names (like "Table of Contents", "Acknowledgements").
   - The code is careful to avoid including list items, table rows, version numbers, or incomplete fragments as headings.
   - Headings are assigned levels (H1, H2, H3) based on both their numbering and font size.
   - Only meaningful headings are included in the outline; form fields and irrelevant lines are filtered out.
5. **Output:** The result is a JSON file for each PDF, containing the title and a clean, hierarchical outline.

## Multilingual Support
This solution supports multiple languages including:
- **English** (default)
- **Japanese** (日本語) - Hiragana, Katakana, Kanji
- **Chinese** (中文) - Simplified and Traditional
- **Korean** (한국어) - Hangul
- **Arabic** (العربية)
- **Russian** (Русский) - Cyrillic

The system automatically detects the document language and applies appropriate heading patterns and section names for each language. For example:
- Japanese documents will recognize headings like "1. はじめに" and sections like "目次" (Table of Contents)
- Chinese documents will detect "1. 引言" and "目录" (Table of Contents)
- Korean documents will identify "1. 서론" and "목차" (Table of Contents)

## Models and Libraries Used
- **[pdfjs-dist](https://www.npmjs.com/package/pdfjs-dist):** Used for parsing and extracting text and layout information from PDFs.
- **Node.js:** The solution is implemented in JavaScript for portability and ease of use.
- No machine learning models are used; the approach is heuristic-based for speed and reliability.

## How to Build and Run

### Prerequisites
- [Docker](https://www.docker.com/) installed on your system.

### Build the Docker Image
From the project root directory, run:
```sh
docker build --platform linux/amd64 -t pdf-outline-extractor:latest .
```

### Run the Solution
Place your input PDFs in the `input/` directory. Then run:
```sh
docker run --rm -v $(pwd)/input:/app/input -v $(pwd)/output:/app/output --network none pdf-outline-extractor:latest
```
- All PDFs in `input/` will be processed.
- For each `filename.pdf`, a corresponding `filename.json` will be created in `output/`.
- The output includes language detection and metadata.

### Expected Execution
This solution is designed to work with the following command (as per the challenge instructions):
```sh
docker run --rm -v $(pwd)/input:/app/input -v $(pwd)/output:/app/output --network none mysolutionname:somerandomidentifier
```

## Output Format
The JSON output includes:
```json
{
  "title": "Document Title",
  "outline": [
    { "level": "H1", "text": "Section 1", "page": 1 },
    { "level": "H2", "text": "Subsection 1.1", "page": 2 }
  ],
  "language": "en",
  "metadata": {
    "detectedLanguage": "en",
    "totalHeadings": 5,
    "processingTime": 1234
  }
}
```

## Notes
- The solution is fully offline and does not require any network access.
- It is optimized for speed and should process a 50-page PDF in under 10 seconds on a typical CPU.
- Language detection is automatic and supports 6 major languages.
- If you encounter any issues with specific PDFs, check the logs or try adjusting the heading detection heuristics in `src/headingDetector.js`.

---

