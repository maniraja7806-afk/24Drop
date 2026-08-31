import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Using UUID as _id
  username: { type: String, required: true, unique: true },
  color: { type: String, required: true },
  avatar: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } } // MongoDB TTL index!
});

const postSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  username: { type: String, required: true },
  content: { type: String },
  color: { type: String },
  avatar: { type: String },
  fileUrl: { type: String },
  fileName: { type: String },
  fileType: { type: String },
  fileSize: { type: Number },
  folderName: { type: String },
  folderFiles: { type: String },
  isPinned: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } } // MongoDB TTL index!
});

const messageSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  senderId: { type: String, required: true },
  senderUsername: { type: String, required: true },
  receiverUsername: { type: String, required: true },
  chatId: { type: String, required: true }, // Added for easy chat querying
  content: { type: String },
  parentId: { type: String },
  fileUrl: { type: String },
  fileName: { type: String },
  fileType: { type: String },
  fileSize: { type: Number },
  folderName: { type: String },
  folderFiles: { type: String },
  status: { type: String, default: 'sent' },
  isPinned: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  seenAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } } // MongoDB TTL index!
});

const messageReactionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  messageId: { type: String, required: true, ref: 'Message' },
  username: { type: String, required: true },
  emoji: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
});

const postReactionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  postId: { type: String, required: true, ref: 'Post' },
  username: { type: String, required: true },
  emoji: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
});

const pinnedPostSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  postId: { type: String, required: true, ref: 'Post' },
  pinnedByUserId: { type: String, required: true },
  pinnedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
});

const pinnedMessageSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  messageId: { type: String, required: true, ref: 'Message' },
  pinnedByUserId: { type: String, required: true },
  chatId: { type: String, required: true }, // To easily query by chat for the 10 limit
  pinnedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
});

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});

export const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
export const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
export const MessageReaction = mongoose.models.MessageReaction || mongoose.model('MessageReaction', messageReactionSchema);
export const PostReaction = mongoose.models.PostReaction || mongoose.model('PostReaction', postReactionSchema);
export const PinnedPost = mongoose.models.PinnedPost || mongoose.model('PinnedPost', pinnedPostSchema);
export const PinnedMessage = mongoose.models.PinnedMessage || mongoose.model('PinnedMessage', pinnedMessageSchema);
export const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
