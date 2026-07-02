const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      // Fix Deal Requests
      content = content.replace(/property:property_id/g, 'listing:listing_id');
      content = content.replace(/req\.property_id/g, 'req.listing_id');
      content = content.replace(/req\.property\./g, 'req.listing.');
      content = content.replace(/req!\.property_id/g, 'req!.listing_id');
      content = content.replace(/req!\.property\./g, 'req!.listing.');
      content = content.replace(/property_id:\s*listing\.id/g, 'listing_id: listing.id');
      
      // Fix Support Threads
      content = content.replace(/opener_id=eq/g, 'user_id=eq');
      content = content.replace(/opener_id:/g, 'user_id:');
      content = content.replace(/\.opener_id/g, '.user_id');

      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}

replaceInDir('d:/brokersconnect/src');
