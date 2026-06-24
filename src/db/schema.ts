import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const userTable = sqliteTable('user', {
  id: text('id').notNull().primaryKey(),
  googleId: text('google_id').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url')
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
