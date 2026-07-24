const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const replacement = `  // --- Background Cleanup ---
  // Delete expired items every minute
  setInterval(async () => {
    const now = new Date().toISOString();
    
    // Select files to delete from FS and Cloudinary
    const expiredPosts = db.prepare('SELECT fileUrl FROM posts WHERE expiresAt < ? AND fileUrl IS NOT NULL').all(now);
    const expiredMsgs = db.prepare('SELECT fileUrl FROM messages WHERE expiresAt < ? AND fileUrl IS NOT NULL').all(now);
    
    for (const item of [...expiredPosts, ...expiredMsgs]) {
      if (item.fileUrl) {
        if (item.fileUrl.includes('cloudinary.com')) {
          if (process.env.CLOUDINARY_CLOUD_NAME) {
            try {
              // Extract public_id from Cloudinary URL
              // Format: https://res.cloudinary.com/<cloud_name>/<resource_type>/<type>/<version>/<public_id>.<ext>
              const urlParts = item.fileUrl.split('/');
              const filenameWithExt = urlParts[urlParts.length - 1];
              const publicId = filenameWithExt.split('.')[0];
              await cloudinary.uploader.destroy(publicId);
            } catch (err) {
              console.error('Failed to delete from Cloudinary:', err);
            }
          }
        } else if (item.fileUrl.startsWith('/uploads/')) {
          const filename = item.fileUrl.replace('/uploads/', '');
          const filepath = path.join(uploadDir, filename);
          if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        }
      }
    }

    db.prepare('DELETE FROM posts WHERE expiresAt < ?').run(now);`;

code = code.replace(/  \/\/ --- Background Cleanup ---\n  \/\/ Delete expired items every minute\n  setInterval\(\(\) => \{\n    const now = new Date\(\)\.toISOString\(\);\n    \n    \/\/ Select files to delete from FS\n    const expiredPosts = db\.prepare\('SELECT fileUrl FROM posts WHERE expiresAt < \? AND fileUrl IS NOT NULL'\)\.all\(now\) as any\[\];\n    const expiredMsgs = db\.prepare\('SELECT fileUrl FROM messages WHERE expiresAt < \? AND fileUrl IS NOT NULL'\)\.all\(now\) as any\[\];\n    \n    \[\.\.\.expiredPosts, \.\.\.expiredMsgs\]\.forEach\(\(item: any\) => \{\n      const filename = item\.fileUrl\.replace\('\/uploads\/', ''\);\n      const filepath = path\.join\(uploadDir, filename\);\n      if \(fs\.existsSync\(filepath\)\) fs\.unlinkSync\(filepath\);\n    \}\);\n\n    db\.prepare\('DELETE FROM posts WHERE expiresAt < \?'\)\.run\(now\);/g, replacement);

fs.writeFileSync('server.ts', code);
