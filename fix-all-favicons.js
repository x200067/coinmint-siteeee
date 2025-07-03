const fs = require('fs');

// Favicon HTML to add
const faviconHTML = '<link rel="icon" type="image/x-icon" href="static/upload/image/20250418/1744947578806756.jpg">';

// Get all HTML files
const htmlFiles = fs.readdirSync('.').filter(file => 
    file.endsWith('.html') && 
    !file.includes('admin') &&
    !file.includes('test') &&
    !file.includes('verify') &&
    !file.includes('deploy')
);

console.log(`🔍 Found ${htmlFiles.length} HTML files to check and update:`);

let updatedCount = 0;
let alreadyHadCount = 0;

htmlFiles.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        
        // Check if favicon already exists
        if (content.includes('rel="icon"') || content.includes("rel='icon'")) {
            console.log(`✓ ${file} - Already has favicon`);
            alreadyHadCount++;
            return;
        }
        
        // Find the best place to add favicon
        let updated = false;
        
        // Method 1: After <head> tag
        if (content.includes('<head>') && !updated) {
            content = content.replace(
                /<head>/i,
                `<head>\n${faviconHTML}`
            );
            updated = true;
        }
        
        // Method 2: After charset meta tag
        if (!updated && content.includes('<meta charset')) {
            content = content.replace(
                /(<meta charset[^>]*>)/i,
                `$1\n${faviconHTML}`
            );
            updated = true;
        }
        
        // Method 3: After X-UA-Compatible meta tag
        if (!updated && content.includes('X-UA-Compatible')) {
            content = content.replace(
                /(<meta[^>]*X-UA-Compatible[^>]*>)/i,
                `$1\n${faviconHTML}`
            );
            updated = true;
        }
        
        // Method 4: Before title tag
        if (!updated && content.includes('<title>')) {
            content = content.replace(
                /(<title>)/i,
                `${faviconHTML}\n$1`
            );
            updated = true;
        }
        
        // Method 5: After viewport meta tag
        if (!updated && content.includes('viewport')) {
            content = content.replace(
                /(<meta[^>]*viewport[^>]*>)/i,
                `$1\n${faviconHTML}`
            );
            updated = true;
        }
        
        if (updated) {
            // Write the updated content
            fs.writeFileSync(file, content, 'utf8');
            updatedCount++;
            console.log(`✅ ${file} - Favicon added successfully`);
        } else {
            console.log(`⚠️  ${file} - Could not find suitable location to add favicon`);
        }
        
    } catch (error) {
        console.error(`❌ ${file} - Error: ${error.message}`);
    }
});

console.log(`\n🎯 Summary:`);
console.log(`- Files already with favicon: ${alreadyHadCount}`);
console.log(`- Files updated with favicon: ${updatedCount}`);
console.log(`- Total files processed: ${htmlFiles.length}`);
console.log('\n✨ All pages will now show your Coinmint logo as favicon!');

// Verify the updates
console.log('\n🔍 Verification:');
htmlFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('rel="icon"') || content.includes("rel='icon'")) {
            console.log(`✓ ${file} - Favicon confirmed`);
        } else {
            console.log(`❌ ${file} - Favicon missing!`);
        }
    } catch (error) {
        console.error(`❌ ${file} - Verification error: ${error.message}`);
    }
});
