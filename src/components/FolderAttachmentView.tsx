import React, { useState, useMemo, useEffect } from 'react';
import { Download, Folder, Eye, X, FileText, FileArchive, FileCode, Video, Music, File, Search, ChevronRight, ChevronDown } from 'lucide-react';
import { formatBytes, getFileCategory } from '../lib/format';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

interface FolderAttachmentViewProps {
  messageId: string;
  folderName: string;
  folderFiles: string; // JSON string
  isPost?: boolean;
  onPreviewFile?: (file: { url: string; type?: string; name: string }) => void;
}


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
        className="group flex items-center justify-between py-3 px-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer min-h-[56px]"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
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
        style={{ paddingLeft: `${level * 16 + 8}px` }}
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

export const FolderAttachmentView: React.FC<FolderAttachmentViewProps> = ({
  messageId,
  folderName,
  folderFiles,
  isPost = false,
  onPreviewFile
}) => {
const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [composerHeight, setComposerHeight] = useState(0);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);


  useEffect(() => {
    if (!isModalOpen) return;
    const el = document.getElementById('chat-composer');
    if (!el) {
      setComposerHeight(0);
      return;
    }
    const observer = new ResizeObserver(entries => {
      for (let e of entries) {
        setComposerHeight(e.target.getBoundingClientRect().height);
      }
    });
    observer.observe(el);
    setComposerHeight(el.getBoundingClientRect().height);
    return () => observer.disconnect();
  }, [isModalOpen]);
  
  let files: any[] = [];
  try {
    files = JSON.parse(folderFiles) || [];
  } catch (e) {
    //
  }

  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
  
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter(f => f.name.toLowerCase().includes(q));
  }, [files, searchQuery]);

  // Build a tree or sort by folders first
  const sortedFiles = useMemo(() => {
    return [...filteredFiles].sort((a, b) => {
      const aParts = a.name.split('/');
      const bParts = b.name.split('/');
      // If one is in a folder and other is not
      if (aParts.length !== bParts.length) {
        return bParts.length - aParts.length; // More parts = deeper = folder
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredFiles]);

  const downloadUrl = isPost ? `/api/posts/${messageId}/download-folder` : `/api/messages/${messageId}/download-folder`;

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'image': return <File className="w-4 h-4 text-emerald-400" />;
      case 'video': return <Video className="w-4 h-4 text-blue-400" />;
      case 'audio': return <Music className="w-4 h-4 text-purple-400" />;
      case 'pdf':
      case 'doc': return <FileText className="w-4 h-4 text-red-400" />;
      case 'code': return <FileCode className="w-4 h-4 text-emerald-400" />;
      case 'archive': return <FileArchive className="w-4 h-4 text-amber-400" />;
      default: return <File className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="mt-2 rounded-xl border border-white/10 bg-neutral-900/90 p-3 sm:p-4 shadow-md transition-all cursor-pointer hover:bg-neutral-800/90 flex items-center justify-between group"
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1 pr-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
            <Folder className="w-7 h-7 text-indigo-400 flex-shrink-0 fill-indigo-400/20" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-white truncate" title={folderName}>
              {folderName}
            </div>
            <div className="flex items-center space-x-2 text-xs text-neutral-400 mt-1">
              <span>{files.length} {files.length === 1 ? 'file' : 'files'}</span>
              <span>&bull;</span>
              <span>{formatBytes(totalSize)}</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <a 
            href={downloadUrl}
            onClick={(e) => e.stopPropagation()}
            title="Download folder"
            aria-label="Download folder"
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-neutral-300 hover:text-white transition-colors flex items-center justify-center border border-white/5 hover:border-white/10"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div 
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm overscroll-none"
            style={{ paddingBottom: composerHeight ? `${composerHeight + 16}px` : undefined }}
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(false);
            }}
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col h-[380px] max-h-full"
            >
              {/* Header */}
              <div className="flex-shrink-0 px-5 py-4 border-b border-white/10 flex items-center justify-between bg-neutral-950">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Folder className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate text-base">{folderName}</h3>
                    <p className="text-xs text-neutral-400">{files.length} files &bull; {formatBytes(totalSize)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="flex-shrink-0 p-3 border-b border-white/5 bg-neutral-900">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input 
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

                            {/* File List */}
              <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain p-2 pb-4 space-y-1 custom-scrollbar">
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
                          key={`${file.name}-${idx}`}
                          className="group flex items-center justify-between py-3 px-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer min-h-[56px]"
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
              </div>
                            {/* Footer */}
              <div className="flex-shrink-0 p-4 border-t border-white/10 bg-neutral-950">
                <a 
                  href={downloadUrl}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-indigo-900/20"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Folder</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
