// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// server/storage.ts
var MemStorage = class {
  users = /* @__PURE__ */ new Map();
  questions = /* @__PURE__ */ new Map();
  friendGroups = /* @__PURE__ */ new Map();
  friendGroupMembers = /* @__PURE__ */ new Map();
  games = /* @__PURE__ */ new Map();
  gameParticipants = /* @__PURE__ */ new Map();
  gameAnswers = /* @__PURE__ */ new Map();
  liveCompetitions = /* @__PURE__ */ new Map();
  liveCompetitionParticipants = /* @__PURE__ */ new Map();
  liveCompetitionAnswers = /* @__PURE__ */ new Map();
  questionSuggestions = /* @__PURE__ */ new Map();
  currentUserId = 1;
  currentQuestionId = 1;
  currentFriendGroupId = 1;
  currentFriendGroupMemberId = 1;
  currentGameId = 1;
  currentGameParticipantId = 1;
  currentGameAnswerId = 1;
  currentLiveCompetitionId = 1;
  currentLiveCompetitionParticipantId = 1;
  currentLiveCompetitionAnswerId = 1;
  currentQuestionSuggestionId = 1;
  constructor() {
    this.seedData();
  }
  seedData() {
    const users2 = [
      { username: "admin", email: "admin@example.com", password: "admin123", displayName: "Admin User", totalScore: 0, gamesPlayed: 0, gamesWon: 0, currentStreak: 0 },
      { username: "john_doe", email: "john@example.com", password: "password123", displayName: "John Doe", totalScore: 1250, gamesPlayed: 47, gamesWon: 34, currentStreak: 8 },
      { username: "emma_wilson", email: "emma@example.com", password: "password123", displayName: "Emma Wilson", totalScore: 2847, gamesPlayed: 156, gamesWon: 139, currentStreak: 25 },
      { username: "mike_johnson", email: "mike@example.com", password: "password123", displayName: "Mike Johnson", totalScore: 1890, gamesPlayed: 89, gamesWon: 65, currentStreak: 12 }
    ];
    users2.forEach((userData) => {
      const user = {
        id: this.currentUserId++,
        ...userData,
        createdAt: /* @__PURE__ */ new Date()
      };
      this.users.set(user.id, user);
    });
    const sampleQuestions = [
      {
        text: "Which goalkeeper holds the record for the most clean sheets in a single Premier League season, achieving 24 clean sheets?",
        correctAnswer: "Petr Cech",
        acceptableAnswers: ["Petr Cech", "Petr \u010Cech", "Cech", "\u010Cech"],
        difficulty: "hard",
        category: "Premier League Records",
        type: "text-input",
        createdBy: 1
      },
      {
        text: "Name the Italian defender who scored the winning goal in the 2006 World Cup Final penalty shootout.",
        correctAnswer: "Fabio Grosso",
        acceptableAnswers: ["Fabio Grosso", "Grosso"],
        difficulty: "hard",
        category: "World Cup History",
        type: "text-input",
        createdBy: 1
      },
      {
        text: "What is the name of the stadium where Athletic Bilbao plays their home matches?",
        correctAnswer: "San Mam\xE9s",
        acceptableAnswers: ["San Mam\xE9s", "San Mames", "Estadio San Mam\xE9s"],
        difficulty: "medium",
        category: "Stadiums",
        type: "text-input",
        createdBy: 1
      },
      {
        text: "Which Brazilian footballer is known as 'The Phenomenon' and won the Ballon d'Or twice?",
        correctAnswer: "Ronaldo",
        acceptableAnswers: ["Ronaldo", "Ronaldo Naz\xE1rio", "R9"],
        difficulty: "medium",
        category: "Player Nicknames",
        type: "text-input",
        createdBy: 1
      },
      {
        text: "In which year did Leicester City win the Premier League title?",
        correctAnswer: "2016",
        acceptableAnswers: ["2016", "2015-16", "2015/16"],
        difficulty: "easy",
        category: "Premier League History",
        type: "text-input",
        createdBy: 1
      }
    ];
    sampleQuestions.forEach((questionData) => {
      const question = {
        id: this.currentQuestionId++,
        ...questionData,
        timeLimit: 60,
        isActive: true,
        scheduledAt: null,
        createdAt: /* @__PURE__ */ new Date()
      };
      this.questions.set(question.id, question);
    });
    const now = /* @__PURE__ */ new Date();
    const futureDate = new Date(now.getTime() + 2 * 60 * 60 * 1e3);
    const nearFutureDate = new Date(now.getTime() + 30 * 60 * 1e3);
    const liveCompetitions2 = [
      {
        title: "Friday Night Football Quiz",
        description: "Test your football knowledge in this exciting live competition!",
        scheduledStart: futureDate,
        duration: 1800,
        // 30 minutes
        status: "scheduled",
        questionIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        maxParticipants: 50,
        createdBy: 1
      },
      {
        title: "Premier League Legends",
        description: "How well do you know Premier League history?",
        scheduledStart: nearFutureDate,
        duration: 1200,
        // 20 minutes
        status: "scheduled",
        questionIds: [1, 3, 5, 7, 9, 11, 13, 15],
        maxParticipants: 30,
        createdBy: 1
      }
    ];
    liveCompetitions2.forEach((compData) => {
      const competition = {
        id: this.currentLiveCompetitionId++,
        ...compData,
        currentParticipants: 0,
        currentQuestionIndex: 0,
        createdAt: /* @__PURE__ */ new Date()
      };
      this.liveCompetitions.set(competition.id, competition);
    });
    const sampleSuggestions = [
      {
        text: "Which player scored the most goals in the 2018 FIFA World Cup?",
        correctAnswer: "Harry Kane",
        answerA: "Harry Kane",
        answerB: "Cristiano Ronaldo",
        answerC: "Kylian Mbapp\xE9",
        answerD: "Romelu Lukaku",
        difficulty: "medium",
        category: "World Cup",
        type: "multiple-choice",
        explanation: "Harry Kane won the Golden Boot with 6 goals in the 2018 World Cup in Russia.",
        submittedBy: 2
      },
      {
        text: "What year was the offside rule introduced in football?",
        correctAnswer: "1863",
        acceptableAnswers: ["1863"],
        difficulty: "hard",
        category: "History",
        type: "text-input",
        explanation: "The offside rule was part of the original Laws of the Game established in 1863.",
        submittedBy: 3
      }
    ];
    sampleSuggestions.forEach((suggestionData) => {
      const suggestion = {
        id: this.currentQuestionSuggestionId++,
        ...suggestionData,
        status: "pending",
        reviewedBy: null,
        reviewNotes: null,
        createdAt: /* @__PURE__ */ new Date(),
        reviewedAt: null
      };
      this.questionSuggestions.set(suggestion.id, suggestion);
    });
  }
  // User methods
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }
  async createUser(insertUser) {
    const user = {
      id: this.currentUserId++,
      ...insertUser,
      totalScore: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(user.id, user);
    return user;
  }
  async updateUserStats(id, stats) {
    const user = this.users.get(id);
    if (!user) return void 0;
    const updatedUser = { ...user, ...stats };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  async getLeaderboard(limit = 50) {
    return Array.from(this.users.values()).sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0)).slice(0, limit);
  }
  // Question methods
  async getQuestion(id) {
    return this.questions.get(id);
  }
  async getQuestions(filters) {
    let questions2 = Array.from(this.questions.values());
    if (filters) {
      questions2 = questions2.filter((question) => {
        return Object.entries(filters).every(
          ([key, value]) => question[key] === value
        );
      });
    }
    return questions2;
  }
  async createQuestion(insertQuestion) {
    const question = {
      id: this.currentQuestionId++,
      ...insertQuestion,
      type: insertQuestion.type || "multiple-choice",
      createdAt: /* @__PURE__ */ new Date()
    };
    this.questions.set(question.id, question);
    return question;
  }
  async updateQuestion(id, updates) {
    const question = this.questions.get(id);
    if (!question) return void 0;
    const updatedQuestion = { ...question, ...updates };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }
  async getScheduledQuestions(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return Array.from(this.questions.values()).filter(
      (question) => question.scheduledAt && question.scheduledAt >= startOfDay && question.scheduledAt <= endOfDay
    );
  }
  // Friend Group methods
  async getFriendGroup(id) {
    return this.friendGroups.get(id);
  }
  async getFriendGroupsByUser(userId) {
    const userGroups = Array.from(this.friendGroupMembers.values()).filter((member) => member.userId === userId).map((member) => member.groupId);
    return Array.from(this.friendGroups.values()).filter((group) => userGroups.includes(group.id));
  }
  async createFriendGroup(insertGroup) {
    const group = {
      id: this.currentFriendGroupId++,
      ...insertGroup,
      memberCount: 1,
      gamesPlayed: 0,
      activeStreak: 0,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.friendGroups.set(group.id, group);
    if (insertGroup.createdBy) {
      await this.addUserToFriendGroup(group.id, insertGroup.createdBy);
    }
    return group;
  }
  async addUserToFriendGroup(groupId, userId) {
    const member = {
      id: this.currentFriendGroupMemberId++,
      groupId,
      userId,
      joinedAt: /* @__PURE__ */ new Date()
    };
    this.friendGroupMembers.set(member.id, member);
    const group = this.friendGroups.get(groupId);
    if (group) {
      group.memberCount = Array.from(this.friendGroupMembers.values()).filter((m) => m.groupId === groupId).length;
      this.friendGroups.set(groupId, group);
    }
    return member;
  }
  async getFriendGroupMembers(groupId) {
    const memberIds = Array.from(this.friendGroupMembers.values()).filter((member) => member.groupId === groupId).map((member) => member.userId);
    return Array.from(this.users.values()).filter((user) => memberIds.includes(user.id));
  }
  async getFriendGroupLeaderboard(groupId) {
    const members = await this.getFriendGroupMembers(groupId);
    return members.sort((a, b) => b.totalScore - a.totalScore);
  }
  // Game methods
  async getGame(id) {
    return this.games.get(id);
  }
  async getActiveGames() {
    return Array.from(this.games.values()).filter((game) => game.status === "active" || game.status === "waiting");
  }
  async getGamesByUser(userId) {
    const userGameIds = Array.from(this.gameParticipants.values()).filter((participant) => participant.userId === userId).map((participant) => participant.gameId);
    return Array.from(this.games.values()).filter((game) => userGameIds.includes(game.id));
  }
  async createGame(insertGame) {
    const game = {
      id: this.currentGameId++,
      ...insertGame,
      currentPlayers: 0,
      currentQuestionIndex: 0,
      startedAt: null,
      endedAt: null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.games.set(game.id, game);
    return game;
  }
  async updateGame(id, updates) {
    const game = this.games.get(id);
    if (!game) return void 0;
    const updatedGame = { ...game, ...updates };
    this.games.set(id, updatedGame);
    return updatedGame;
  }
  async addGameParticipant(insertParticipant) {
    const participant = {
      id: this.currentGameParticipantId++,
      ...insertParticipant,
      score: 0,
      isEliminated: false,
      joinedAt: /* @__PURE__ */ new Date()
    };
    this.gameParticipants.set(participant.id, participant);
    const game = this.games.get(participant.gameId);
    if (game) {
      game.currentPlayers = Array.from(this.gameParticipants.values()).filter((p) => p.gameId === participant.gameId).length;
      this.games.set(participant.gameId, game);
    }
    return participant;
  }
  async getGameParticipants(gameId) {
    const participants = Array.from(this.gameParticipants.values()).filter((participant) => participant.gameId === gameId);
    return participants.map((participant) => {
      const user = this.users.get(participant.userId);
      return { ...participant, user };
    }).filter((p) => p.user);
  }
  async recordGameAnswer(insertAnswer) {
    const answer = {
      id: this.currentGameAnswerId++,
      ...insertAnswer,
      answeredAt: /* @__PURE__ */ new Date()
    };
    this.gameAnswers.set(answer.id, answer);
    return answer;
  }
  async getGameAnswers(gameId, questionId) {
    return Array.from(this.gameAnswers.values()).filter((answer) => {
      if (answer.gameId !== gameId) return false;
      if (questionId && answer.questionId !== questionId) return false;
      return true;
    });
  }
  // Live Competition methods
  async getLiveCompetition(id) {
    return this.liveCompetitions.get(id);
  }
  async getUpcomingCompetitions() {
    const now = /* @__PURE__ */ new Date();
    return Array.from(this.liveCompetitions.values()).filter(
      (comp) => comp.status === "scheduled" && new Date(comp.scheduledStart) > now
    );
  }
  async getLiveCompetitions() {
    return Array.from(this.liveCompetitions.values()).filter(
      (comp) => comp.status === "live"
    );
  }
  async createLiveCompetition(insertCompetition) {
    const competition = {
      id: this.currentLiveCompetitionId++,
      ...insertCompetition,
      currentParticipants: 0,
      currentQuestionIndex: 0,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.liveCompetitions.set(competition.id, competition);
    return competition;
  }
  async updateLiveCompetition(id, updates) {
    const competition = this.liveCompetitions.get(id);
    if (!competition) return void 0;
    const updated = { ...competition, ...updates };
    this.liveCompetitions.set(id, updated);
    return updated;
  }
  async joinLiveCompetition(competitionId, userId) {
    const participant = {
      id: this.currentLiveCompetitionParticipantId++,
      competitionId,
      userId,
      score: 0,
      isConnected: true,
      joinedAt: /* @__PURE__ */ new Date()
    };
    this.liveCompetitionParticipants.set(participant.id, participant);
    const competition = this.liveCompetitions.get(competitionId);
    if (competition) {
      const updated = { ...competition, currentParticipants: competition.currentParticipants + 1 };
      this.liveCompetitions.set(competitionId, updated);
    }
    return participant;
  }
  async getLiveCompetitionParticipants(competitionId) {
    const participants = Array.from(this.liveCompetitionParticipants.values()).filter((p) => p.competitionId === competitionId);
    return participants.map((participant) => {
      const user = this.users.get(participant.userId);
      return { ...participant, user };
    }).filter((p) => p.user);
  }
  async recordLiveCompetitionAnswer(insertAnswer) {
    const answer = {
      id: this.currentLiveCompetitionAnswerId++,
      ...insertAnswer,
      answeredAt: /* @__PURE__ */ new Date()
    };
    this.liveCompetitionAnswers.set(answer.id, answer);
    return answer;
  }
  async getLiveCompetitionAnswers(competitionId, questionId) {
    return Array.from(this.liveCompetitionAnswers.values()).filter((answer) => {
      if (answer.competitionId !== competitionId) return false;
      if (questionId && answer.questionId !== questionId) return false;
      return true;
    });
  }
  async updateParticipantConnection(competitionId, userId, isConnected) {
    const participant = Array.from(this.liveCompetitionParticipants.values()).find((p) => p.competitionId === competitionId && p.userId === userId);
    if (participant) {
      const updated = { ...participant, isConnected };
      this.liveCompetitionParticipants.set(participant.id, updated);
    }
  }
  // Question Suggestion methods
  async getQuestionSuggestion(id) {
    return this.questionSuggestions.get(id);
  }
  async getQuestionSuggestions(filters) {
    let suggestions = Array.from(this.questionSuggestions.values());
    if (filters) {
      suggestions = suggestions.filter((suggestion) => {
        return Object.entries(filters).every(
          ([key, value]) => suggestion[key] === value
        );
      });
    }
    return suggestions.map((suggestion) => ({
      ...suggestion,
      submittedByUser: this.users.get(suggestion.submittedBy)
    }));
  }
  async createQuestionSuggestion(insertSuggestion) {
    const suggestion = {
      id: this.currentQuestionSuggestionId++,
      ...insertSuggestion,
      status: "pending",
      reviewedBy: null,
      reviewNotes: null,
      createdAt: /* @__PURE__ */ new Date(),
      reviewedAt: null
    };
    this.questionSuggestions.set(suggestion.id, suggestion);
    return suggestion;
  }
  async updateQuestionSuggestion(id, updates) {
    const suggestion = this.questionSuggestions.get(id);
    if (!suggestion) return void 0;
    const updatedSuggestion = { ...suggestion, ...updates };
    this.questionSuggestions.set(id, updatedSuggestion);
    return updatedSuggestion;
  }
  async approveQuestionSuggestion(id, reviewedBy, reviewNotes) {
    const suggestion = this.questionSuggestions.get(id);
    if (!suggestion) return void 0;
    const newQuestion = {
      id: this.currentQuestionId++,
      text: suggestion.text,
      correctAnswer: suggestion.correctAnswer,
      acceptableAnswers: suggestion.acceptableAnswers || [suggestion.correctAnswer],
      difficulty: suggestion.difficulty,
      category: suggestion.category,
      type: suggestion.type || "text-input",
      timeLimit: 30,
      // Default time limit
      isActive: true,
      scheduledAt: null,
      createdBy: reviewedBy,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.questions.set(newQuestion.id, newQuestion);
    const updatedSuggestion = {
      ...suggestion,
      status: "approved",
      reviewedBy,
      reviewNotes,
      reviewedAt: /* @__PURE__ */ new Date()
    };
    this.questionSuggestions.set(id, updatedSuggestion);
    return newQuestion;
  }
  async rejectQuestionSuggestion(id, reviewedBy, reviewNotes) {
    const suggestion = this.questionSuggestions.get(id);
    if (!suggestion) return void 0;
    const updatedSuggestion = {
      ...suggestion,
      status: "rejected",
      reviewedBy,
      reviewNotes,
      reviewedAt: /* @__PURE__ */ new Date()
    };
    this.questionSuggestions.set(id, updatedSuggestion);
    return updatedSuggestion;
  }
  async scheduleQuestion(questionId, scheduledAt) {
    const question = this.questions.get(questionId);
    if (!question) return void 0;
    const updatedQuestion = { ...question, scheduledAt };
    this.questions.set(questionId, updatedQuestion);
    return updatedQuestion;
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  totalScore: integer("total_score").default(0),
  gamesPlayed: integer("games_played").default(0),
  gamesWon: integer("games_won").default(0),
  currentStreak: integer("current_streak").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
var questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  acceptableAnswers: json("acceptable_answers").$type(),
  difficulty: text("difficulty").notNull(),
  category: text("category").notNull(),
  timeLimit: integer("time_limit").default(60),
  type: text("type").default("text-input"),
  isActive: boolean("is_active").default(true),
  scheduledAt: timestamp("scheduled_at"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
var friendGroups = pgTable("friend_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id),
  memberCount: integer("member_count").default(1),
  gamesPlayed: integer("games_played").default(0),
  activeStreak: integer("active_streak").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
var friendGroupMembers = pgTable("friend_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => friendGroups.id),
  userId: integer("user_id").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow()
});
var games = pgTable("games", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  status: text("status").default("waiting"),
  maxPlayers: integer("max_players").default(10),
  currentPlayers: integer("current_players").default(0),
  questionIds: json("question_ids").$type(),
  currentQuestionIndex: integer("current_question_index").default(0),
  timePerQuestion: integer("time_per_question").default(30),
  friendGroupId: integer("friend_group_id").references(() => friendGroups.id),
  createdBy: integer("created_by").references(() => users.id),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var liveCompetitions = pgTable("live_competitions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  scheduledStart: timestamp("scheduled_start").notNull(),
  duration: integer("duration").default(1800),
  // 30 minutes in seconds
  status: text("status").default("scheduled"),
  // scheduled, live, finished
  questionIds: json("question_ids").$type(),
  maxParticipants: integer("max_participants").default(100),
  currentParticipants: integer("current_participants").default(0),
  currentQuestionIndex: integer("current_question_index").default(0),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
var liveCompetitionParticipants = pgTable("live_competition_participants", {
  id: serial("id").primaryKey(),
  competitionId: integer("competition_id").references(() => liveCompetitions.id),
  userId: integer("user_id").references(() => users.id),
  score: integer("score").default(0),
  isConnected: boolean("is_connected").default(true),
  joinedAt: timestamp("joined_at").defaultNow()
});
var liveCompetitionAnswers = pgTable("live_competition_answers", {
  id: serial("id").primaryKey(),
  competitionId: integer("competition_id").references(() => liveCompetitions.id),
  userId: integer("user_id").references(() => users.id),
  questionId: integer("question_id").references(() => questions.id),
  selectedAnswer: text("selected_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeToAnswer: integer("time_to_answer"),
  answeredAt: timestamp("answered_at").defaultNow()
});
var questionSuggestions = pgTable("question_suggestions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  answerA: text("answer_a"),
  answerB: text("answer_b"),
  answerC: text("answer_c"),
  answerD: text("answer_d"),
  acceptableAnswers: json("acceptable_answers").$type(),
  difficulty: text("difficulty").notNull(),
  category: text("category").notNull(),
  type: text("type").default("text-input"),
  explanation: text("explanation"),
  status: text("status").default("pending"),
  // pending, approved, rejected
  submittedBy: integer("submitted_by").references(() => users.id),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at")
});
var gameParticipants = pgTable("game_participants", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id),
  userId: integer("user_id").references(() => users.id),
  score: integer("score").default(0),
  isEliminated: boolean("is_eliminated").default(false),
  joinedAt: timestamp("joined_at").defaultNow()
});
var gameAnswers = pgTable("game_answers", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id),
  userId: integer("user_id").references(() => users.id),
  questionId: integer("question_id").references(() => questions.id),
  selectedAnswer: text("selected_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeToAnswer: integer("time_to_answer"),
  answeredAt: timestamp("answered_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  totalScore: true,
  gamesPlayed: true,
  gamesWon: true,
  currentStreak: true,
  createdAt: true
});
var insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true
});
var insertFriendGroupSchema = createInsertSchema(friendGroups).omit({
  id: true,
  memberCount: true,
  gamesPlayed: true,
  activeStreak: true,
  createdAt: true
});
var insertGameSchema = createInsertSchema(games).omit({
  id: true,
  currentPlayers: true,
  currentQuestionIndex: true,
  startedAt: true,
  endedAt: true,
  createdAt: true
});
var insertGameParticipantSchema = createInsertSchema(gameParticipants).omit({
  id: true,
  score: true,
  isEliminated: true,
  joinedAt: true
});
var insertGameAnswerSchema = createInsertSchema(gameAnswers).omit({
  id: true,
  answeredAt: true
});
var insertLiveCompetitionSchema = createInsertSchema(liveCompetitions).omit({
  id: true,
  currentParticipants: true,
  currentQuestionIndex: true,
  createdAt: true
});
var insertLiveCompetitionParticipantSchema = createInsertSchema(liveCompetitionParticipants).omit({
  id: true,
  score: true,
  isConnected: true,
  joinedAt: true
});
var insertLiveCompetitionAnswerSchema = createInsertSchema(liveCompetitionAnswers).omit({
  id: true,
  isCorrect: true,
  answeredAt: true
});
var insertQuestionSuggestionSchema = createInsertSchema(questionSuggestions).omit({
  id: true,
  status: true,
  reviewedBy: true,
  reviewNotes: true,
  createdAt: true,
  reviewedAt: true
});

// server/routes.ts
var liveCompetitionClients = /* @__PURE__ */ new Map();
async function registerRoutes(app2) {
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username) || await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Login failed", error });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user", error });
    }
  });
  app2.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : void 0;
      const users2 = await storage.getLeaderboard(limit);
      const usersWithoutPasswords = users2.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to get leaderboard", error });
    }
  });
  app2.get("/api/questions", async (req, res) => {
    try {
      const filters = {
        ...req.query.difficulty && { difficulty: req.query.difficulty },
        ...req.query.category && { category: req.query.category },
        ...req.query.type && { type: req.query.type },
        ...req.query.isActive !== void 0 && { isActive: req.query.isActive === "true" }
      };
      const questions2 = await storage.getQuestions(Object.keys(filters).length > 0 ? filters : void 0);
      res.json(questions2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get questions", error });
    }
  });
  app2.post("/api/questions", async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);
      res.json(question);
    } catch (error) {
      res.status(400).json({ message: "Invalid question data", error });
    }
  });
  app2.get("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const question = await storage.getQuestion(id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to get question", error });
    }
  });
  app2.get("/api/questions/scheduled/:date", async (req, res) => {
    try {
      const date = new Date(req.params.date);
      const questions2 = await storage.getScheduledQuestions(date);
      res.json(questions2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get scheduled questions", error });
    }
  });
  app2.get("/api/friend-groups", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId);
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const groups = await storage.getFriendGroupsByUser(userId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to get friend groups", error });
    }
  });
  app2.post("/api/friend-groups", async (req, res) => {
    try {
      const groupData = insertFriendGroupSchema.parse(req.body);
      const group = await storage.createFriendGroup(groupData);
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: "Invalid group data", error });
    }
  });
  app2.post("/api/friend-groups/:id/members", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const member = await storage.addUserToFriendGroup(groupId, userId);
      res.json(member);
    } catch (error) {
      res.status(400).json({ message: "Failed to add member", error });
    }
  });
  app2.get("/api/friend-groups/:id/members", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const members = await storage.getFriendGroupMembers(groupId);
      const membersWithoutPasswords = members.map(({ password, ...member }) => member);
      res.json(membersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to get group members", error });
    }
  });
  app2.get("/api/friend-groups/:id/leaderboard", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const leaderboard = await storage.getFriendGroupLeaderboard(groupId);
      const leaderboardWithoutPasswords = leaderboard.map(({ password, ...user }) => user);
      res.json(leaderboardWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to get group leaderboard", error });
    }
  });
  app2.get("/api/games", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId) : void 0;
      const activeOnly = req.query.activeOnly === "true";
      let games2;
      if (activeOnly) {
        games2 = await storage.getActiveGames();
      } else if (userId) {
        games2 = await storage.getGamesByUser(userId);
      } else {
        games2 = await storage.getActiveGames();
      }
      res.json(games2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get games", error });
    }
  });
  app2.post("/api/games", async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData);
      res.json(game);
    } catch (error) {
      res.status(400).json({ message: "Invalid game data", error });
    }
  });
  app2.get("/api/games/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const game = await storage.getGame(id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to get game", error });
    }
  });
  app2.patch("/api/games/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const game = await storage.updateGame(id, updates);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to update game", error });
    }
  });
  app2.post("/api/games/:id/join", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const participant = await storage.addGameParticipant({ gameId, userId });
      res.json(participant);
    } catch (error) {
      res.status(400).json({ message: "Failed to join game", error });
    }
  });
  app2.get("/api/games/:id/participants", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const participants = await storage.getGameParticipants(gameId);
      const participantsWithoutPasswords = participants.map((p) => ({
        ...p,
        user: { ...p.user, password: void 0 }
      }));
      res.json(participantsWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to get participants", error });
    }
  });
  app2.post("/api/games/:id/answer", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const answerData = insertGameAnswerSchema.parse({ ...req.body, gameId });
      const question = await storage.getQuestion(answerData.questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      const isCorrect = question.correctAnswer === answerData.selectedAnswer;
      const answer = await storage.recordGameAnswer({ ...answerData, isCorrect });
      res.json(answer);
    } catch (error) {
      res.status(400).json({ message: "Failed to record answer", error });
    }
  });
  app2.get("/api/games/:id/answers", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const questionId = req.query.questionId ? parseInt(req.query.questionId) : void 0;
      const answers = await storage.getGameAnswers(gameId, questionId);
      res.json(answers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get answers", error });
    }
  });
  app2.get("/api/live-competitions/upcoming", async (req, res) => {
    try {
      const competitions = await storage.getUpcomingCompetitions();
      res.json(competitions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get upcoming competitions", error });
    }
  });
  app2.get("/api/live-competitions/live", async (req, res) => {
    try {
      const competitions = await storage.getLiveCompetitions();
      res.json(competitions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get live competitions", error });
    }
  });
  app2.post("/api/live-competitions", async (req, res) => {
    try {
      const competitionData = insertLiveCompetitionSchema.parse(req.body);
      const competition = await storage.createLiveCompetition(competitionData);
      res.json(competition);
    } catch (error) {
      res.status(400).json({ message: "Failed to create competition", error });
    }
  });
  app2.get("/api/live-competitions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const competition = await storage.getLiveCompetition(id);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      res.json(competition);
    } catch (error) {
      res.status(500).json({ message: "Failed to get competition", error });
    }
  });
  app2.post("/api/live-competitions/:id/join", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.id);
      const { userId } = req.body;
      const participant = await storage.joinLiveCompetition(competitionId, userId);
      broadcastToCompetition(competitionId, {
        type: "participant_joined",
        participant: { ...participant, user: await storage.getUser(userId) }
      });
      res.json(participant);
    } catch (error) {
      res.status(400).json({ message: "Failed to join competition", error });
    }
  });
  app2.get("/api/live-competitions/:id/participants", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.id);
      const participants = await storage.getLiveCompetitionParticipants(competitionId);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ message: "Failed to get participants", error });
    }
  });
  app2.post("/api/live-competitions/:id/answer", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.id);
      const answerData = { ...insertLiveCompetitionAnswerSchema.parse(req.body), competitionId };
      const question = await storage.getQuestion(answerData.questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      const isCorrect = question.correctAnswer === answerData.selectedAnswer || question.acceptableAnswers && question.acceptableAnswers.includes(answerData.selectedAnswer);
      const answer = await storage.recordLiveCompetitionAnswer({ ...answerData, isCorrect });
      broadcastToCompetition(competitionId, {
        type: "answer_submitted",
        userId: answerData.userId,
        questionId: answerData.questionId,
        timeToAnswer: answerData.timeToAnswer
      });
      res.json(answer);
    } catch (error) {
      res.status(400).json({ message: "Failed to record answer", error });
    }
  });
  function broadcastToCompetition(competitionId, message) {
    const clients = liveCompetitionClients.get(competitionId);
    if (clients) {
      const messageStr = JSON.stringify(message);
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
  }
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws) => {
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        switch (data.type) {
          case "join_competition":
            ws.userId = data.userId;
            ws.competitionId = data.competitionId;
            if (!liveCompetitionClients.has(data.competitionId)) {
              liveCompetitionClients.set(data.competitionId, /* @__PURE__ */ new Set());
            }
            liveCompetitionClients.get(data.competitionId).add(ws);
            await storage.updateParticipantConnection(data.competitionId, data.userId, true);
            const competition = await storage.getLiveCompetition(data.competitionId);
            const participants = await storage.getLiveCompetitionParticipants(data.competitionId);
            ws.send(JSON.stringify({
              type: "competition_state",
              competition,
              participants
            }));
            break;
          case "start_competition":
            if (ws.competitionId) {
              await storage.updateLiveCompetition(ws.competitionId, { status: "live" });
              broadcastToCompetition(ws.competitionId, {
                type: "competition_started"
              });
            }
            break;
          case "next_question":
            if (ws.competitionId) {
              const competition2 = await storage.getLiveCompetition(ws.competitionId);
              if (competition2) {
                const nextIndex = competition2.currentQuestionIndex + 1;
                await storage.updateLiveCompetition(ws.competitionId, {
                  currentQuestionIndex: nextIndex
                });
                const nextQuestion = competition2.questionIds && competition2.questionIds[nextIndex] ? await storage.getQuestion(competition2.questionIds[nextIndex]) : null;
                broadcastToCompetition(ws.competitionId, {
                  type: "next_question",
                  question: nextQuestion,
                  questionIndex: nextIndex
                });
              }
            }
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    ws.on("close", async () => {
      if (ws.competitionId && ws.userId) {
        const clients = liveCompetitionClients.get(ws.competitionId);
        if (clients) {
          clients.delete(ws);
          if (clients.size === 0) {
            liveCompetitionClients.delete(ws.competitionId);
          }
        }
        await storage.updateParticipantConnection(ws.competitionId, ws.userId, false);
        broadcastToCompetition(ws.competitionId, {
          type: "participant_disconnected",
          userId: ws.userId
        });
      }
    });
  });
  app2.get("/api/question-suggestions", async (req, res) => {
    try {
      const { status, submittedBy } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (submittedBy) filters.submittedBy = parseInt(submittedBy);
      const suggestions = await storage.getQuestionSuggestions(filters);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question suggestions" });
    }
  });
  app2.post("/api/question-suggestions", async (req, res) => {
    try {
      const data = insertQuestionSuggestionSchema.parse(req.body);
      const suggestion = await storage.createQuestionSuggestion(data);
      res.json(suggestion);
    } catch (error) {
      res.status(400).json({ message: "Invalid suggestion data" });
    }
  });
  app2.post("/api/question-suggestions/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reviewedBy, reviewNotes } = req.body;
      if (!reviewedBy) {
        return res.status(400).json({ message: "Reviewer ID is required" });
      }
      const question = await storage.approveQuestionSuggestion(id, reviewedBy, reviewNotes);
      if (!question) {
        return res.status(404).json({ message: "Suggestion not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve suggestion" });
    }
  });
  app2.post("/api/question-suggestions/:id/reject", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reviewedBy, reviewNotes } = req.body;
      if (!reviewedBy || !reviewNotes) {
        return res.status(400).json({ message: "Reviewer ID and review notes are required" });
      }
      const suggestion = await storage.rejectQuestionSuggestion(id, reviewedBy, reviewNotes);
      if (!suggestion) {
        return res.status(404).json({ message: "Suggestion not found" });
      }
      res.json(suggestion);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject suggestion" });
    }
  });
  app2.post("/api/questions/:id/schedule", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { scheduledAt } = req.body;
      if (!scheduledAt) {
        return res.status(400).json({ message: "Scheduled date is required" });
      }
      const question = await storage.scheduleQuestion(id, new Date(scheduledAt));
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to schedule question" });
    }
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000");
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
