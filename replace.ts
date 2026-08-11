import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Plus, X, Smile, Trash2, RotateCcw, Check, Star, Settings } from 'lucide-react';
import clsx from 'clsx';
// ... rest of code
