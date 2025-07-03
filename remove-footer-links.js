const fs = require('fs');

// Get all HTML files
const htmlFiles = fs.readdirSync('.').filter(file => 
    file.endsWith('.html') && 
    !file.includes('admin') &&
    !file.includes('test') &&
    !file.includes('verify') &&
    !file.includes('deploy')
);

console.log(`🔍 Found ${htmlFiles.length} HTML files to clean:`);

let updatedCount = 0;
let alreadyCleanCount = 0;

htmlFiles.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        let originalContent = content;
        
        // Remove various patterns of Regulatory Information and Sitemap links
        
        // Pattern 1: Full pattern with both links
        content = content.replace(
            /<span><a href="https:\/\/beian\.miit\.gov\.cn\/" target="_blank" rel="nofollow">Regulatory Information<\/a> \| <a href="index\.php\/sitemap\.xml" target="_blank">Sitemap<\/a><\/span>/g,
            ''
        );
        
        // Pattern 2: Regulatory Info (shortened) with Sitemap
        content = content.replace(
            /<span><a href="https:\/\/beian\.miit\.gov\.cn\/" target="_blank" rel="nofollow">Regulatory Info<\/a> \| <a href="index\.php\/sitemap\.xml" target="_blank">Sitemap<\/a><\/span>/g,
            ''
        );
        
        // Pattern 3: Just Sitemap
        content = content.replace(
            /<span><a href="index\.php\/sitemap\.xml" target="_blank">Sitemap<\/a><\/span>/g,
            ''
        );
        
        // Pattern 4: Sitemap with typo (Sitemap)
        content = content.replace(
            /<span><a href="index\.php\/sitemap\.xml" target="_blank">Sitemap<\/a><\/span>/g,
            ''
        );
        
        // Pattern 5: Any remaining regulatory information links
        content = content.replace(
            /<a href="https:\/\/beian\.miit\.gov\.cn\/" target="_blank" rel="nofollow">Regulatory Information<\/a>/g,
            ''
        );
        
        content = content.replace(
            /<a href="https:\/\/beian\.miit\.gov\.cn\/" target="_blank" rel="nofollow">Regulatory Info<\/a>/g,
            ''
        );
        
        // Pattern 6: Any remaining sitemap links
        content = content.replace(
            /<a href="index\.php\/sitemap\.xml" target="_blank">Sitemap<\/a>/g,
            ''
        );
        
        // Clean up any leftover separators
        content = content.replace(/\s*\|\s*<\/span>/g, '</span>');
        content = content.replace(/<span>\s*\|\s*/g, '<span>');
        
        // Remove empty spans
        content = content.replace(/<span><\/span>/g, '');
        content = content.replace(/<span>\s*<\/span>/g, '');
        
        if (content !== originalContent) {
            // Write the updated content
            fs.writeFileSync(file, content, 'utf8');
            updatedCount++;
            console.log(`✅ ${file} - Footer links removed`);
        } else {
            alreadyCleanCount++;
            console.log(`✓ ${file} - Already clean`);
        }
        
    } catch (error) {
        console.error(`❌ ${file} - Error: ${error.message}`);
    }
});

console.log(`\n🎯 Summary:`);
console.log(`- Files already clean: ${alreadyCleanCount}`);
console.log(`- Files cleaned: ${updatedCount}`);
console.log(`- Total files processed: ${htmlFiles.length}`);
console.log('\n✨ All "Regulatory Information" and "Sitemap" links have been removed from footer!');

// Verify the cleanup
console.log('\n🔍 Verification - checking for any remaining links:');
htmlFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('Regulatory Information') || content.includes('Regulatory Info') || content.includes('Sitemap')) {
            console.log(`⚠️  ${file} - Still contains footer links!`);
        } else {
            console.log(`✓ ${file} - Clean`);
        }
    } catch (error) {
        console.error(`❌ ${file} - Verification error: ${error.message}`);
    }
});
