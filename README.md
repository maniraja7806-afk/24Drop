# 24Drop — Ephemeral Multimedia Sharing & Real-Time Messaging Platform

> **"Share Anything. Gone in 24 Hours."**  
> *No Email. No Passwords. No Traces.*

---

## 📖 Table of Contents

1. [Executive Overview](#-executive-overview)
2. [System Architecture](#-system-architecture)
3. [Technology Stack](#-technology-stack)
4. [Key Features & Capabilities](#-key-features--capabilities)
   - [Zero-Auth Identity Generation](#1-zero-auth-identity-generation)
   - [Public Feed & Private 1:1 Direct Chats](#2-public-feed--private-11-direct-chats)
   - [Advanced Media Pipeline](#3-advanced-media-pipeline)
   - [Dual Storage & Quota Tracking](#4-dual-storage--quota-tracking)
   - [Real-Time Bi-Directional Engine](#5-real-time-bi-directional-engine)
   - [Automated 24-Hour Purge & Garbage Collection](#6-automated-24-hour-purge--garbage-collection)
   - [Offline-First Synchronization](#7-offline-first-synchronization)
5. [Database Schemas & Data Models](#-database-schemas--data-models)
6. [API & WebSocket Specifications](#-api--websocket-specifications)
   - [RESTful Endpoints](#restful-endpoints)
   - [Socket.IO Events](#socketio-events)
7. [Project Directory Structure](#-project-directory-structure)
8. [Environment Variables & Configuration](#-environment-variables--configuration)
9. [Installation, Local Development & Deployment](#-installation-local-development--deployment)
10. [Security, Privacy & Performance Considerations](#-security-privacy--performance-considerations)

---

## ⚡ Executive Overview

**24Drop** is an ephemeral real-time communication and multimedia collaboration application designed around privacy, autonomy, and temporal data lifecycles. Users interact without requiring personal emails, phone numbers, passwords, or centralized credentials. Every session, post, direct chat message, attachment, and reaction automatically self-destructs precisely 24 hours from creation, wiping both the database records and physical file storage.

The platform provides a Google Material-inspired, distraction-free interface engineered with client-side audio visualizers, inline audio waveform trimming, full folder archiving and unzipping, pan-and-zoom inspection, and real-time Socket.IO synchronization.

---

## 🏛 System Architecture

```
                                  ┌────────────────────────────────────────┐
                                  │           Web Browser Client           │
                                  │  (React 19 + Tailwind CSS + Motion)   │
                                  └───────────────┬────────────────────────┘
                                                  │
                            HTTP / REST           │         WebSocket (WSS)
                          (Fetch / JSON / Files)  │       (Realtime Bi-directional)
                                                  ▼
                         ┌──────────────────────────────────────────────────┐
                         │              Express.js API Gateway              │
                         │             (Node.js + TypeScript)               │
                         └───────┬─────────────────┬──────────────────┬─────┘
                                 │                 │                  │
                                 ▼                 ▼                  ▼
                    ┌──────────────────┐  ┌─────────────────┐  ┌──────────────┐
                    │  MongoDB Atlas   │  │ Cloudinary CDN  │  │ Local Disk   │
                    │ (Mongoose + TTL) │  │  (Media Cloud)  │  │  (/uploads)  │
                    └──────────────────┘  └─────────────────┘  └──────────────┘
                                 ▲
                                 │ Every 60s
                    ┌────────────────────────────┐
                    │   Background Purge Worker  │
                    │ (File Unlink & Cloud Destroy)│
                    └────────────────────────────┘
```

---

## 🛠 Technology Stack

### Frontend Client
- **Core Framework**: React 19, TypeScript
- **Bundler & Dev Server**: Vite 6
- **Styling & Layout**: Tailwind CSS v4 with `@tailwindcss/vite`
- **Animation & Transitions**: Motion (`motion/react`)
- **Icons**: Lucide React (`lucide-react`)
- **Media Manipulation**:
  - `react-image-crop` — In-browser image cropping and aspect framing
  - `react-zoom-pan-pinch` — High-resolution media inspection with interactive zoom & drag
  - Native Web Audio API (`AudioContext`, `AnalyserNode`) — Live microphone frequency graphing & waveform trimming
- **Notifications & UI Feedback**: `sonner` toast notifications
- **Real-Time Client**: `socket.io-client` v4

### Backend Server
- **Runtime**: Node.js (v22+)
- **Server Framework**: Express.js 4, TypeScript via `tsx`
- **Transpilation & Bundling**: `esbuild` CommonJS bundle (`dist/server.cjs`)
- **Real-Time Gateway**: Socket.IO v4 with cross-origin negotiation
- **File Upload Handler**: `multer` (supports streaming direct uploads up to 5GB)
- **Archive Streamer**: `archiver` for dynamic on-the-fly zip packaging of directory uploads

### Persistence & Storage
- **Database**: MongoDB Atlas with `mongoose` ORM
- **Automatic Expiration**: Native MongoDB TTL index on `expiresAt`
- **Cloud Storage Integration**: Cloudinary API v2 for distributed asset hosting
- **Local Fallback Storage**: Local persistent `/uploads` volume with static file serving

---

## 🚀 Key Features & Capabilities

### 1. Zero-Auth Identity Generation
- **No Sign-Up Overhead**: Users never provide passwords, emails, or OAuth tokens.
- **Procedural Handles**: Generates human-friendly, memorable pseudonyms combining adjectives, nouns, and randomized numerical seeds (e.g., `SolarWolf1`, `PixelNomad61`).
- **Cryptographic Session**: Issues a 24-hour persistent UUID session key passed via the `x-session-id` header.
- **Refresh Control**: Users can instantly re-roll suggested identities on demand.

### 2. Public Feed & Private 1:1 Direct Chats
- **Global Drop Feed**: Broadcast text announcements, code snippets, photos, videos, audio voice notes, or compressed file bundles visible to all active users for 24 hours.
- **Peer-to-Peer 1:1 Chats**: Secure direct messaging with real-time delivery and read status receipts (`sent` ➔ `delivered` ➔ `seen`).
- **Message Quoting & Threading**: Reply directly to specific messages via parent referencing (`parentId`).
- **Pins & Bookmarks**: Pin crucial posts and top direct messages for instant accessibility (capped at 10 items per chat).
- **In-Place Editing & Soft Deletion**: Edit post/message content with real-time broadcast to all viewers.

### 3. Advanced Media Pipeline
- **Audio Voice Notes & Trimming**:
  - Real-time frequency visualizer (`AudioVisualizer` & `LargeAudioVisualizer`) displaying live waveform ripples.
  - Built-in canvas-based `AudioTrimmer` allowing users to cut and export audio selections into clean WAV files before sending.
- **Image Cropper & Pan-Zoom Inspection**:
  - Modal crop utility to adjust profile visuals or shared imagery prior to sending.
  - Interactive multi-touch zoom, pan, and rotate viewer for fine-detail inspection.
- **Folder Upload & Zip Download**:
  - Supports uploading nested directories (`webkitdirectory`).
  - Single-click automated zip compression using `archiver`, enabling users to download entire folders in one bundle.

### 4. Dual Storage & Quota Tracking
- **Intelligent Storage Routing**: Uploads are dispatched to Cloudinary CDN when credentials exist, or safely stored in the local `/uploads` filesystem.
- **Quota Management**: Real-time tracking of disk and cloud usage against a 25GB quota cap.
- **Categorical Breakdown**: Automatic categorization into **Images**, **Videos**, **Audio**, **Documents**, and **Others**.
- **Admin Purge**: Dedicated "Clear Storage" capability to wipe all files, attachments, and messages instantly.

### 5. Real-Time Bi-Directional Engine
Powered by Socket.IO, events synchronize state across all connected clients with low latency:
- **Typing Indicators**: Real-time broadcast of `typing` and `stop_typing` states.
- **Online Presence**: User join/leave events with dynamic participant counts.
- **Live Reactions**: Multi-emoji reaction tray with instant popover feedback.
- **Storage Alerts**: Pushes updated storage telemetry to all active users when files are added or deleted.

### 6. Automated 24-Hour Purge & Garbage Collection
- **Database Level**: Every document in MongoDB (`sessions`, `posts`, `messages`, `reactions`, `pinned`) carries an indexed `expiresAt` date field configured with a MongoDB TTL (`{ expires: 0 }`).
- **File System & Cloudinary Cleanup**: A recurring server worker runs every 60 seconds to detect expired records, execute `cloudinary.uploader.destroy()` on hosted cloud assets, and call `fs.unlinkSync()` on disk assets.

### 7. Offline-First Synchronization
- Outbound actions during network drops are serialized and held in a client-side offline queue (`offlineQueue.ts`).
- When the device regains connectivity, the synchronization engine flushes pending requests in sequential order.

---

## 🗄 Database Schemas & Data Models

### 1. `Session`
| Field | Type | Description |
|---|---|---|
| `_id` | `String` (UUID) | Unique Session Identifier |
| `username` | `String` | Unique chosen identity handle |
| `color` | `String` | Tailwind badge background color token |
| `avatar` | `String` | Seed emoji avatar symbol |
| `createdAt` | `Date` | Record creation timestamp |
| `expiresAt` | `Date` (TTL) | Session expiry cutoff (24 hours) |

### 2. `Post` (Public Feed)
| Field | Type | Description |
|---|---|---|
| `_id` | `String` (UUID) | Unique Post ID |
| `username` | `String` | Author pseudonym |
| `content` | `String` | Text content / caption |
| `color` / `avatar` | `String` | Author visual tokens |
| `fileUrl`, `fileName` | `String` | Attached media URL & original name |
| `fileType`, `fileSize` | `String`, `Number` | MIME type & byte size |
| `folderName`, `folderFiles`| `String` | Directory structure metadata |
| `isPinned`, `isEdited` | `Boolean` | Modification status flags |
| `createdAt`, `expiresAt` | `Date` | Timestamp & 24-hour TTL index |

### 3. `Message` (Direct Messages)
| Field | Type | Description |
|---|---|---|
| `_id` | `String` (UUID) | Unique Message ID |
| `senderId`, `senderUsername` | `String` | Sender credentials |
| `receiverUsername`, `chatId` | `String` | Destination channel identifiers |
| `content`, `parentId` | `String` | Body content & quoted reply parent |
| `status` | `String` | Status lifecycle (`sent`, `delivered`, `seen`) |
| `fileUrl`, `fileName`, `fileSize` | Various | Attached multimedia attributes |
| `createdAt`, `expiresAt` | `Date` | Lifecycle timestamps |

### 4. `MessageReaction` & `PostReaction`
Stores emoji reactions tied to messages and feed posts with author tracking and 24h TTL.

### 5. `PinnedPost` & `PinnedMessage`
Stores user-specific pins (enforcing a maximum limit of 10 pinned messages per conversation).

---

## 🔌 API & WebSocket Specifications

### RESTful Endpoints

#### Authentication & Sessions
- `GET /api/usernames/generate` — Generate 3 randomized pseudonym options.
- `POST /api/usernames/claim` — Claim a chosen handle and initiate a 24-hour session token.
- `GET /api/session` — Retrieve the current active session state (requires `x-session-id`).

#### Feed & Direct Messaging
- `GET /api/posts` — Fetch active public drop feed items.
- `POST /api/posts` — Publish a public post with optional single file or folder archive.
- `PUT /api/posts/:id` — Edit an existing post.
- `DELETE /api/posts/:id` — Delete a post and remove its associated files.
- `POST /api/posts/:id/pin` — Toggle pin status on a post.
- `POST /api/posts/:id/react` — Add or remove an emoji reaction.
- `GET /api/messages/:username` — Fetch direct chat history with a specified user.
- `POST /api/messages/:username` — Send a direct message with optional file upload.
- `PUT /api/messages/:id` — Edit a direct message.
- `DELETE /api/messages/:id` — Delete a message and remove its attachments.
- `POST /api/messages/:id/pin` — Toggle pin status on a message.
- `POST /api/messages/:id/react` — Add or remove emoji reaction on a message.

#### Files & Archiving
- `GET /api/posts/:id/download-folder` — Stream on-the-fly zip archive of folder attachments.
- `GET /api/messages/:id/download-folder` — Stream on-the-fly zip archive for direct messages.
- `GET /api/proxy-download` — Safe content-disposition download proxy for external media URLs.

#### Storage & Administration
- `GET /api/storage/usage` — Fetch detailed storage consumption statistics and limits.
- `POST /api/storage/clear` — Purge all database records and storage files immediately.

---

### Socket.IO Events

#### Client to Server
- `join(username)` — Join the personal user room for direct messaging.
- `typing({ from, to })` — Announce user typing state.
- `stop_typing({ from, to })` — Announce user stopped typing.
- `message_delivered({ messageId, to })` — Confirm delivery receipt.
- `messages_seen({ messageIds, from, to })` — Confirm read receipt.

#### Server to Client
- `user_online(username)` — Informs clients that a user has connected.
- `new_post(post)` — Emits a newly published feed post to all active clients.
- `delete_post(postId)` — Emits post removal notification.
- `edit_post({ postId, content })` — Emits in-place content update for a post.
- `post_reaction(reactionData)` — Real-time reaction toggle on feed items.
- `new_message(message)` — Dispatches a new private message to receiver and sender.
- `storage_updated(usageStats)` — Broadcasts updated storage telemetry to all clients.

---

## 📁 Project Directory Structure

```text
24drop/
├── .env.example               # Template of required environment variables
├── index.html                 # HTML entry point with meta tags & viewport configuration
├── package.json               # Package dependencies, build scripts, and metadata
├── server.ts                  # Express.js REST API, Socket.IO gateway, & Purge Cron
├── tsconfig.json              # TypeScript compiler configuration
├── vite.config.ts             # Vite build & Tailwind configuration
├── uploads/                   # Local file storage for attachments & media
└── src/
    ├── main.tsx               # Client React DOM entry point
    ├── App.tsx                # App root component with session lifecycle & toast handlers
    ├── index.css              # Global styling & Tailwind CSS directives
    ├── components/
    │   ├── AudioPlayer.tsx          # Waveform audio player with playback controls
    │   ├── AudioTrimmer.tsx         # In-browser audio clipping and WAV generator
    │   ├── AudioVisualizer.tsx      # Real-time microphone frequency canvas
    │   ├── Composer.tsx             # Universal rich composer (text, files, voice, folders)
    │   ├── Countdown.tsx            # Live visual 24h expiration countdown timers
    │   ├── DissolvingItem.tsx       # Disintegration animations for expiring items
    │   ├── FileAttachmentView.tsx   # Visual rendering for documents, images, and audio
    │   ├── FolderAttachmentView.tsx # Multi-file directory explorer with zip downloader
    │   ├── ImageCropper.tsx         # Interactive canvas image crop dialog
    │   ├── Landing.tsx              # Anonymous pseudonym selection & onboarding
    │   ├── LargeAudioVisualizer.tsx # Expanded fullscreen voice recording visualizer
    │   ├── MainApp.tsx              # Main dashboard (sidebar, feed, chat tabs, modals)
    │   ├── PullToRefresh.tsx        # Mobile pull-to-refresh swipe gesture handler
    │   ├── ReactionSystem.tsx       # Emoji reaction popover & custom reaction editor
    │   └── RecordingTimer.tsx       # Stopwatch timer for active voice recordings
    ├── db/
    │   ├── mongodb.ts               # Mongoose connection manager
    │   └── mongoModels.ts           # Mongoose schemas (Session, Post, Message, etc.)
    ├── hooks/
    │   ├── useChatScroll.ts         # Smooth smart-scrolling & stick-to-bottom mechanics
    │   └── useChatSocket.ts         # Socket.IO connection and event listener bridge
    └── lib/
        ├── api.ts                   # Fetch wrapper with auto session authentication & toasts
        ├── auth.ts                  # Session storage and token helper routines
        ├── format.ts                # Date, countdown, and byte size formatters
        ├── offlineQueue.ts          # Offline message queueing & retry coordinator
        └── socket.ts                # Shared singleton Socket.IO instance
```

---

## ⚙️ Environment Variables & Configuration

Create a `.env` file in the project root based on `.env.example`:

```env
# Server Port (Defaults to 3000)
PORT=3000

# MongoDB Atlas Connection URI
MONGODB_URI="mongodb+srv://<username>:<password>@cluster.example.mongodb.net/24drop?retryWrites=true&w=majority"

# Cloudinary Storage Configuration (Optional — Falls back to local disk /uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Public URL (Optional, for production deployments)
APP_URL="https://your-domain.com"
```

---

## 💻 Installation, Local Development & Deployment

### Prerequisites
- Node.js version 20 or higher
- MongoDB Atlas cluster or local MongoDB instance
- npm, yarn, or pnpm package manager

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/24drop.git
cd 24drop
npm install
```

### 2. Run in Development Mode
Starts both the Express API and Vite development server simultaneously:
```bash
npm run dev
```
Open your browser to `http://localhost:3000`.

### 3. Production Build & Execution
Compile both the frontend SPA assets and backend Express service into an optimized bundle:
```bash
npm run build
npm start
```

---

## 🔒 Security, Privacy & Performance Considerations

1. **True Ephemerality**: No persistent relational references exist across days. All data is tied to explicit UTC expiration thresholds enforced by both the database engine and the background worker.
2. **Payload Protection**: High-volume uploads are safeguarded with strict 5GB multipart limits, preventing memory exhaustion through streaming direct-to-disk pipelines.
3. **Audio & Media Safety**: Browser-level audio decoding (`decodeAudioData`) is wrapped in defensive error-catching boundaries to prevent malformed binary audio payloads from degrading the UI thread.
4. **Resilient Network Handling**: The global API client intercepts HTTP status codes and socket disconnects, guiding users gracefully via non-blocking notifications while staging offline edits for seamless synchronization.
