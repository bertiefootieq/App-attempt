import type { Question, Game, GameParticipant, User } from "@shared/schema";

export interface GameState {
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeLeft: number;
  selectedAnswer: string | null;
  isActive: boolean;
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  gameStartTime: Date | null;
  questionStartTime: Date | null;
}

/**
 * Initialize a new game state
 */
export const initializeGameState = (totalQuestions: number = 10): GameState => {
  return {
    currentQuestion: null,
    currentQuestionIndex: 0,
    totalQuestions,
    timeLeft: 30,
    selectedAnswer: null,
    isActive: false,
    score: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    gameStartTime: null,
    questionStartTime: null,
  };
};

/**
 * Calculate score for a correct answer based on time taken
 */
export const calculateQuestionScore = (
  timeLimit: number,
  timeToAnswer: number,
  difficulty: string
): number => {
  const baseScore = getBaseScoreByDifficulty(difficulty);
  const timeBonus = Math.max(0, (timeLimit - timeToAnswer) / timeLimit);
  const bonusMultiplier = 0.5; // 50% bonus for speed
  
  return Math.round(baseScore * (1 + (timeBonus * bonusMultiplier)));
};

/**
 * Get base score by difficulty level
 */
export const getBaseScoreByDifficulty = (difficulty: string): number => {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 100;
    case 'medium': return 200;
    case 'hard': return 300;
    case 'expert': return 500;
    default: return 100;
  }
};

/**
 * Calculate final game score with bonuses
 */
export const calculateFinalScore = (gameState: GameState): number => {
  let finalScore = gameState.score;
  
  // Accuracy bonus
  const accuracy = gameState.correctAnswers / (gameState.correctAnswers + gameState.incorrectAnswers);
  if (accuracy >= 0.9) finalScore *= 1.5; // 50% bonus for 90%+ accuracy
  else if (accuracy >= 0.8) finalScore *= 1.3; // 30% bonus for 80%+ accuracy
  else if (accuracy >= 0.7) finalScore *= 1.2; // 20% bonus for 70%+ accuracy
  
  // Perfect game bonus
  if (gameState.correctAnswers === gameState.totalQuestions) {
    finalScore *= 2; // Double score for perfect game
  }
  
  // Speed bonus for completing quickly
  if (gameState.gameStartTime) {
    const gameTimeMinutes = (Date.now() - gameState.gameStartTime.getTime()) / (1000 * 60);
    if (gameTimeMinutes < 5) finalScore *= 1.2; // 20% bonus for finishing in under 5 minutes
  }
  
  return Math.round(finalScore);
};

/**
 * Shuffle an array (Fisher-Yates algorithm)
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Select random questions for a game
 */
export const selectGameQuestions = (
  questions: Question[],
  count: number,
  difficulty?: string,
  category?: string
): Question[] => {
  let filteredQuestions = questions.filter(q => q.isActive);
  
  if (difficulty) {
    filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
  }
  
  if (category) {
    filteredQuestions = filteredQuestions.filter(q => q.category === category);
  }
  
  const shuffled = shuffleArray(filteredQuestions);
  return shuffled.slice(0, count);
};

/**
 * Check if answer is correct
 */
export const isAnswerCorrect = (question: Question, selectedAnswer: string): boolean => {
  return question.correctAnswer === selectedAnswer;
};

/**
 * Get answer text by key
 */
export const getAnswerText = (question: Question, answerKey: string): string => {
  switch (answerKey) {
    case 'A': return question.answerA;
    case 'B': return question.answerB;
    case 'C': return question.answerC;
    case 'D': return question.answerD;
    default: return '';
  }
};

/**
 * Format time for display
 */
export const formatGameTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Get game progress percentage
 */
export const getGameProgress = (currentIndex: number, totalQuestions: number): number => {
  return Math.round((currentIndex / totalQuestions) * 100);
};

/**
 * Determine game result status
 */
export const getGameResultStatus = (gameState: GameState): 'excellent' | 'good' | 'fair' | 'poor' => {
  const accuracy = gameState.correctAnswers / gameState.totalQuestions;
  
  if (accuracy >= 0.9) return 'excellent';
  if (accuracy >= 0.7) return 'good';
  if (accuracy >= 0.5) return 'fair';
  return 'poor';
};

/**
 * Get status message for game result
 */
export const getGameResultMessage = (gameState: GameState): string => {
  const status = getGameResultStatus(gameState);
  
  switch (status) {
    case 'excellent':
      return "Outstanding performance! You're a true football expert!";
    case 'good':
      return "Great job! You know your football well!";
    case 'fair':
      return "Not bad! Keep practicing to improve your score.";
    case 'poor':
      return "Room for improvement. Study up on your football knowledge!";
    default:
      return "Thanks for playing!";
  }
};

/**
 * Check if user qualifies for streak bonus
 */
export const qualifiesForStreakBonus = (gameState: GameState): boolean => {
  return gameState.correctAnswers >= Math.ceil(gameState.totalQuestions * 0.8); // 80% accuracy required
};

/**
 * Generate game statistics
 */
export const generateGameStats = (gameState: GameState) => {
  const accuracy = gameState.totalQuestions > 0 ? 
    (gameState.correctAnswers / gameState.totalQuestions) * 100 : 0;
  
  const gameTime = gameState.gameStartTime ? 
    (Date.now() - gameState.gameStartTime.getTime()) / 1000 : 0;
  
  return {
    score: gameState.score,
    finalScore: calculateFinalScore(gameState),
    correctAnswers: gameState.correctAnswers,
    incorrectAnswers: gameState.incorrectAnswers,
    totalQuestions: gameState.totalQuestions,
    accuracy: Math.round(accuracy),
    gameTime: Math.round(gameTime),
    gameTimeFormatted: formatGameTime(gameTime),
    status: getGameResultStatus(gameState),
    message: getGameResultMessage(gameState),
    streakBonus: qualifiesForStreakBonus(gameState),
  };
};

/**
 * Update user stats after game completion
 */
export const updateUserStatsAfterGame = (
  user: User,
  gameStats: ReturnType<typeof generateGameStats>
): Partial<User> => {
  const isWin = gameStats.accuracy >= 70; // 70% accuracy = win
  
  return {
    totalScore: user.totalScore + gameStats.finalScore,
    gamesPlayed: user.gamesPlayed + 1,
    gamesWon: user.gamesWon + (isWin ? 1 : 0),
    currentStreak: isWin ? user.currentStreak + 1 : 0,
  };
};

/**
 * Format leaderboard position
 */
export const formatLeaderboardPosition = (position: number): string => {
  if (position === 1) return '🥇 1st';
  if (position === 2) return '🥈 2nd';
  if (position === 3) return '🥉 3rd';
  return `#${position}`;
};

/**
 * Get difficulty color class
 */
export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'hard': return 'text-orange-600';
    case 'expert': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

/**
 * Get category icon for display
 */
export const getCategoryIcon = (category: string): string => {
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory.includes('premier league')) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
  if (lowerCategory.includes('world cup')) return '🏆';
  if (lowerCategory.includes('champions league')) return '⭐';
  if (lowerCategory.includes('history')) return '📚';
  if (lowerCategory.includes('player')) return '👤';
  if (lowerCategory.includes('team')) return '👥';
  
  return '⚽';
};
