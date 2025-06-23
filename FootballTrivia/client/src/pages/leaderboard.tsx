import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getCurrentUser } from "@/lib/auth";
import { Crown, Trophy, Medal } from "lucide-react";
import { useState } from "react";

export default function Leaderboard() {
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');

  const { data: user } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: getCurrentUser,
  });

  const { data: globalLeaderboard = [] } = useQuery({
    queryKey: ["/api/leaderboard"],
  });

  const { data: friendGroups = [] } = useQuery({
    queryKey: ["/api/friend-groups", { userId: user?.id }],
    enabled: !!user,
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-400" />;
      default:
        return null;
    }
  };

  const getRankBadge = (rank: number, score: number) => {
    if (score >= 2500) return "Champion";
    if (score >= 2000) return "Elite";
    if (score >= 1500) return "Pro";
    if (score >= 1000) return "Advanced";
    return "Beginner";
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
        <div className="flex space-x-2">
          <Button 
            variant={timeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setTimeFilter('all')}
          >
            All Time
          </Button>
          <Button 
            variant={timeFilter === 'week' ? 'default' : 'outline'}
            onClick={() => setTimeFilter('week')}
          >
            This Week
          </Button>
          <Button 
            variant={timeFilter === 'month' ? 'default' : 'outline'}
            onClick={() => setTimeFilter('month')}
          >
            This Month
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Leaderboard */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Global Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {globalLeaderboard.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No players yet. Be the first to play!</p>
                  </div>
                ) : (
                  globalLeaderboard.map((player: any, index: number) => {
                    const rank = index + 1;
                    const isCurrentUser = player.id === user?.id;
                    
                    if (rank <= 3) {
                      // Top 3 with special styling
                      return (
                        <div 
                          key={player.id}
                          className={`flex items-center space-x-4 p-4 rounded-lg ${
                            rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' :
                            rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                            'bg-gradient-to-r from-orange-300 to-orange-400'
                          } ${isCurrentUser ? 'ring-2 ring-primary' : ''}`}
                        >
                          <div className="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-full font-bold">
                            {getRankIcon(rank) || rank}
                          </div>
                          <Avatar>
                            <AvatarFallback>{getInitials(player.displayName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold">
                                {isCurrentUser ? `You (${player.displayName})` : player.displayName}
                              </span>
                              <Badge variant="secondary" className="bg-white bg-opacity-20">
                                {getRankBadge(rank, player.totalScore)}
                              </Badge>
                            </div>
                            <p className="text-sm opacity-75">
                              {player.gamesWon} games won • {player.gamesPlayed > 0 ? Math.round((player.gamesWon / player.gamesPlayed) * 100) : 0}% accuracy
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">{player.totalScore.toLocaleString()}</div>
                            <div className="text-sm opacity-75">points</div>
                          </div>
                        </div>
                      );
                    }

                    // Regular rankings
                    return (
                      <div 
                        key={player.id}
                        className={`flex items-center space-x-4 p-3 hover:bg-muted rounded-lg transition-colors ${
                          isCurrentUser ? 'bg-primary/10 border border-primary' : ''
                        }`}
                      >
                        <div className="flex items-center justify-center w-8 h-8 text-muted-foreground font-semibold">
                          {rank}
                        </div>
                        <Avatar>
                          <AvatarFallback>{getInitials(player.displayName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <span className="font-medium text-foreground">
                            {isCurrentUser ? `You (${player.displayName})` : player.displayName}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-foreground">{player.totalScore.toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Friend Groups Leaderboard */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>My Friends</CardTitle>
            </CardHeader>
            <CardContent>
              {friendGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No friend groups yet</p>
                  <Button variant="outline" size="sm">
                    Create Group
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {friendGroups.map((group: any) => (
                    <Card key={group.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm text-muted-foreground">
                            {group.memberCount} members
                          </span>
                          <Badge variant="outline">{group.activeStreak} day streak</Badge>
                        </div>
                        
                        {/* Top 3 in group preview */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              1
                            </div>
                            <span className="font-medium">Group Leader</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              2
                            </div>
                            <span>Second Place</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <div className="w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              3
                            </div>
                            <span>Third Place</span>
                          </div>
                        </div>

                        <Button variant="outline" size="sm" className="w-full mt-4">
                          View Full Leaderboard
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
