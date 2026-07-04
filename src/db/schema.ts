import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const userTable = sqliteTable('user', {
  id: text('id').notNull().primaryKey(),
  googleId: text('google_id').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  lastActiveAt: integer('last_active_at')
});

export const sessionTable = sqliteTable('session', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id').notNull().references(() => userTable.id),
  expiresAt: integer('expires_at').notNull()
});

export const recentlyViewedTable = sqliteTable('recently_viewed', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => userTable.id),
  fileId: text('file_id').notNull(),
  viewedAt: integer('viewed_at').notNull()
});

export const commentsTable = sqliteTable('comments', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id').notNull().references(() => userTable.id),
  fileId: text('file_id').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at').notNull()
});

export const starredTable = sqliteTable('starred_files', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => userTable.id),
  fileId: text('file_id').notNull(),
  starredAt: integer('starred_at').notNull()
});

export const searchQueriesTable = sqliteTable('search_queries', {
  id: text('id').primaryKey(),
  query: text('query').notNull(),
  userId: text('user_id'), // optional, for anonymous searches
  timestamp: integer('timestamp').notNull()
});

export const donationsTable = sqliteTable('donations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => userTable.id),
  materialName: text('material_name').notNull(),
  driveLink: text('drive_link').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected'
  submittedAt: integer('submitted_at').notNull()
});
