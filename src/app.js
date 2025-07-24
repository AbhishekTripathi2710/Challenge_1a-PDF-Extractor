const fs = require('fs');
const path = require('path');
const { extractPdfContent } = require('./pdfExtractor.js');
const { detectOutline } = require('./headingDetector.js');

const inputDir = './input';
const outputDir = './output';

async function processAllPdfs() {
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.pdf'));
  for (const file of files) {
    const pdfPath = path.join(inputDir, file);
    const content = await extractPdfContent(pdfPath);
    const { title, outline } = detectOutline(content);
    const output = { title, outline };
    const outPath = path.join(outputDir, file.replace('.pdf', '.json'));
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
    console.log(`Processed: ${file}`);
  }
}

processAllPdfs();