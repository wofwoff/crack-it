import fs from 'fs';
import path from 'path';
import { NEW_DBMS } from './new-questions-dbms.js';
import { NEW_OS } from './new-questions-os.js';
import { NEW_CN } from './new-questions-cn.js';
import { NEW_OOP } from './new-questions-oop.js';
import { QUESTIONS } from './src/content.js';

// Configuration
const REQUIRED_KEYS = [
  'id',
  'subject',
  'concept',
  'difficulty',
  'stem',
  'options',
  'correctIndex',
  'proTip',
  'lesson'
];

const TARGET_SUBJECTS = ['DBMS', 'OS', 'CN', 'OOP'];

const SOURCES = [
  { name: 'new-questions-dbms.js', filePath: './new-questions-dbms.js', array: NEW_DBMS, filterSubject: false },
  { name: 'new-questions-os.js', filePath: './new-questions-os.js', array: NEW_OS, filterSubject: false },
  { name: 'new-questions-cn.js', filePath: './new-questions-cn.js', array: NEW_CN, filterSubject: false },
  { name: 'new-questions-oop.js', filePath: './new-questions-oop.js', array: NEW_OOP, filterSubject: false },
  { name: 'src/content.js', filePath: './src/content.js', array: QUESTIONS, filterSubject: true }
];

// Helper to find the matching closing brace in a string starting at startIndex
function findMatchingBrace(content, startIndex) {
  let braceCount = 0;
  let inString = null;
  let escaped = false;
  
  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    
    if (inString) {
      if (char === inString) {
        inString = null;
      }
      continue;
    }
    
    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      continue;
    }
    
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        return i;
      }
    }
  }
  return -1;
}

// Helper to parse key-value pairs from source code substring
function parseKeyValuePairs(source) {
  const result = [];
  let i = 0;
  let inString = null;
  let escaped = false;
  
  while (i < source.length) {
    const char = source[i];
    
    if (escaped) {
      escaped = false;
      i++;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      i++;
      continue;
    }
    
    if (inString) {
      if (char === inString) {
        inString = null;
      }
      i++;
      continue;
    }
    
    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      i++;
      continue;
    }
    
    const remaining = source.slice(i);
    const idMatch = /^[a-zA-Z0-9_]+\s*:/.exec(remaining);
    if (idMatch) {
      const keyName = idMatch[0].split(':')[0].trim();
      i += idMatch[0].length;
      
      while (i < source.length && /\s/.test(source[i])) {
        i++;
      }
      
      if (source[i] === '"' || source[i] === "'" || source[i] === '`') {
        const quoteChar = source[i];
        i++; // skip quote
        let valRaw = "";
        let valEscaped = false;
        while (i < source.length) {
          const valChar = source[i];
          if (valEscaped) {
            valRaw += '\\' + valChar;
            valEscaped = false;
            i++;
            continue;
          }
          if (valChar === '\\') {
            valEscaped = true;
            i++;
            continue;
          }
          if (valChar === quoteChar) {
            break;
          }
          valRaw += valChar;
          i++;
        }
        i++; // skip close quote
        result.push({
          key: keyName,
          quote: quoteChar,
          raw: valRaw
        });
      }
      continue;
    }
    
    i++;
  }
  return result;
}

// Maps file path to its content
const fileContentsCache = {};

function getQuestionSourceFields(filePath, questionId) {
  if (!fileContentsCache[filePath]) {
    fileContentsCache[filePath] = fs.readFileSync(filePath, 'utf8');
  }
  const content = fileContentsCache[filePath];
  
  // Find id field
  const idRegex = new RegExp(`id:\\s*(['"\`])${questionId}\\1`);
  const match = idRegex.exec(content);
  if (!match) {
    return null;
  }
  
  const idIndex = match.index;
  
  // Find start brace of the question object
  let startIndex = -1;
  for (let i = idIndex; i >= 0; i--) {
    if (content[i] === '{') {
      startIndex = i;
      break;
    }
  }
  if (startIndex === -1) {
    return null;
  }
  
  const endIndex = findMatchingBrace(content, startIndex);
  if (endIndex === -1) {
    return null;
  }
  
  const questionSource = content.slice(startIndex, endIndex + 1);
  return parseKeyValuePairs(questionSource);
}

// Main execution
console.log('=== Starting Question Verification ===');

let totalChecked = 0;
let totalViolations = 0;
const violationsLog = [];

