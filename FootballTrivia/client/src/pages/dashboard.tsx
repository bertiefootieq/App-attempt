import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { Gamepad, Trophy, Flame, Users, Clock, Calendar, Play, Bell, BellOff } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, navigate] = useLocation();

  const { data: user } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: getCurrentUser,
  });

  const { data: activeGames = [] } = useQuery({
    queryKey: ["/api/games", { activeOnly: true }],
  });

  const { data: scheduledQuestions = [] } = useQuery({
    queryKey: ["/api/questions/scheduled", new Date().toISOString().split('T')[0]],
  });

  const stats = user ? [
    {
      title: "Games Played",
      value: user.gamesPlayed,
      icon: Gamepad,
      color: "bg-blue-500",
    },
    {
      title: "Win Rate",
      value: user.gamesPlayed > 0 ? `${Math.round((user.gamesWon / user.gamesPlayed) * 100)}%` : "0%",
      icon: Trophy,
      color: "bg-yellow-500",
    },
    {
      title: "Current Streak",
      value: user.currentStreak,
      icon: Flame,
      color: "bg-red-500",
    },
    {
      title: "Total Score",
      value: user.totalScore.toLocaleString(),
      icon: Users,
      color: "bg-green-500",
    },
  ] : [];

  const handleStartQuickGame = () => {
    navigate("/game");
  };

  const handleJoinGame = (gameId: number) => {
    navigate(`/game/${gameId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <Button 
          onClick={handleStartQuickGame}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Play className="w-4 h-4 mr-2" />
          Quick Game
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} bg-opacity-10 rounded-full p-3`}>
                    <IconComponent className={`${stat.color.replace('bg-', 'text-')} text-xl`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Games & Scheduled Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Games */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 text-primary mr-2" />
              Active Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeGames.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gamepad className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active games at the moment</p>
                  <Button 
                    onClick={handleStartQuickGame}
                    variant="outline" 
                    className="mt-4"
                  >
                    Start a Game
                  </Button>
                </div>
              ) : (
                activeGames.map((game: any) => (
                  <div 
                    key={game.id} 
                    className="border border-primary bg-primary/5 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-foreground">{game.title}</h4>
                      <Badge variant={game.status === 'active' ? 'default' : 'secondary'}>
                        {game.status === 'active' ? 'Live' : 'Waiting'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">{game.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>
                          <Users className="w-4 h-4 inline mr-1" />
                          {game.currentPlayers}/{game.maxPlayers} players
                        </span>
                      </div>
                      <Button 
                        onClick={() => handleJoinGame(game.id)}
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        Join Game
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 text-primary mr-2" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduledQuestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No scheduled questions for today</p>
                </div>
              ) : (
                scheduledQuestions.map((question: any) => (
                  <div 
                    key={question.id} 
                    className="flex items-center justify-between p-4 bg-muted rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-bold">
                        {question.scheduledAt ? new Date(question.scheduledAt).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          hour12: true 
                        }) : '??'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{question.category}</h4>
                        <p className="text-muted-foreground text-sm">{question.text}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Bell className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
