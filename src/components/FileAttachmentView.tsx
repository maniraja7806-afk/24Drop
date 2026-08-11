import React from 'react';
import { Download, FileText, FileArchive, FileCode, Video, Music, File, Eye } from 'lucide-react';
import { formatBytes, getFileCategory } from '../lib/format';
import { AudioPlayer } from './AudioPlayer';

interface FileAttachmentViewProps {
  fileUrl: string;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  onPreview?: () => void;
  className?: string;
}

export const FileAttachmentView: React.FC<FileAttachmentViewProps> = ({
  fileUrl,
  fileName,
  fileType,
  fileSize,
  onPreview,
  className = ''
}) => {
  const name = fileName || fileUrl.split('/').pop() || 'Attachment';
  const category = getFileCategory(fileType, name);

  if (category === 'image') {
    return (
      <div className={`mt-2 rounded-xl overflow-hidden border border-white/10 bg-neutral-950 group relative ${className}`}>
        <img 
          loading="lazy" 
          src={fileUrl} 
          alt={name} 
          className="max-w-full max-h-96 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity" 
          onClick={onPreview} 
        />
        <div className="p-2 bg-neutral-900/90 backdrop-blur border-t border-white/10 flex items-center justify-between text-xs text-neutral-300">
          <span className="truncate font-medium max-w-[200px]" title={name}>{name}</span>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {fileSize ? <span className="text-neutral-400 text-[11px]">{formatBytes(fileSize)}</span> : null}
            <a 
              href={fileUrl} 
              download={name} 
              onClick={(e) => e.stopPropagation()} 
              className="p-1 hover:bg-white/10 rounded text-neutral-300 hover:text-white transition-colors"
              title="Download image"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (category === 'video') {
    return (
      <div className={`mt-2 rounded-xl overflow-hidden border border-white/10 bg-neutral-950 p-2 ${className}`}>
        <video 
          src={fileUrl} 
          controls 
          className="max-w-full max-h-96 rounded-lg w-full bg-black" 
        />
        <div className="mt-2 flex items-center justify-between text-xs text-neutral-300 px-1">
          <div className="flex items-center space-x-2 truncate">
            <Video className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="font-medium truncate" title={name}>{name}</span>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            {fileSize ? <span className="text-neutral-400 text-[11px]">{formatBytes(fileSize)}</span> : null}
            <a 
              href={fileUrl} 
              download={name} 
              className="p-1 hover:bg-white/10 rounded text-neutral-300 hover:text-white transition-colors"
              title="Download video"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (category === 'audio') {
    return (
      <div className={`mt-2 rounded-xl border border-white/10 bg-neutral-900/80 p-3 space-y-2 ${className}`}>
        <div className="flex items-center justify-between text-xs text-neutral-200">
          <div className="flex items-center space-x-2 truncate">
            <Music className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="font-medium truncate" title={name}>{name}</span>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            {fileSize ? <span className="text-neutral-400 text-[11px]">{formatBytes(fileSize)}</span> : null}
            <a 
              href={fileUrl} 
              download={name} 
              className="p-1 hover:bg-white/10 rounded text-neutral-300 hover:text-white transition-colors"
              title="Download audio"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        <AudioPlayer src={fileUrl} />
      </div>
    );
  }

  // Non-media document / code / archive / file
  const renderIcon = () => {
    switch (category) {
      case 'pdf':
      case 'doc':
        return <FileText className="w-6 h-6 text-red-400 flex-shrink-0" />;
      case 'code':
        return <FileCode className="w-6 h-6 text-emerald-400 flex-shrink-0" />;
      case 'archive':
        return <FileArchive className="w-6 h-6 text-amber-400 flex-shrink-0" />;
      default:
        return <File className="w-6 h-6 text-blue-400 flex-shrink-0" />;
    }
  };

  return (
    <div className={`mt-2 rounded-xl border border-white/10 bg-neutral-900/90 p-3 flex items-center justify-between shadow-md transition-all hover:border-white/20 ${className}`}>
      <div className="flex items-center space-x-3 min-w-0 flex-1 pr-3 cursor-pointer" onClick={onPreview}>
        <div className="p-2.5 bg-white/5 rounded-lg border border-white/5">
          {renderIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white truncate hover:underline" title={name}>
            {name}
          </div>
          <div className="flex items-center space-x-2 text-xs text-neutral-400 mt-0.5">
            {fileSize ? <span>{formatBytes(fileSize)}</span> : null}
            {fileType ? <span className="uppercase text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-neutral-300">{fileType.split('/')[1] || category}</span> : null}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1 flex-shrink-0">
        {onPreview && (
          <button 
            type="button"
            onClick={onPreview}
            className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
            title="Preview file"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
        <a 
          href={fileUrl} 
          download={name}
          className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors"
          title="Download file"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
