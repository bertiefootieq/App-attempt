import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertQuestionSchema, insertFriendGroupSchema, insertGameSchema, insertGameParticipantSchema, insertGameAnswerSchema, insertLiveCompetitionSchema, insertLiveCompetitionAnswerSchema, insertQuestionSuggestionSchema } from "@shared/schema";
import { z } from "zod";

interface WebSocketClient extends WebSocket {
  userId?: number;
  competitionId?: number;
}

const liveCompetitionClients = new Map<number, Set<WebSocketClient>>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
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

  app.post("/api/auth/login", async (req, res) => {
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

  // User routes
  app.get("/api/users/:id", async (req, res) => {
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

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const users = await storage.getLeaderboard(limit);
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to get leaderboard", error });
    }
  });

  // Question routes
  app.get("/api/questions", async (req, res) => {
    try {
      const filters = {
        ...(req.query.difficulty && { difficulty: req.query.difficulty as string }),
        ...(req.query.category && { category: req.query.category as string }),
        ...(req.query.type && { type: req.query.type as string }),
        ...(req.query.isActive !== undefined && { isActive: req.query.isActive === 'true' }),
      };
      
      const questions = await storage.getQuestions(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get questions", error });
    }
  });

  app.post("/api/questions", async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);
      res.json(question);
    } catch (error) {
      res.status(400).json({ message: "Invalid question data", error });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
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

  app.get("/api/questions/scheduled/:date", async (req, res) => {
    try {
      const date = new Date(req.params.date);
      const questions = await storage.getScheduledQuestions(date);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get scheduled questions", error });
    }
  });

  // Friend Group routes
  app.get("/api/friend-groups", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const groups = await storage.getFriendGroupsByUser(userId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to get friend groups", error });
    }
  });

  app.post("/api/friend-groups", async (req, res) => {
    try {
      const groupData = insertFriendGroupSchema.parse(req.body);
      const group = await storage.createFriendGroup(groupData);
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: "Invalid group data", error });
    }
  });

  app.post("/api/friend-groups/:id/members", async (req, res) => {
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

  app.get("/api/friend-groups/:id/members", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const members = await storage.getFriendGroupMembers(groupId);
      const membersWithoutPasswords = members.map(({ password, ...member }) => member);
      res.json(membersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to get group members", error });
    }
  });

  app.get("/api/friend-groups/:id/leaderboard", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const leaderboard = await storage.getFriendGroupLeaderboard(groupId);
      const leaderboardWithoutPasswords = leaderboard.map(({ password, ...user }) => user);
      res.json(leaderboardWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to get group leaderboard", error });
    }
  });

  // Game routes
  app.get("/api/games", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const activeOnly = req.query.activeOnly === 'true';
      
      let games;
      if (activeOnly) {
        games = await storage.getActiveGames();
      } else if (userId) {
        games = await storage.getGamesByUser(userId);
      } else {
        games = await storage.getActiveGames(); // Default to active games
      }
      
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to get games", error });
    }
  });

  app.post("/api/games", async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData);
      res.json(game);
    } catch (error) {
      res.status(400).json({ message: "Invalid game data", error });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
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

  app.patch("/api/games/:id", async (req, res) => {
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

  app.post("/api/games/:id/join", async (req, res) => {
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

  app.get("/api/games/:id/participants", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const participants = await storage.getGameParticipants(gameId);
      const participantsWithoutPasswords = participants.map(p => ({
        ...p,
        user: { ...p.user, password: undefined }
      }));
      res.json(participantsWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to get participants", error });
    }
  });

  app.post("/api/games/:id/answer", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const answerData = insertGameAnswerSchema.parse({ ...req.body, gameId });
      
      // Get the question to check if answer is correct
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

  app.get("/api/games/:id/answers", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const questionId = req.query.questionId ? parseInt(req.query.questionId as string) : undefined;
      const answers = await storage.getGameAnswers(gameId, questionId);
      res.json(answers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get answers", error });
    }
  });

  // Live Competition routes
  app.get("/api/live-competitions/upcoming", async (req, res) => {
    try {
      const competitions = await storage.getUpcomingCompetitions();
      res.json(competitions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get upcoming competitions", error });
    }
  });

  app.get("/api/live-competitions/live", async (req, res) => {
    try {
      const competitions = await storage.getLiveCompetitions();
      res.json(competitions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get live competitions", error });
    }
  });

  app.post("/api/live-competitions", async (req, res) => {
    try {
      const competitionData = insertLiveCompetitionSchema.parse(req.body);
      const competition = await storage.createLiveCompetition(competitionData);
      res.json(competition);
    } catch (error) {
      res.status(400).json({ message: "Failed to create competition", error });
    }
  });

  app.get("/api/live-competitions/:id", async (req, res) => {
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

  app.post("/api/live-competitions/:id/join", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.id);
      const { userId } = req.body;
      
      const participant = await storage.joinLiveCompetition(competitionId, userId);
      
      // Broadcast to WebSocket clients
      broadcastToCompetition(competitionId, {
        type: 'participant_joined',
        participant: { ...participant, user: await storage.getUser(userId) }
      });
      
      res.json(participant);
    } catch (error) {
      res.status(400).json({ message: "Failed to join competition", error });
    }
  });

  app.get("/api/live-competitions/:id/participants", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.id);
      const participants = await storage.getLiveCompetitionParticipants(competitionId);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ message: "Failed to get participants", error });
    }
  });

  app.post("/api/live-competitions/:id/answer", async (req, res) => {
    try {
      const competitionId = parseInt(req.params.id);
      const answerData = { ...insertLiveCompetitionAnswerSchema.parse(req.body), competitionId };
      
      const question = await storage.getQuestion(answerData.questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const isCorrect = question.correctAnswer === answerData.selectedAnswer || 
                       (question.acceptableAnswers && question.acceptableAnswers.includes(answerData.selectedAnswer));
      
      const answer = await storage.recordLiveCompetitionAnswer({ ...answerData, isCorrect });
      
      // Broadcast answer to other participants (without revealing if it's correct)
      broadcastToCompetition(competitionId, {
        type: 'answer_submitted',
        userId: answerData.userId,
        questionId: answerData.questionId,
        timeToAnswer: answerData.timeToAnswer
      });
      
      res.json(answer);
    } catch (error) {
      res.status(400).json({ message: "Failed to record answer", error });
    }
  });

  // WebSocket functionality
  function broadcastToCompetition(competitionId: number, message: any) {
    const clients = liveCompetitionClients.get(competitionId);
    if (clients) {
      const messageStr = JSON.stringify(message);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
  }

  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocketClient) => {
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'join_competition':
            ws.userId = data.userId;
            ws.competitionId = data.competitionId;
            
            if (!liveCompetitionClients.has(data.competitionId)) {
              liveCompetitionClients.set(data.competitionId, new Set());
            }
            liveCompetitionClients.get(data.competitionId)!.add(ws);
            
            // Update participant connection status
            await storage.updateParticipantConnection(data.competitionId, data.userId, true);
            
            // Send current competition state
            const competition = await storage.getLiveCompetition(data.competitionId);
            const participants = await storage.getLiveCompetitionParticipants(data.competitionId);
            
            ws.send(JSON.stringify({
              type: 'competition_state',
              competition,
              participants
            }));
            break;
            
          case 'start_competition':
            if (ws.competitionId) {
              await storage.updateLiveCompetition(ws.competitionId, { status: 'live' });
              broadcastToCompetition(ws.competitionId, {
                type: 'competition_started'
              });
            }
            break;
            
          case 'next_question':
            if (ws.competitionId) {
              const competition = await storage.getLiveCompetition(ws.competitionId);
              if (competition) {
                const nextIndex = competition.currentQuestionIndex + 1;
                await storage.updateLiveCompetition(ws.competitionId, { 
                  currentQuestionIndex: nextIndex 
                });
                
                const nextQuestion = competition.questionIds && competition.questionIds[nextIndex] 
                  ? await storage.getQuestion(competition.questionIds[nextIndex])
                  : null;
                
                broadcastToCompetition(ws.competitionId, {
                  type: 'next_question',
                  question: nextQuestion,
                  questionIndex: nextIndex
                });
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', async () => {
      if (ws.competitionId && ws.userId) {
        // Remove from competition clients
        const clients = liveCompetitionClients.get(ws.competitionId);
        if (clients) {
          clients.delete(ws);
          if (clients.size === 0) {
            liveCompetitionClients.delete(ws.competitionId);
          }
        }
        
        // Update participant connection status
        await storage.updateParticipantConnection(ws.competitionId, ws.userId, false);
        
        // Notify other participants
        broadcastToCompetition(ws.competitionId, {
          type: 'participant_disconnected',
          userId: ws.userId
        });
      }
    });
  });

  // Question Suggestions routes
  app.get("/api/question-suggestions", async (req, res) => {
    try {
      const { status, submittedBy } = req.query;
      const filters: any = {};
      
      if (status) filters.status = status;
      if (submittedBy) filters.submittedBy = parseInt(submittedBy as string);
      
      const suggestions = await storage.getQuestionSuggestions(filters);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question suggestions" });
    }
  });

  app.post("/api/question-suggestions", async (req, res) => {
    try {
      const data = insertQuestionSuggestionSchema.parse(req.body);
      const suggestion = await storage.createQuestionSuggestion(data);
      res.json(suggestion);
    } catch (error) {
      res.status(400).json({ message: "Invalid suggestion data" });
    }
  });

  app.post("/api/question-suggestions/:id/approve", async (req, res) => {
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

  app.post("/api/question-suggestions/:id/reject", async (req, res) => {
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

  app.post("/api/questions/:id/schedule", async (req, res) => {
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
