# 24Drop

A modern, real-time communication platform for private chats and public broadcasting.

## Overview

24Drop is a seamless communication platform designed to bridge the gap between one-on-one messaging and public social feeds. It solves the need for a unified space where users can engage in private, feature-rich conversations while also participating in a broader community through a global feed. The main goal is to deliver a fast, responsive, and visually appealing experience that supports modern digital communication, including rich media sharing, ephemeral posts, and real-time interactions.

## Features

- **Real-Time Chat:** Instant messaging powered by WebSockets, featuring live typing indicators and online statuses.
- **Global Public Feed:** Share your thoughts, images, and audio with everyone using auto-expiring (ephemeral) posts.
- **Rich Media Support:** Easily send images (with built-in cropping), record voice notes, and attach files.
- **Interactive Conversations:** Support for threaded replies, message emoji reactions, and pinned messages.
- **Global Search:** Quickly find users, specific messages, and feed posts across the platform.
- **Modern & Responsive UI:** A sleek, dark-themed interface with smooth layout transitions and animations powered by Framer Motion.

## Tech Stack

**Frontend:**
- React (v19)
- Vite
- TypeScript
- Tailwind CSS
- Framer Motion (Animations)
- Lucide React (Icons)

**Backend:**
- Node.js
- Express.js
- Socket.io (Real-time bidirectional event-based communication)

**Database & Storage:**
- MongoDB Atlas for persistent scalable storage
- Cloudinary (for robust image and media hosting via `multer`)

## Usage

To run the project locally, follow these steps:

### 1. Install Dependencies
Make sure you have Node.js installed. Run the following command in the project root:

```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory and add your configuration details (e.g., Cloudinary API credentials, PORT).

### 3. Start the Development Server
Launch the application in development mode:

```bash
npm run dev
```
The application will start and be available at `http://localhost:3000`.

### 4. Build for Production
To build the application for production deployment, run:

```bash
npm run build
```
Then start the compiled production server:

```bash
npm run start
```
