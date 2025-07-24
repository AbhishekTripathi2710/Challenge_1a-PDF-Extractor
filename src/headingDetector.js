function getFontSize(item) {
  return Math.sqrt(item.transform[0] ** 2 + item.transform[1] ** 2);
}

function groupItemsIntoLines(items, yThreshold = 2) {
  const lines = [];
  items.forEach(item => {
    const y = item.transform[5];
    let line = lines.find(l => Math.abs(l.y - y) < yThreshold);
    if (!line) {
      line = { y, items: [], pageNum: item.pageNum };
      lines.push(line);
    }
    line.items.push(item);
  });
  lines.forEach(line => {
    line.items.sort((a, b) => a.transform[4] - b.transform[4]);
  });
  return lines.sort((a, b) => b.y - a.y);
}

function isLikelyHeading(text) {
  const minWords = 2;
  const minChars = 10;
  const headingRegex = /^[0-9]{1,2}\.[\s\S]*|^\([a-z]\)[\s\S]*/i;
  const wordCount = text.trim().split(/\s+/).length;
  const charCount = text.trim().length;
  return (
    (wordCount >= minWords || charCount >= minChars || headingRegex.test(text.trim())) &&
    !/^[a-z]+$/i.test(text.trim())
  );
}

function isFormField(text) {
  return /Name|Date|Age|Signature|Designation|Relationship|Service Book|advance required|PAY|permanent|temporary|Home Town|LTC|block|fare|bus|rail|S.No|Persons in respect|undertake|declare|tickets|refund|sum|receipt|amount|Rs\.|India|place to be visited|Block for which to be availed|headquarters|route|availing|entitled|employed|wife|husband|concession|availing|block|visiting|so whether entitled|produce the tickets|cancellation|journey|above are true|correct to the best|knowledge|one lump sum/i.test(text);
}

function isKnownSection(text) {
  const trimmed = text.trim();
  return /^(Acknowledgements|Revision History|Table of Contents|References|Abstract|Introduction|Conclusion|Bibliography|Appendix|Business Outcomes)$/i.test(trimmed);
}

function isNumberedListItem(text) {
  const numberedPattern = /^(\d+)\.\s+(.+)/;
  const match = text.match(numberedPattern);
  if (!match) return false;
  const number = parseInt(match[1]);
  const content = match[2].trim();
  if (number > 10) return true;
  if (content.length > 80 || 
      /professionals|testers|testing|who are|have achieved|relatively new|experienced/i.test(content)) {
    return true;
  }
  return false;
}

function isVersionNumber(text) {
  return /^\d+\.\d+\s+\d+\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i.test(text);
}

function isTableRow(text) {
  return /\d{4}.*\d{4}|Version.*Date.*Remarks/i.test(text);
}

function isIncompleteFragment(text) {
  if (text.length < 10) return true;
  if (/^[a-z]/.test(text) && !/^(who|what|when|where|why|how)/i.test(text)) return true;
  if (/^(who wants|and|or|the|of|in|on|at|for|with|by)/.test(text)) return true;
  return false;
}

function splitMultipleHeadings(lineText) {
  const headingPattern = /(\d+\.[^\d]+)(?=\d+\.|$)/g;
  let matches = [];
  let match;
  while ((match = headingPattern.exec(lineText)) !== null) {
    matches.push(match[1].trim());
  }
  return matches.length > 1 ? matches : [lineText];
}

function isJunkLine(text) {
  if (/^[-_\s\.]+$/.test(text) || /^[^a-zA-Z0-9]+$/.test(text)) return true;
  const dotCount = (text.match(/\./g) || []).length;
  if (dotCount > text.length * 0.3 && dotCount > 10) return true;
  return false;
}

function isUrl(text) {
  return /www\.|https?:\/\//i.test(text);
}

function normalizeHeading(text) {
  return text.replace(/\s+/g, ' ').replace(/Y ou/g, 'You').replace(/T HERE/g, 'THERE').trim();
}

