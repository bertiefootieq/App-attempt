import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getCurrentUser } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import GameTimer from "@/components/game-timer";
import { Clock, Users, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Game() {
  const [match, params] = useRoute("/game/:id?");
  const gameId = params?.id ? parseInt(params.id) : null;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [textAnswer, setTextAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'waiting' | 'active' | 'finished'>('waiting');
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: getCurrentUser,
  });

  const { data: game } = useQuery({
    queryKey: ["/api/games", gameId],
    enabled: !!gameId,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["/api/questions"],
    queryFn: async () => {
      const response = await fetch("/api/questions");
      return response.json();
    },
  });

  const { data: participants = [] } = useQuery({
    queryKey: ["/api/games", gameId, "participants"],
    enabled: !!gameId,
  });

  const joinGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      return apiRequest("POST", `/api/games/${gameId}/join`, { userId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId, "participants"] });
      toast({ title: "Joined game successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to join game", variant: "destructive" });
    },
  });

  const answerMutation = useMutation({
    mutationFn: async ({ questionId, selectedAnswer, timeToAnswer }: any) => {
      return apiRequest("POST", `/api/games/${gameId}/answer`, {
        userId: user?.id,
        questionId,
        selectedAnswer,
        timeToAnswer,
      });
    },
    onSuccess: () => {
      toast({ title: "Answer submitted!" });
      setSelectedAnswer(null);
      // Move to next question after a delay
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setTimeLeft(30);
      }, 2000);
    },
  });

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (gameId && user && !participants.some((p: any) => p.userId === user.id)) {
      joinGameMutation.mutate(gameId);
    }
  }, [gameId, user, participants]);

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return;
    
    setSelectedAnswer(answer);
    const timeToAnswer = 30 - timeLeft;
    
    if (currentQuestion) {
      answerMutation.mutate({
        questionId: currentQuestion.id,
        selectedAnswer: answer,
        timeToAnswer,
      });
    }
  };

  const handleTimeUp = () => {
    if (!selectedAnswer && currentQuestion) {
      // Auto-submit empty answer when time runs out
      answerMutation.mutate({
        questionId: currentQuestion.id,
        selectedAnswer: "",
        timeToAnswer: 30,
      });
    }
  };

  // Quick game mode - use random questions
  if (!gameId) {
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5).slice(0, 10);
    
    if (!currentQuestion) {
      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-4">Quick Game Complete!</h2>
              <p className="text-muted-foreground mb-6">
                You've answered all {shuffledQuestions.length} questions.
              </p>
              <Button onClick={() => window.location.reload()}>
                Play Again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="overflow-hidden">
          {/* Game Header */}
          <div className="bg-primary field-pattern p-6 text-primary-foreground">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Quick Game</h2>
                <p className="opacity-90">Question {currentQuestionIndex + 1} of {shuffledQuestions.length}</p>
              </div>
              <div className="text-right">
                <GameTimer
                  timeLeft={timeLeft}
                  onTimeUpdate={setTimeLeft}
                  onTimeUp={handleTimeUp}
                  isActive={!selectedAnswer}
                />
                <p className="opacity-90">Time Left</p>
              </div>
            </div>
            <div className="mt-4">
              <Progress 
                value={(currentQuestionIndex / shuffledQuestions.length) * 100} 
                className="h-2 bg-primary-foreground/20"
              />
            </div>
          </div>

          {/* Question Content */}
          <CardContent className="p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                {currentQuestion.text}
              </h3>
              <div className="text-muted-foreground mb-6 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Type your answer before time runs out
              </div>
            </div>

            {/* Text Answer Input */}
            <div className="mb-8">
              <div className="flex flex-col space-y-4">
                <input
                  type="text"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-4 text-lg border-2 border-muted-foreground/20 rounded-lg bg-background focus:border-primary focus:outline-none transition-colors"
                  disabled={gameState === 'finished'}
                />
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    <p>💡 Tip: Be specific with your answer. Alternative spellings may be accepted.</p>
                  </div>
                  <Button 
                    onClick={() => handleAnswerSubmit(textAnswer)}
                    disabled={!textAnswer.trim() || gameState === 'finished'}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Submit Answer
                  </Button>
                </div>
              </div>
            </div>

            {selectedAnswer && (
              <div className="text-center">
                <Badge variant={selectedAnswer === currentQuestion.correctAnswer ? 'default' : 'destructive'}>
                  {selectedAnswer === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
                </Badge>
                {selectedAnswer !== currentQuestion.correctAnswer && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Correct answer: {currentQuestion.correctAnswer} - {
                      currentQuestion[`answer${currentQuestion.correctAnswer}` as keyof typeof currentQuestion]
                    }
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Multiplayer game mode
  if (!game) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading game...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="overflow-hidden">
        {/* Game Header */}
        <div className="bg-primary field-pattern p-6 text-primary-foreground">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{game.title}</h2>
              <p className="opacity-90">{game.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {game.currentPlayers}/{game.maxPlayers}
              </div>
              <p className="opacity-90">Players</p>
            </div>
          </div>
        </div>

        {/* Game Content */}
        <CardContent className="p-8">
          {game.status === 'waiting' ? (
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-bold mb-4">Waiting for Players</h3>
              <p className="text-muted-foreground mb-6">
                {game.currentPlayers} of {game.maxPlayers} players have joined
              </p>
              
              {/* Live Players */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4">Players in Lobby</h4>
                <div className="flex flex-wrap gap-3 justify-center">
                  {participants.map((participant: any) => (
                    <div key={participant.id} className="flex items-center space-x-2 bg-muted rounded-full px-3 py-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-bold">
                          {participant.user.displayName.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{participant.user.displayName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground">Game in progress...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
