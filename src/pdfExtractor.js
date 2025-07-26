const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function extractPdfContent(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdf = await pdfjsLib.getDocument({ 
    data,
    standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/',
    cMapUrl: 'node_modules/pdfjs-dist/cmaps/',
    cMapPacked: true
  }).promise;
  const pages = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    pages.push({
      pageNum,
      items: content.items
    });
  }
  return pages;
}

module.exports = { extractPdfContent };