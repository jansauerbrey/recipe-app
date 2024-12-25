const fs = require('node:fs');
const path = require('node:path');

// Function to convert mixed indentation to spaces
function fixIndentation(content) {
  // Replace tabs with spaces (assuming 2-space indentation)
  const lines = content.split('\n');
  const fixedLines = lines.map(line => {
    // Replace any leading tabs with 2 spaces each
    return line.replace(/^\t+/, match => '  '.repeat(match.length));
  });
  return fixedLines.join('\n');
}

// Function to process a file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixedContent = fixIndentation(content);
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log(`Fixed indentation in: ${filePath}`);
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
