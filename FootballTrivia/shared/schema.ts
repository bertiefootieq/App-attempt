import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  totalScore: integer("total_score").default(0),
  gamesPlayed: integer("games_played").default(0),
  gamesWon: integer("games_won").default(0),
  currentStreak: integer("current_streak").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  acceptableAnswers: json("acceptable_answers").$type<string[]>(),
  difficulty: text("difficulty").notNull(),
  category: text("category").notNull(),
  timeLimit: integer("time_limit").default(60),
  type: text("type").default("text-input"),
  isActive: boolean("is_active").default(true),
  scheduledAt: timestamp("scheduled_at"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const friendGroups = pgTable("friend_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id),
  memberCount: integer("member_count").default(1),
  gamesPlayed: integer("games_played").default(0),
  activeStreak: integer("active_streak").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const friendGroupMembers = pgTable("friend_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => friendGroups.id),
  userId: integer("user_id").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  status: text("status").default("waiting"),
  maxPlayers: integer("max_players").default(10),
  currentPlayers: integer("current_players").default(0),
  questionIds: json("question_ids").$type<number[]>(),
  currentQuestionIndex: integer("current_question_index").default(0),
  timePerQuestion: integer("time_per_question").default(30),
  friendGroupId: integer("friend_group_id").references(() => friendGroups.id),
  createdBy: integer("created_by").references(() => users.id),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const liveCompetitions = pgTable("live_competitions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  scheduledStart: timestamp("scheduled_start").notNull(),
  duration: integer("duration").default(1800), // 30 minutes in seconds
  status: text("status").default("scheduled"), // scheduled, live, finished
  questionIds: json("question_ids").$type<number[]>(),
  maxParticipants: integer("max_participants").default(100),
  currentParticipants: integer("current_participants").default(0),
  currentQuestionIndex: integer("current_question_index").default(0),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const liveCompetitionParticipants = pgTable("live_competition_participants", {
  id: serial("id").primaryKey(),
  competitionId: integer("competition_id").references(() => liveCompetitions.id),
  userId: integer("user_id").references(() => users.id),
  score: integer("score").default(0),
  isConnected: boolean("is_connected").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const liveCompetitionAnswers = pgTable("live_competition_answers", {
  id: serial("id").primaryKey(),
  competitionId: integer("competition_id").references(() => liveCompetitions.id),
  userId: integer("user_id").references(() => users.id),
  questionId: integer("question_id").references(() => questions.id),
  selectedAnswer: text("selected_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeToAnswer: integer("time_to_answer"),
  answeredAt: timestamp("answered_at").defaultNow(),
});

export const questionSuggestions = pgTable("question_suggestions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  answerA: text("answer_a"),
  answerB: text("answer_b"),
  answerC: text("answer_c"),
  answerD: text("answer_d"),
  acceptableAnswers: json("acceptable_answers").$type<string[]>(),
  difficulty: text("difficulty").notNull(),
  category: text("category").notNull(),
  type: text("type").default("text-input"),
  explanation: text("explanation"),
  status: text("status").default("pending"), // pending, approved, rejected
  submittedBy: integer("submitted_by").references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const gameParticipants = pgTable("game_participants", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id),
  userId: integer("user_id").references(() => users.id),
  score: integer("score").default(0),
  isEliminated: boolean("is_eliminated").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const gameAnswers = pgTable("game_answers", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id),
  userId: integer("user_id").references(() => users.id),
  questionId: integer("question_id").references(() => questions.id),
  selectedAnswer: text("selected_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeToAnswer: integer("time_to_answer"),
  answeredAt: timestamp("answered_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  totalScore: true,
  gamesPlayed: true,
  gamesWon: true,
  currentStreak: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertFriendGroupSchema = createInsertSchema(friendGroups).omit({
  id: true,
  memberCount: true,
  gamesPlayed: true,
  activeStreak: true,
  createdAt: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  currentPlayers: true,
  currentQuestionIndex: true,
  startedAt: true,
  endedAt: true,
  createdAt: true,
});

export const insertGameParticipantSchema = createInsertSchema(gameParticipants).omit({
  id: true,
  score: true,
  isEliminated: true,
  joinedAt: true,
});

export const insertGameAnswerSchema = createInsertSchema(gameAnswers).omit({
  id: true,
  answeredAt: true,
});

export const insertLiveCompetitionSchema = createInsertSchema(liveCompetitions).omit({
  id: true,
  currentParticipants: true,
  currentQuestionIndex: true,
  createdAt: true,
});

export const insertLiveCompetitionParticipantSchema = createInsertSchema(liveCompetitionParticipants).omit({
  id: true,
  score: true,
  isConnected: true,
  joinedAt: true,
});

export const insertLiveCompetitionAnswerSchema = createInsertSchema(liveCompetitionAnswers).omit({
  id: true,
  isCorrect: true,
  answeredAt: true,
});

export const insertQuestionSuggestionSchema = createInsertSchema(questionSuggestions).omit({
  id: true,
  status: true,
  reviewedBy: true,
  reviewNotes: true,
  createdAt: true,
  reviewedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type FriendGroup = typeof friendGroups.$inferSelect;
export type InsertFriendGroup = z.infer<typeof insertFriendGroupSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type GameParticipant = typeof gameParticipants.$inferSelect;
export type InsertGameParticipant = z.infer<typeof insertGameParticipantSchema>;
export type GameAnswer = typeof gameAnswers.$inferSelect;
export type InsertGameAnswer = z.infer<typeof insertGameAnswerSchema>;
export type FriendGroupMember = typeof friendGroupMembers.$inferSelect;
export type LiveCompetition = typeof liveCompetitions.$inferSelect;
export type InsertLiveCompetition = z.infer<typeof insertLiveCompetitionSchema>;
export type LiveCompetitionParticipant = typeof liveCompetitionParticipants.$inferSelect;
export type InsertLiveCompetitionParticipant = z.infer<typeof insertLiveCompetitionParticipantSchema>;
export type LiveCompetitionAnswer = typeof liveCompetitionAnswers.$inferSelect;
export type InsertLiveCompetitionAnswer = z.infer<typeof insertLiveCompetitionAnswerSchema>;
export type QuestionSuggestion = typeof questionSuggestions.$inferSelect;
export type InsertQuestionSuggestion = z.infer<typeof insertQuestionSuggestionSchema>;
