const fs = require('fs');
let code = fs.readFileSync('src/components/MainApp.tsx', 'utf8');

// The top part is broken. Let's find:
// const highlightText = ...
// export function MainApp

const parts = code.split('export function MainApp({ session, onLogout');
let topPart = parts[0];
let bottomPart = 'export function MainApp({ session, onLogout' + parts[1];

// we want to fix topPart
topPart = `import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Globe, LogOut, Send, Image as ImageIcon, X, Trash2, Plus, Mic, AudioLines, Sparkles, Telescope, Cpu, Paperclip, Check, CheckCheck, Copy, Loader2, Triangle, Upload, Camera, Square, Play, Pause } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { socket } from '../lib/socket';
import { Countdown } from './Countdown';
import clsx from 'clsx';
import { initAuth, googleSignIn, getAccessToken } from '../lib/auth';
import { loadPickerApi, openPicker } from '../lib/picker';
import { AudioVisualizer } from './AudioVisualizer';
import { LargeAudioVisualizer } from './LargeAudioVisualizer';
import { AudioTrimmer } from './AudioTrimmer';
import { RecordingTimer } from './RecordingTimer';
import { AudioPlayer } from './AudioPlayer';
import { DissolvingItem } from './DissolvingItem';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const highlightText = (text: string, query: string) => {
  if (!query) return text;
  const parts = text.split(new RegExp(\`(\\\${query.replace(/[.*+?^\\\${}()|[\\]\\\\]/g, '\\\\$&')})\`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-500/40 text-inherit rounded-sm px-0.5">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
};
`;

code = topPart + bottomPart;
fs.writeFileSync('src/components/MainApp.tsx', code);
