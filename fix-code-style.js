const fs = require('node:fs');
const path = require('node:path');

// Function to convert mixed indentation to spaces and fix other style issues
function fixCodeStyle(content) {
  // Split into lines for processing
  let lines = content.split('\n');
  
  // Fix indentation and other issues line by line
  lines = lines.map(line => {
    // Replace tabs with spaces
    let fixedLine = line.replace(/^\t+/, match => '  '.repeat(match.length));
    
    // Convert var to let/const
    fixedLine = fixedLine.replace(/\bvar\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b(?!\s*=\s*function)/, 'let $1');
    
    // Fix @ts-ignore to @ts-expect-error
    fixedLine = fixedLine.replace(/@ts-ignore/, '@ts-expect-error');
    
    // Add underscore prefix to unused variables in function parameters
    fixedLine = fixedLine.replace(/\b(function\s*\(.*?)(\b[a-zA-Z_$][a-zA-Z0-9_$]*\b)(?=\s*(?:,|\)).*?{[\s\S]*?}\s*$)/, (match, prefix, varName) => {
      if (!content.includes(varName)) {
        return `${prefix}_${varName}`;
      }
      return match;
    });

    return fixedLine;
  });

  // Join lines back together
  let fixedContent = lines.join('\n');
  
  // Add return types to functions
  fixedContent = fixedContent.replace(
    /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\((.*?)\)\s*{/g,
    (match, funcName, params) => {
      if (!match.includes(': ')) {
        return `function ${funcName}(${params}): void {`;
      }
      return match;
    }
  );

  return fixedContent;
}

// Function to process a file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixedContent = fixCodeStyle(content);
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log(`Fixed code style in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Function to recursively process files in a directory
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processDirectory(filePath);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.ts'))) {
      processFile(filePath);
    }
  });
}

// Start processing from the current directory
processDirectory('.');
