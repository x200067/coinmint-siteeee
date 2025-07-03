const fs = require('fs');
const path = require('path');

// Favicon HTML to add
const faviconHTML = '<link rel="icon" type="image/x-icon" href="static/upload/image/20250418/1744947578806756.jpg">';

// Get all HTML files
const htmlFiles = fs.readdirSync('.').filter(file => 
    file.endsWith('.html') && 
    file !== 'index.html' && // Skip index.html as it already has favicon
    !file.includes('admin') &&
    !file.includes('test') &&
    !file.includes('verify')
);

console.log(`Found ${htmlFiles.length} HTML files to update:`);
htmlFiles.forEach(file => console.log(`- ${file}`));

let updatedCount = 0;

htmlFiles.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        
        // Check if favicon already exists
        if (content.includes('rel="icon"') || content.includes("rel='icon'")) {
            console.log(`✓ ${file} - Already has favicon`);
            return;
        }
        
        // Find the head section and add favicon
        if (content.includes('<head>')) {
            // Add favicon after <head> tag
            content = content.replace(
                /<head>/i,
                `<head>\n${faviconHTML}`
            );
        } else if (content.includes('<meta charset')) {
            // Add favicon after charset meta tag
            content = content.replace(
                /(<meta charset[^>]*>)/i,
                `$1\n${faviconHTML}`
            );
        } else if (content.includes('<meta http-equiv="X-UA-Compatible"')) {
            // Add favicon after X-UA-Compatible meta tag
            content = content.replace(
                /(<meta http-equiv="X-UA-Compatible"[^>]*>)/i,
                `$1\n${faviconHTML}`
            );
        } else if (content.includes('<title>')) {
            // Add favicon before title tag
            content = content.replace(
                /(<title>)/i,
                `${faviconHTML}\n$1`
            );
        } else {
            console.log(`⚠️  ${file} - Could not find suitable location to add favicon`);
            return;
        }
        
        // Write the updated content
        fs.writeFileSync(file, content, 'utf8');
        updatedCount++;
        console.log(`✅ ${file} - Favicon added successfully`);
        
    } catch (error) {
        console.error(`❌ ${file} - Error: ${error.message}`);
    }
});

console.log(`\n🎯 Summary: Updated ${updatedCount} out of ${htmlFiles.length} files`);
console.log('✨ All pages will now show your Coinmint logo as favicon!');