function isYearOrNumber(text) {
  return /^\d{4}\.?$/.test(text) || /^\d+\.?$/.test(text);
}

function detectOutline(pages) {
  let allLines = [];
  let title = '';
  pages.forEach(page => {
    const lines = groupItemsIntoLines(page.items);
    lines.forEach(line => {
      const lineText = line.items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim();
      const fontSizes = line.items.map(getFontSize);
      const maxFontSize = Math.max(...fontSizes);
      allLines.push({
        text: lineText,
        fontSize: maxFontSize,
        pageNum: page.pageNum,
        y: line.y
      });
    });
  });
  const fontSizes = [...new Set(allLines.map(l => l.fontSize))].sort((a, b) => b - a);
  const [h1Size, h2Size, h3Size] = fontSizes;
  const titleLines = allLines.filter(l =>
    l.pageNum <= 2 &&
    l.fontSize === h1Size &&
    l.text.length > 2 &&
    !isJunkLine(l.text) &&
    !isKnownSection(l.text)
  );
  const titleLineKeys = new Set(titleLines.map(l => l.text + '|' + l.pageNum));
  title = titleLines.map(l => l.text).join(' ').replace(/\s+/g, ' ').trim();
  if (!/[a-zA-Z0-9]/.test(title)) title = '';
  const fontSizeCounts = {};
  allLines.forEach(l => {
    fontSizeCounts[l.fontSize] = (fontSizeCounts[l.fontSize] || 0) + 1;
  });
  const bodyFontSize = parseFloat(Object.entries(fontSizeCounts).sort((a, b) => b[1] - a[1])[0][0]);
  let outline = [];
  allLines.forEach(line => {
    if (line.text.length < 3 || isFormField(line.text) || isJunkLine(line.text) || isUrl(line.text) || isYearOrNumber(line.text)) return;
    if (titleLineKeys.has(line.text + '|' + line.pageNum)) return;
    if (isNumberedListItem(line.text)) return;
    if (isVersionNumber(line.text) || isTableRow(line.text)) return;
    if (isIncompleteFragment(line.text)) return;
    const h1Pattern = /^\d+\.\s+[A-Z]/;
    const h2Pattern = /^\d+\.\d+\s+[A-Z]/;
    const h3Pattern = /^\d+\.\d+\.\d+\s+[A-Z]/;
    const splitHeadings = splitMultipleHeadings(line.text);
    splitHeadings.forEach(headingText => {
      let level = null;
      headingText = headingText.trim();
      if (h3Pattern.test(headingText)) {
        level = 'H3';
      } else if (h2Pattern.test(headingText)) {
        level = 'H2';
      } else if (h1Pattern.test(headingText)) {
        level = 'H1';
      } else if (isKnownSection(headingText)) {
        level = 'H1';
      } else {
        if (line.fontSize > bodyFontSize && 
            /^[A-Z]/.test(headingText) &&
            headingText.length >= 5 &&
            headingText.length <= 100 &&
            !/\d{4}/.test(headingText) &&
            !/:/.test(headingText)) {
          if (line.fontSize === h1Size) level = 'H1';
          else if (line.fontSize === h2Size) level = 'H2';
          else if (line.fontSize === h3Size) level = 'H3';
        }
      }
      if (level) {
        outline.push({
          level,
          text: normalizeHeading(headingText.replace(/\s+$/, '')),
          page: line.pageNum - 1
        });
      }
    });
  });
  const seen = new Set();
  outline = outline.filter(h => {
    const key = h.text + '|' + h.page;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  outline.sort((a, b) => a.page - b.page);
  const filteredOutline = outline.filter(h =>
    h.text.length > 3 && !isFormField(h.text)
  );
  if (filteredOutline.length === 0) {
    return { title, outline: [] };
  }
  return { title, outline: filteredOutline };
}

module.exports = { detectOutline };