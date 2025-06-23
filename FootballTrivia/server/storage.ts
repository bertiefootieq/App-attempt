import { 
  User, InsertUser, Question, InsertQuestion, FriendGroup, InsertFriendGroup,
  Game, InsertGame, GameParticipant, InsertGameParticipant, GameAnswer, InsertGameAnswer,
  FriendGroupMember, LiveCompetition, InsertLiveCompetition, LiveCompetitionParticipant,
  InsertLiveCompetitionParticipant, LiveCompetitionAnswer, InsertLiveCompetitionAnswer,
  QuestionSuggestion, InsertQuestionSuggestion
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStats(id: number, stats: Partial<Pick<User, 'totalScore' | 'gamesPlayed' | 'gamesWon' | 'currentStreak'>>): Promise<User | undefined>;
  getLeaderboard(limit?: number): Promise<User[]>;

  // Question methods
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestions(filters?: Partial<Pick<Question, 'difficulty' | 'category' | 'type' | 'isActive'>>): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, updates: Partial<Question>): Promise<Question | undefined>;
  getScheduledQuestions(date: Date): Promise<Question[]>;

  // Friend Group methods
  getFriendGroup(id: number): Promise<FriendGroup | undefined>;
  getFriendGroupsByUser(userId: number): Promise<FriendGroup[]>;
  createFriendGroup(group: InsertFriendGroup): Promise<FriendGroup>;
  addUserToFriendGroup(groupId: number, userId: number): Promise<FriendGroupMember>;
  getFriendGroupMembers(groupId: number): Promise<User[]>;
  getFriendGroupLeaderboard(groupId: number): Promise<User[]>;

  // Game methods
  getGame(id: number): Promise<Game | undefined>;
  getActiveGames(): Promise<Game[]>;
  getGamesByUser(userId: number): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined>;
  addGameParticipant(participant: InsertGameParticipant): Promise<GameParticipant>;
  getGameParticipants(gameId: number): Promise<(GameParticipant & { user: User })[]>;
  recordGameAnswer(answer: InsertGameAnswer): Promise<GameAnswer>;
  getGameAnswers(gameId: number, questionId?: number): Promise<GameAnswer[]>;

  // Live Competition methods
  getLiveCompetition(id: number): Promise<LiveCompetition | undefined>;
  getUpcomingCompetitions(): Promise<LiveCompetition[]>;
  getLiveCompetitions(): Promise<LiveCompetition[]>;
  createLiveCompetition(competition: InsertLiveCompetition): Promise<LiveCompetition>;
  updateLiveCompetition(id: number, updates: Partial<LiveCompetition>): Promise<LiveCompetition | undefined>;
  joinLiveCompetition(competitionId: number, userId: number): Promise<LiveCompetitionParticipant>;
  getLiveCompetitionParticipants(competitionId: number): Promise<(LiveCompetitionParticipant & { user: User })[]>;
  recordLiveCompetitionAnswer(answer: InsertLiveCompetitionAnswer): Promise<LiveCompetitionAnswer>;
  getLiveCompetitionAnswers(competitionId: number, questionId?: number): Promise<LiveCompetitionAnswer[]>;
  updateParticipantConnection(competitionId: number, userId: number, isConnected: boolean): Promise<void>;

  // Question Suggestion methods
  getQuestionSuggestion(id: number): Promise<QuestionSuggestion | undefined>;
  getQuestionSuggestions(filters?: Partial<Pick<QuestionSuggestion, 'status' | 'submittedBy'>>): Promise<(QuestionSuggestion & { submittedByUser: User })[]>;
  createQuestionSuggestion(suggestion: InsertQuestionSuggestion): Promise<QuestionSuggestion>;
  updateQuestionSuggestion(id: number, updates: Partial<QuestionSuggestion>): Promise<QuestionSuggestion | undefined>;
  approveQuestionSuggestion(id: number, reviewedBy: number, reviewNotes?: string): Promise<Question | undefined>;
  rejectQuestionSuggestion(id: number, reviewedBy: number, reviewNotes: string): Promise<QuestionSuggestion | undefined>;
  scheduleQuestion(questionId: number, scheduledAt: Date): Promise<Question | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private questions: Map<number, Question> = new Map();
  private friendGroups: Map<number, FriendGroup> = new Map();
  private friendGroupMembers: Map<number, FriendGroupMember> = new Map();
  private games: Map<number, Game> = new Map();
  private gameParticipants: Map<number, GameParticipant> = new Map();
  private gameAnswers: Map<number, GameAnswer> = new Map();
  private liveCompetitions: Map<number, LiveCompetition> = new Map();
  private liveCompetitionParticipants: Map<number, LiveCompetitionParticipant> = new Map();
  private liveCompetitionAnswers: Map<number, LiveCompetitionAnswer> = new Map();
  private questionSuggestions: Map<number, QuestionSuggestion> = new Map();
  
  private currentUserId = 1;
  private currentQuestionId = 1;
  private currentFriendGroupId = 1;
  private currentFriendGroupMemberId = 1;
  private currentGameId = 1;
  private currentGameParticipantId = 1;
  private currentGameAnswerId = 1;
  private currentLiveCompetitionId = 1;
  private currentLiveCompetitionParticipantId = 1;
  private currentLiveCompetitionAnswerId = 1;
  private currentQuestionSuggestionId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create initial users
    const users = [
      { username: "admin", email: "admin@example.com", password: "admin123", displayName: "Admin User", totalScore: 0, gamesPlayed: 0, gamesWon: 0, currentStreak: 0 },
      { username: "john_doe", email: "john@example.com", password: "password123", displayName: "John Doe", totalScore: 1250, gamesPlayed: 47, gamesWon: 34, currentStreak: 8 },
      { username: "emma_wilson", email: "emma@example.com", password: "password123", displayName: "Emma Wilson", totalScore: 2847, gamesPlayed: 156, gamesWon: 139, currentStreak: 25 },
      { username: "mike_johnson", email: "mike@example.com", password: "password123", displayName: "Mike Johnson", totalScore: 1890, gamesPlayed: 89, gamesWon: 65, currentStreak: 12 },
    ];

    users.forEach(userData => {
      const user: User = {
        id: this.currentUserId++,
        ...userData,
        createdAt: new Date(),
      };
      this.users.set(user.id, user);
    });

    // Create sample difficult text-input questions
    const sampleQuestions = [
      {
        text: "Which goalkeeper holds the record for the most clean sheets in a single Premier League season, achieving 24 clean sheets?",
        correctAnswer: "Petr Cech",
        acceptableAnswers: ["Petr Cech", "Petr Čech", "Cech", "Čech"],
        difficulty: "hard",
        category: "Premier League Records",
        type: "text-input",
        createdBy: 1,
      },
      {
        text: "Name the Italian defender who scored the winning goal in the 2006 World Cup Final penalty shootout.",
        correctAnswer: "Fabio Grosso",
        acceptableAnswers: ["Fabio Grosso", "Grosso"],
        difficulty: "hard",
        category: "World Cup History",
        type: "text-input",
        createdBy: 1,
      },
      {
        text: "What is the name of the stadium where Athletic Bilbao plays their home matches?",
        correctAnswer: "San Mamés",
        acceptableAnswers: ["San Mamés", "San Mames", "Estadio San Mamés"],
        difficulty: "medium",
        category: "Stadiums",
        type: "text-input",
        createdBy: 1,
      },
      {
        text: "Which Brazilian footballer is known as 'The Phenomenon' and won the Ballon d'Or twice?",
        correctAnswer: "Ronaldo",
        acceptableAnswers: ["Ronaldo", "Ronaldo Nazário", "R9"],
        difficulty: "medium",
        category: "Player Nicknames",
        type: "text-input",
        createdBy: 1,
      },
      {
        text: "In which year did Leicester City win the Premier League title?",
        correctAnswer: "2016",
        acceptableAnswers: ["2016", "2015-16", "2015/16"],
        difficulty: "easy",
        category: "Premier League History",
        type: "text-input",
        createdBy: 1,
      },
    ];

    sampleQuestions.forEach(questionData => {
      const question: Question = {
        id: this.currentQuestionId++,
        ...questionData,
        timeLimit: 60,
        isActive: true,
        scheduledAt: null,
        createdAt: new Date(),
      };
      this.questions.set(question.id, question);
    });

    // Create sample live competitions
    const now = new Date();
    const futureDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const nearFutureDate = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    
    const liveCompetitions = [
      {
        title: "Friday Night Football Quiz",
        description: "Test your football knowledge in this exciting live competition!",
        scheduledStart: futureDate,
        duration: 1800, // 30 minutes
        status: "scheduled",
        questionIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        maxParticipants: 50,
        createdBy: 1,
      },
      {
        title: "Premier League Legends",
        description: "How well do you know Premier League history?",
        scheduledStart: nearFutureDate,
        duration: 1200, // 20 minutes
        status: "scheduled",
        questionIds: [1, 3, 5, 7, 9, 11, 13, 15],
        maxParticipants: 30,
        createdBy: 1,
      }
    ];

    liveCompetitions.forEach(compData => {
      const competition: LiveCompetition = {
        id: this.currentLiveCompetitionId++,
        ...compData,
        currentParticipants: 0,
        currentQuestionIndex: 0,
        createdAt: new Date(),
      };
      this.liveCompetitions.set(competition.id, competition);
    });

    // Create sample question suggestions
    const sampleSuggestions = [
      {
        text: "Which player scored the most goals in the 2018 FIFA World Cup?",
        correctAnswer: "Harry Kane",
        answerA: "Harry Kane",
        answerB: "Cristiano Ronaldo", 
        answerC: "Kylian Mbappé",
        answerD: "Romelu Lukaku",
        difficulty: "medium",
        category: "World Cup",
        type: "multiple-choice",
        explanation: "Harry Kane won the Golden Boot with 6 goals in the 2018 World Cup in Russia.",
        submittedBy: 2,
      },
      {
        text: "What year was the offside rule introduced in football?",
        correctAnswer: "1863",
        acceptableAnswers: ["1863"],
        difficulty: "hard",
        category: "History",
        type: "text-input",
        explanation: "The offside rule was part of the original Laws of the Game established in 1863.",
        submittedBy: 3,
      }
    ];

    sampleSuggestions.forEach(suggestionData => {
      const suggestion: QuestionSuggestion = {
        id: this.currentQuestionSuggestionId++,
        ...suggestionData,
        status: "pending",
        reviewedBy: null,
        reviewNotes: null,
        createdAt: new Date(),
        reviewedAt: null,
      };
      this.questionSuggestions.set(suggestion.id, suggestion);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.currentUserId++,
      ...insertUser,
      totalScore: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUserStats(id: number, stats: Partial<Pick<User, 'totalScore' | 'gamesPlayed' | 'gamesWon' | 'currentStreak'>>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...stats };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getLeaderboard(limit = 50): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .slice(0, limit);
  }

  // Question methods
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async getQuestions(filters?: Partial<Pick<Question, 'difficulty' | 'category' | 'type' | 'isActive'>>): Promise<Question[]> {
    let questions = Array.from(this.questions.values());
    
    if (filters) {
      questions = questions.filter(question => {
        return Object.entries(filters).every(([key, value]) => 
          question[key as keyof Question] === value
        );
      });
    }
    
    return questions;
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const question: Question = {
      id: this.currentQuestionId++,
      ...insertQuestion,
      type: insertQuestion.type || "multiple-choice",
      createdAt: new Date(),
    };
    this.questions.set(question.id, question);
    return question;
  }

  async updateQuestion(id: number, updates: Partial<Question>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const updatedQuestion = { ...question, ...updates };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async getScheduledQuestions(date: Date): Promise<Question[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return Array.from(this.questions.values()).filter(question => 
      question.scheduledAt && 
      question.scheduledAt >= startOfDay && 
      question.scheduledAt <= endOfDay
    );
  }

  // Friend Group methods
  async getFriendGroup(id: number): Promise<FriendGroup | undefined> {
    return this.friendGroups.get(id);
  }

  async getFriendGroupsByUser(userId: number): Promise<FriendGroup[]> {
    const userGroups = Array.from(this.friendGroupMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.groupId);
    
    return Array.from(this.friendGroups.values())
      .filter(group => userGroups.includes(group.id));
  }

  async createFriendGroup(insertGroup: InsertFriendGroup): Promise<FriendGroup> {
    const group: FriendGroup = {
      id: this.currentFriendGroupId++,
      ...insertGroup,
      memberCount: 1,
      gamesPlayed: 0,
      activeStreak: 0,
      createdAt: new Date(),
    };
    this.friendGroups.set(group.id, group);

    // Add creator as first member
    if (insertGroup.createdBy) {
      await this.addUserToFriendGroup(group.id, insertGroup.createdBy);
    }

    return group;
  }

  async addUserToFriendGroup(groupId: number, userId: number): Promise<FriendGroupMember> {
    const member: FriendGroupMember = {
      id: this.currentFriendGroupMemberId++,
      groupId,
      userId,
      joinedAt: new Date(),
    };
    this.friendGroupMembers.set(member.id, member);

    // Update member count
    const group = this.friendGroups.get(groupId);
    if (group) {
      group.memberCount = Array.from(this.friendGroupMembers.values())
        .filter(m => m.groupId === groupId).length;
      this.friendGroups.set(groupId, group);
    }

    return member;
  }

  async getFriendGroupMembers(groupId: number): Promise<User[]> {
    const memberIds = Array.from(this.friendGroupMembers.values())
      .filter(member => member.groupId === groupId)
      .map(member => member.userId);
    
    return Array.from(this.users.values())
      .filter(user => memberIds.includes(user.id));
  }

  async getFriendGroupLeaderboard(groupId: number): Promise<User[]> {
    const members = await this.getFriendGroupMembers(groupId);
    return members.sort((a, b) => b.totalScore - a.totalScore);
  }

  // Game methods
  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getActiveGames(): Promise<Game[]> {
    return Array.from(this.games.values())
      .filter(game => game.status === 'active' || game.status === 'waiting');
  }

  async getGamesByUser(userId: number): Promise<Game[]> {
    const userGameIds = Array.from(this.gameParticipants.values())
      .filter(participant => participant.userId === userId)
      .map(participant => participant.gameId);
    
    return Array.from(this.games.values())
      .filter(game => userGameIds.includes(game.id));
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const game: Game = {
      id: this.currentGameId++,
      ...insertGame,
      currentPlayers: 0,
      currentQuestionIndex: 0,
      startedAt: null,
      endedAt: null,
      createdAt: new Date(),
    };
    this.games.set(game.id, game);
    return game;
  }

  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const updatedGame = { ...game, ...updates };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async addGameParticipant(insertParticipant: InsertGameParticipant): Promise<GameParticipant> {
    const participant: GameParticipant = {
      id: this.currentGameParticipantId++,
      ...insertParticipant,
      score: 0,
      isEliminated: false,
      joinedAt: new Date(),
    };
    this.gameParticipants.set(participant.id, participant);

    // Update game's current player count
    const game = this.games.get(participant.gameId);
    if (game) {
      game.currentPlayers = Array.from(this.gameParticipants.values())
        .filter(p => p.gameId === participant.gameId).length;
      this.games.set(participant.gameId, game);
    }

    return participant;
  }

  async getGameParticipants(gameId: number): Promise<(GameParticipant & { user: User })[]> {
    const participants = Array.from(this.gameParticipants.values())
      .filter(participant => participant.gameId === gameId);
    
    return participants.map(participant => {
      const user = this.users.get(participant.userId);
      return { ...participant, user: user! };
    }).filter(p => p.user);
  }

  async recordGameAnswer(insertAnswer: InsertGameAnswer): Promise<GameAnswer> {
    const answer: GameAnswer = {
      id: this.currentGameAnswerId++,
      ...insertAnswer,
      answeredAt: new Date(),
    };
    this.gameAnswers.set(answer.id, answer);
    return answer;
  }

  async getGameAnswers(gameId: number, questionId?: number): Promise<GameAnswer[]> {
    return Array.from(this.gameAnswers.values()).filter(answer => {
      if (answer.gameId !== gameId) return false;
      if (questionId && answer.questionId !== questionId) return false;
      return true;
    });
  }

  // Live Competition methods
  async getLiveCompetition(id: number): Promise<LiveCompetition | undefined> {
    return this.liveCompetitions.get(id);
  }

  async getUpcomingCompetitions(): Promise<LiveCompetition[]> {
    const now = new Date();
    return Array.from(this.liveCompetitions.values()).filter(comp => 
      comp.status === 'scheduled' && new Date(comp.scheduledStart) > now
    );
  }

  async getLiveCompetitions(): Promise<LiveCompetition[]> {
    return Array.from(this.liveCompetitions.values()).filter(comp => 
      comp.status === 'live'
    );
  }

  async createLiveCompetition(insertCompetition: InsertLiveCompetition): Promise<LiveCompetition> {
    const competition: LiveCompetition = {
      id: this.currentLiveCompetitionId++,
      ...insertCompetition,
      currentParticipants: 0,
      currentQuestionIndex: 0,
      createdAt: new Date(),
    };
    this.liveCompetitions.set(competition.id, competition);
    return competition;
  }

  async updateLiveCompetition(id: number, updates: Partial<LiveCompetition>): Promise<LiveCompetition | undefined> {
    const competition = this.liveCompetitions.get(id);
    if (!competition) return undefined;
    
    const updated = { ...competition, ...updates };
    this.liveCompetitions.set(id, updated);
    return updated;
  }

  async joinLiveCompetition(competitionId: number, userId: number): Promise<LiveCompetitionParticipant> {
    const participant: LiveCompetitionParticipant = {
      id: this.currentLiveCompetitionParticipantId++,
      competitionId,
      userId,
      score: 0,
      isConnected: true,
      joinedAt: new Date(),
    };
    
    this.liveCompetitionParticipants.set(participant.id, participant);
    
    // Update participant count
    const competition = this.liveCompetitions.get(competitionId);
    if (competition) {
      const updated = { ...competition, currentParticipants: competition.currentParticipants + 1 };
      this.liveCompetitions.set(competitionId, updated);
    }
    
    return participant;
  }

  async getLiveCompetitionParticipants(competitionId: number): Promise<(LiveCompetitionParticipant & { user: User })[]> {
    const participants = Array.from(this.liveCompetitionParticipants.values())
      .filter(p => p.competitionId === competitionId);
    
    return participants.map(participant => {
      const user = this.users.get(participant.userId);
      return { ...participant, user: user! };
    }).filter(p => p.user);
  }

  async recordLiveCompetitionAnswer(insertAnswer: InsertLiveCompetitionAnswer): Promise<LiveCompetitionAnswer> {
    const answer: LiveCompetitionAnswer = {
      id: this.currentLiveCompetitionAnswerId++,
      ...insertAnswer,
      answeredAt: new Date(),
    };
    this.liveCompetitionAnswers.set(answer.id, answer);
    return answer;
  }

  async getLiveCompetitionAnswers(competitionId: number, questionId?: number): Promise<LiveCompetitionAnswer[]> {
    return Array.from(this.liveCompetitionAnswers.values()).filter(answer => {
      if (answer.competitionId !== competitionId) return false;
      if (questionId && answer.questionId !== questionId) return false;
      return true;
    });
  }

  async updateParticipantConnection(competitionId: number, userId: number, isConnected: boolean): Promise<void> {
    const participant = Array.from(this.liveCompetitionParticipants.values())
      .find(p => p.competitionId === competitionId && p.userId === userId);
    
    if (participant) {
      const updated = { ...participant, isConnected };
      this.liveCompetitionParticipants.set(participant.id, updated);
    }
  }

  // Question Suggestion methods
  async getQuestionSuggestion(id: number): Promise<QuestionSuggestion | undefined> {
    return this.questionSuggestions.get(id);
  }

  async getQuestionSuggestions(filters?: Partial<Pick<QuestionSuggestion, 'status' | 'submittedBy'>>): Promise<(QuestionSuggestion & { submittedByUser: User })[]> {
    let suggestions = Array.from(this.questionSuggestions.values());
    
    if (filters) {
      suggestions = suggestions.filter(suggestion => {
        return Object.entries(filters).every(([key, value]) => 
          suggestion[key as keyof QuestionSuggestion] === value
        );
      });
    }
    
    return suggestions.map(suggestion => ({
      ...suggestion,
      submittedByUser: this.users.get(suggestion.submittedBy!)!
    }));
  }

  async createQuestionSuggestion(insertSuggestion: InsertQuestionSuggestion): Promise<QuestionSuggestion> {
    const suggestion: QuestionSuggestion = {
      id: this.currentQuestionSuggestionId++,
      ...insertSuggestion,
      status: "pending",
      reviewedBy: null,
      reviewNotes: null,
      createdAt: new Date(),
      reviewedAt: null,
    };
    this.questionSuggestions.set(suggestion.id, suggestion);
    return suggestion;
  }

  async updateQuestionSuggestion(id: number, updates: Partial<QuestionSuggestion>): Promise<QuestionSuggestion | undefined> {
    const suggestion = this.questionSuggestions.get(id);
    if (!suggestion) return undefined;
    
    const updatedSuggestion = { ...suggestion, ...updates };
    this.questionSuggestions.set(id, updatedSuggestion);
    return updatedSuggestion;
  }

  async approveQuestionSuggestion(id: number, reviewedBy: number, reviewNotes?: string): Promise<Question | undefined> {
    const suggestion = this.questionSuggestions.get(id);
    if (!suggestion) return undefined;

    // Create a new question from the approved suggestion
    const newQuestion: Question = {
      id: this.currentQuestionId++,
      text: suggestion.text,
      correctAnswer: suggestion.correctAnswer,
      acceptableAnswers: suggestion.acceptableAnswers || [suggestion.correctAnswer],
      difficulty: suggestion.difficulty,
      category: suggestion.category,
      type: suggestion.type || "text-input",
      timeLimit: 30, // Default time limit
      isActive: true,
      scheduledAt: null,
      createdBy: reviewedBy,
      createdAt: new Date(),
    };
    
    this.questions.set(newQuestion.id, newQuestion);

    // Update the suggestion status
    const updatedSuggestion = {
      ...suggestion,
      status: "approved" as const,
      reviewedBy,
      reviewNotes,
      reviewedAt: new Date(),
    };
    this.questionSuggestions.set(id, updatedSuggestion);

    return newQuestion;
  }

  async rejectQuestionSuggestion(id: number, reviewedBy: number, reviewNotes: string): Promise<QuestionSuggestion | undefined> {
    const suggestion = this.questionSuggestions.get(id);
    if (!suggestion) return undefined;

    const updatedSuggestion = {
      ...suggestion,
      status: "rejected" as const,
      reviewedBy,
      reviewNotes,
      reviewedAt: new Date(),
    };
    this.questionSuggestions.set(id, updatedSuggestion);
    return updatedSuggestion;
  }

  async scheduleQuestion(questionId: number, scheduledAt: Date): Promise<Question | undefined> {
    const question = this.questions.get(questionId);
    if (!question) return undefined;

    const updatedQuestion = { ...question, scheduledAt };
    this.questions.set(questionId, updatedQuestion);
    return updatedQuestion;
  }
}

export const storage = new MemStorage();
