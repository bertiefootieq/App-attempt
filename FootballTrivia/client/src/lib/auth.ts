import type { User } from "@shared/schema";

/**
 * Get the current authenticated user from localStorage
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    
    // Validate that the user object has required properties
    if (!user.id || !user.username || !user.email) {
      localStorage.removeItem('currentUser');
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    localStorage.removeItem('currentUser');
    return null;
  }
};

/**
 * Set the current authenticated user in localStorage
 */
export const setCurrentUser = (user: User): void => {
  try {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } catch (error) {
    console.error('Error setting current user:', error);
  }
};

/**
 * Clear the current authenticated user from localStorage
 */
export const clearCurrentUser = (): void => {
  try {
    localStorage.removeItem('currentUser');
  } catch (error) {
    console.error('Error clearing current user:', error);
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null;
};

/**
 * Get user's initials for avatar display
 */
export const getUserInitials = (displayName: string): string => {
  return displayName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Get user's rank badge based on their score
 */
export const getUserRankBadge = (score: number): string => {
  if (score >= 5000) return "Legend";
  if (score >= 3000) return "Champion";
  if (score >= 2000) return "Elite";
  if (score >= 1500) return "Pro";
  if (score >= 1000) return "Advanced";
  if (score >= 500) return "Intermediate";
  return "Beginner";
};

/**
 * Get user's rank color based on their score
 */
export const getUserRankColor = (score: number): string => {
  if (score >= 5000) return "text-purple-600";
  if (score >= 3000) return "text-yellow-600";
  if (score >= 2000) return "text-blue-600";
  if (score >= 1500) return "text-green-600";
  if (score >= 1000) return "text-orange-600";
  if (score >= 500) return "text-gray-600";
  return "text-gray-400";
};

/**
 * Calculate user's accuracy percentage
 */
export const getUserAccuracy = (user: User): number => {
  if (user.gamesPlayed === 0) return 0;
  return Math.round((user.gamesWon / user.gamesPlayed) * 100);
};

/**
 * Get user's performance level description
 */
export const getUserPerformanceLevel = (user: User): string => {
  const accuracy = getUserAccuracy(user);
  
  if (accuracy >= 90) return "Exceptional";
  if (accuracy >= 80) return "Excellent";
  if (accuracy >= 70) return "Good";
  if (accuracy >= 60) return "Average";
  if (accuracy >= 50) return "Below Average";
  return "Needs Improvement";
};

/**
 * Format user stats for display
 */
export const formatUserStats = (user: User) => {
  return {
    totalScore: user.totalScore.toLocaleString(),
    gamesPlayed: user.gamesPlayed.toLocaleString(),
    gamesWon: user.gamesWon.toLocaleString(),
    accuracy: `${getUserAccuracy(user)}%`,
    currentStreak: user.currentStreak.toLocaleString(),
    rankBadge: getUserRankBadge(user.totalScore),
    rankColor: getUserRankColor(user.totalScore),
    performanceLevel: getUserPerformanceLevel(user),
  };
};
