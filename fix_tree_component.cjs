const fs = require('fs');
let code = fs.readFileSync('src/components/FolderAttachmentView.tsx', 'utf8');

const treeComponent = `
type FileNode = {
  name: string;
  file?: any;
  children?: { [key: string]: FileNode };
  isOpen?: boolean;
};

const FileTree: React.FC<{
  node: FileNode;
  level: number;
  onPreviewFile?: (file: any) => void;
  getIconForCategory: (cat: string) => React.ReactNode;
  getFileCategory: (type: string, name: string) => string;
  formatBytes: (bytes: number) => string;
}> = ({ node, level, onPreviewFile, getIconForCategory, getFileCategory, formatBytes }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (node.file) {
    const category = getFileCategory(node.file.type, node.name);
    return (
      <div 
        className="group flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
        style={{ paddingLeft: \`\${level * 16 + 8}px\` }}
        onClick={() => {
          if (onPreviewFile && category !== 'archive') {
            onPreviewFile({ url: node.file.fileUrl, type: node.file.type, name: node.name });
          }
        }}
      >
        <div className="flex items-center space-x-3 min-w-0 pr-4 flex-1">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex flex-shrink-0 items-center justify-center border border-white/5">
            {getIconForCategory(category)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-neutral-200 truncate font-medium group-hover:text-white transition-colors">
              {node.name}
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-neutral-500 truncate mt-0.5">
              <span>{formatBytes(node.file.size)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <a 
            href={node.file.fileUrl}
            download={node.name}
            onClick={(e) => e.stopPropagation()}
            aria-label="Download file"
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Download File"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div 
        className="flex items-center space-x-2 p-2 hover:bg-white/5 rounded-lg cursor-pointer text-white"
        style={{ paddingLeft: \`\${level * 16 + 8}px\` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
        <Folder className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
        <span className="text-sm font-medium">{node.name}</span>
      </div>
      {isOpen && node.children && (
        <div className="flex flex-col">
          {Object.values(node.children).sort((a, b) => {
            if (a.children && !b.children) return -1;
            if (!a.children && b.children) return 1;
            return a.name.localeCompare(b.name);
          }).map(child => (
            <FileTree 
              key={child.name} 
              node={child} 
              level={level + 1} 
              onPreviewFile={onPreviewFile}
              getIconForCategory={getIconForCategory}
              getFileCategory={getFileCategory}
              formatBytes={formatBytes}
            />
          ))}
        </div>
      )}
    </div>
  );
};
`;

code = code.replace(/export const FolderAttachmentView/, treeComponent + '\nexport const FolderAttachmentView');

const fileListReplacement = `              {/* File List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {(() => {
                  if (filteredFiles.length === 0) {
                    return (
                      <div className="py-10 text-center text-neutral-500 text-sm">
                        No files found.
                      </div>
                    );
                  }

                  if (searchQuery.trim()) {
                    // Flat list for search
                    return filteredFiles.map((file, idx) => {
                      const parts = file.name.split('/');
                      const filename = parts.pop();
                      const path = parts.join('/');
                      const category = getFileCategory(file.type, filename);
                      return (
                        <div 
                          key={\`\${file.name}-\${idx}\`}
                          className="group flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                          onClick={() => {
                            if (onPreviewFile && category !== 'archive') {
                              onPreviewFile({ url: file.fileUrl, type: file.type, name: filename });
                            }
                          }}
                        >
                          <div className="flex items-center space-x-3 min-w-0 pr-4 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex flex-shrink-0 items-center justify-center border border-white/5">
                              {getIconForCategory(category)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm text-neutral-200 truncate font-medium group-hover:text-white transition-colors">
                                {filename}
                              </div>
                              <div className="flex items-center space-x-2 text-[11px] text-neutral-500 truncate mt-0.5">
                                {path && (
                                  <>
                                    <span className="truncate max-w-[120px] bg-white/5 px-1.5 rounded">{path}</span>
                                    <span>&bull;</span>
                                  </>
                                )}
                                <span>{formatBytes(file.size)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <a 
                              href={file.fileUrl}
                              download={filename}
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Download file"
                              className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              title="Download File"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      );
                    });
                  }

                  // Tree structure for normal viewing
                  const tree: { [key: string]: FileNode } = {};
                  files.forEach(file => {
                    const parts = file.name.split('/');
                    // Skip the top level folder name if it matches the main folderName
                    if (parts[0] === folderName && parts.length > 1) {
                      parts.shift();
                    }
                    
                    let currentLevel = tree;
                    parts.forEach((part, i) => {
                      if (i === parts.length - 1) {
                        currentLevel[part] = { name: part, file };
                      } else {
                        if (!currentLevel[part]) {
                          currentLevel[part] = { name: part, children: {} };
                        }
                        currentLevel = currentLevel[part].children;
                      }
                    });
                  });

                  return Object.values(tree).sort((a, b) => {
                    if (a.children && !b.children) return -1;
                    if (!a.children && b.children) return 1;
                    return a.name.localeCompare(b.name);
                  }).map(node => (
                    <FileTree 
                      key={node.name} 
                      node={node} 
                      level={0} 
                      onPreviewFile={onPreviewFile}
                      getIconForCategory={getIconForCategory}
                      getFileCategory={getFileCategory}
                      formatBytes={formatBytes}
                    />
                  ));
                })()}
              </div>`;

code = code.replace(/\{\/\* File List \*\/\}.*?\{\/\* Footer \*\/\}/s, fileListReplacement + '\n              {/* Footer */}');

// Let's also fix the footer download icon text
const footerReplacement = `              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-neutral-950">
                <a 
                  href={downloadUrl}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-indigo-900/20"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Folder</span>
                </a>
              </div>`;
code = code.replace(/\{\/\* Footer \*\/\}.*?<\/div>\s*<\/motion\.div>/s, footerReplacement + '\n            </motion.div>');

fs.writeFileSync('src/components/FolderAttachmentView.tsx', code);
