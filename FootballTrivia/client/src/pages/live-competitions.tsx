import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Clock, Users, Trophy, Zap, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function LiveCompetitions() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: getCurrentUser,
  });

  const { data: upcomingCompetitions = [] } = useQuery({
    queryKey: ["/api/live-competitions/upcoming"],
  });

  const { data: liveCompetitions = [] } = useQuery({
    queryKey: ["/api/live-competitions/live"],
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["/api/questions"],
  });

  const createCompetitionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/live-competitions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-competitions/upcoming"] });
      setShowCreateForm(false);
      toast({ title: "Competition created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create competition", variant: "destructive" });
    },
  });

  const joinCompetitionMutation = useMutation({
    mutationFn: async (competitionId: number) => {
      return apiRequest("POST", `/api/live-competitions/${competitionId}/join`, { userId: user?.id });
    },
    onSuccess: () => {
      toast({ title: "Joined competition successfully!" });
      // Navigate to competition room
    },
    onError: () => {
      toast({ title: "Failed to join competition", variant: "destructive" });
    },
  });

  const handleCreateCompetition = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const scheduledStart = new Date(formData.get("scheduledStart") as string);
    const duration = parseInt(formData.get("duration") as string) * 60; // Convert minutes to seconds
    const maxParticipants = parseInt(formData.get("maxParticipants") as string);
    
    // Select random questions for the competition
    const selectedQuestions = questions
      .filter((q: any) => q.isActive)
      .sort(() => Math.random() - 0.5)
      .slice(0, 10)
      .map((q: any) => q.id);

    createCompetitionMutation.mutate({
      title: formData.get("title"),
      description: formData.get("description"),
      scheduledStart: scheduledStart.toISOString(),
      duration,
      maxParticipants,
      questionIds: selectedQuestions,
      createdBy: user?.id,
    });
  };

  const getTimeUntilStart = (scheduledStart: string) => {
    const now = new Date();
    const start = new Date(scheduledStart);
    const diff = start.getTime() - now.getTime();
    
    if (diff <= 0) return "Starting now";
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Please log in to access live competitions</h2>
            <Link href="/auth">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Zap className="w-8 h-8 text-primary mr-3" />
            Live Competitions
          </h1>
          <p className="text-muted-foreground mt-2">
            Compete with other players in real-time trivia challenges
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Competition
        </Button>
      </div>

      {/* Create Competition Form */}
      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Competition</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCompetition} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Competition Title</Label>
                  <Input id="title" name="title" required placeholder="Friday Night Football Quiz" />
                </div>
                <div>
                  <Label htmlFor="maxParticipants">Max Participants</Label>
                  <Input 
                    id="maxParticipants" 
                    name="maxParticipants" 
                    type="number" 
                    defaultValue="50" 
                    min="2" 
                    max="100" 
                    required 
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="Test your football knowledge in this exciting live competition!"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduledStart">Scheduled Start Time</Label>
                  <Input 
                    id="scheduledStart" 
                    name="scheduledStart" 
                    type="datetime-local" 
                    required
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input 
                    id="duration" 
                    name="duration" 
                    type="number" 
                    defaultValue="30" 
                    min="10" 
                    max="120" 
                    required 
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCompetitionMutation.isPending}
                >
                  {createCompetitionMutation.isPending ? "Creating..." : "Create Competition"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Live Competitions */}
      {liveCompetitions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
            Live Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveCompetitions.map((competition: any) => (
              <Card key={competition.id} className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{competition.title}</CardTitle>
                    <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                  </div>
                  {competition.description && (
                    <p className="text-sm text-muted-foreground">{competition.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      {competition.currentParticipants}/{competition.maxParticipants} players
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      {Math.floor(competition.duration / 60)} minutes
                    </div>
                    <Link href={`/live-competition/${competition.id}`}>
                      <Button className="w-full bg-red-600 hover:bg-red-700">
                        Join Live Competition
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Competitions */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <Calendar className="w-6 h-6 text-primary mr-3" />
          Upcoming Competitions
        </h2>
        
        {upcomingCompetitions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Upcoming Competitions</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to create an exciting live competition for everyone to enjoy!
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                Create Competition
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingCompetitions.map((competition: any) => (
              <Card key={competition.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{competition.title}</CardTitle>
                    <Badge variant="secondary">
                      {getTimeUntilStart(competition.scheduledStart)}
                    </Badge>
                  </div>
                  {competition.description && (
                    <p className="text-sm text-muted-foreground">{competition.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(new Date(competition.scheduledStart), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      {competition.currentParticipants}/{competition.maxParticipants} signed up
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      {Math.floor(competition.duration / 60)} minutes
                    </div>
                    <Button 
                      onClick={() => joinCompetitionMutation.mutate(competition.id)}
                      disabled={joinCompetitionMutation.isPending || competition.currentParticipants >= competition.maxParticipants}
                      className="w-full"
                    >
                      {competition.currentParticipants >= competition.maxParticipants 
                        ? "Competition Full" 
                        : joinCompetitionMutation.isPending 
                          ? "Joining..." 
                          : "Join Competition"
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}