for (const source of SOURCES) {
  console.log(`\nProcessing source: ${source.name}...`);
  const questionsToVerify = source.filterSubject
    ? source.array.filter(q => TARGET_SUBJECTS.includes(q.subject))
    : source.array;
  
  console.log(`Found ${questionsToVerify.length} questions to check.`);
  
  for (const q of questionsToVerify) {
    totalChecked++;
    const qViolations = [];
    
    // 1. Check required keys
    for (const key of REQUIRED_KEYS) {
      if (!(key in q)) {
        qViolations.push(`Missing required key: "${key}"`);
      }
    }
    
    // If ID is missing, we use a placeholder for logging
    const qId = q.id || `<unknown-id-subject-${q.subject || 'unknown'}>`;
    
    // 2. Check options array size
    if (q.options) {
      if (!Array.isArray(q.options)) {
        qViolations.push(`"options" is not an array`);
      } else if (q.options.length !== 4) {
        qViolations.push(`"options" array size is ${q.options.length} (expected 4)`);
      }
    }
    
    // 3. Check correctIndex
    if ('correctIndex' in q) {
      if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3 || !Number.isInteger(q.correctIndex)) {
        qViolations.push(`"correctIndex" is ${q.correctIndex} (expected integer 0-3)`);
      }
    }
    
    // 4 & 5. Check options text, sub, fix, distractors and correctIndex fix
    if (q.options && Array.isArray(q.options) && typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3) {
      for (let i = 0; i < q.options.length; i++) {
        const opt = q.options[i];
        if (!opt || typeof opt !== 'object') {
          qViolations.push(`Option at index ${i} is not an object`);
          continue;
        }
        
        // Distractor check (incorrect options)
        if (i !== q.correctIndex) {
          if (!('fix' in opt) || typeof opt.fix !== 'string' || opt.fix.trim() === '') {
            qViolations.push(`Distractor option at index ${i} has empty or missing "fix" explanation`);
          }
        } else {
          // Correct option check
          if (!('fix' in opt) || opt.fix !== '') {
            qViolations.push(`Correct option at index ${i} must have "fix" as empty string (""), but got "${opt.fix || ''}"`);
          }
        }
      }
    }
    
    // 6. Check code blocks in runtime string values (newline count and compression)
    const fieldsToInspect = [
      { name: 'stem', value: q.stem },
      { name: 'proTip', value: q.proTip },
      { name: 'lesson', value: q.lesson },
      { name: 'remember', value: q.remember },
      { name: 'interviewAnswer', value: q.interviewAnswer }
    ];
    
    if (q.options && Array.isArray(q.options)) {
      q.options.forEach((opt, idx) => {
        if (opt) {
          fieldsToInspect.push({ name: `options[${idx}].text`, value: opt.text });
          fieldsToInspect.push({ name: `options[${idx}].sub`, value: opt.sub });
          fieldsToInspect.push({ name: `options[${idx}].fix`, value: opt.fix });
        }
      });
    }
    
    for (const field of fieldsToInspect) {
      if (typeof field.value === 'string' && field.value.includes('```')) {
        const regex = /```([\s\S]*?)```/g;
        let match;
        while ((match = regex.exec(field.value)) !== null) {
          const codeContent = match[1];
          if (!codeContent.includes('\n')) {
            qViolations.push(`Code block in "${field.name}" is compressed on a single line (missing newlines)`);
          }
        }
      }
    }
    
    // 7. Check if any string literal contains raw escaped \n characters representing code block lines in source file
    const sourceFields = getQuestionSourceFields(source.filePath, qId);
    if (sourceFields) {
      for (const sf of sourceFields) {
        if (sf.quote !== '`' && sf.raw.includes('```') && sf.raw.includes('\\n')) {
          qViolations.push(`Field "${sf.key}" contains a code block with escaped '\\n' characters instead of using backticks (template literals)`);
        }
      }
    }
    
    // Log violations if any
    if (qViolations.length > 0) {
      totalViolations += qViolations.length;
      violationsLog.push({
        id: qId,
        subject: q.subject,
        source: source.name,
        errors: qViolations
      });
    }
  }
}

console.log('\n=== Verification Summary ===');
console.log(`Total questions checked: ${totalChecked}`);
console.log(`Total violations found: ${totalViolations}`);

if (violationsLog.length > 0) {
  console.log('\n=== Violations Details ===');
  violationsLog.forEach(v => {
    console.log(`\n[Question ID: ${v.id}] [Subject: ${v.subject}] [Source: ${v.source}]`);
    v.errors.forEach(err => {
      console.log(`  - ERROR: ${err}`);
    });
  });
  process.exit(1);
} else {
  console.log('\nAll checked questions passed validation successfully!');
  process.exit(0);
}
