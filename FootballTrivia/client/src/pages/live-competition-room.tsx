import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getCurrentUser } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import GameTimer from "@/components/game-timer";
import { Clock, Users, Trophy, Zap, Send, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export default function LiveCompetitionRoom() {
  const [match, params] = useRoute("/live-competition/:id");
  const competitionId = params?.id ? parseInt(params.id) : null;
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [participants, setParticipants] = useState<any[]>([]);
  const [recentAnswers, setRecentAnswers] = useState<any[]>([]);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'live' | 'finished'>('waiting');
  const [userScore, setUserScore] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: getCurrentUser,
  });

  const { data: competition } = useQuery({
    queryKey: ["/api/live-competitions", competitionId],
    enabled: !!competitionId,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["/api/questions"],
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, selectedAnswer, timeToAnswer }: any) => {
      return apiRequest("POST", `/api/live-competitions/${competitionId}/answer`, {
        userId: user?.id,
        questionId,
        selectedAnswer,
        timeToAnswer,
      });
    },
    onSuccess: () => {
      setSelectedAnswer("");
    },
    onError: () => {
      toast({ title: "Failed to submit answer", variant: "destructive" });
    },
  });

  // WebSocket connection
  useEffect(() => {
    if (!user || !competitionId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setIsConnected(true);
      setSocket(ws);
      socketRef.current = ws;
      
      // Join the competition room
      ws.send(JSON.stringify({
        type: 'join_competition',
        competitionId,
        userId: user.id
      }));
    };

    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'competition_state':
          setParticipants(message.participants || []);
          setGameStatus(message.competition?.status || 'waiting');
          if (message.competition?.questionIds) {
            const currentQ = questions.find((q: any) => 
              q.id === message.competition.questionIds[message.competition.currentQuestionIndex]
            );
            if (currentQ) {
              setCurrentQuestion(currentQ);
              setQuestionIndex(message.competition.currentQuestionIndex);
              setTimeLeft(currentQ.timeLimit || 30);
            }
          }
          break;
          
        case 'competition_started':
          setGameStatus('live');
          setTimeLeft(30);
          toast({ title: "Competition has started!" });
          break;
          
        case 'next_question':
          setCurrentQuestion(message.question);
          setQuestionIndex(message.questionIndex);
          setTimeLeft(message.question?.timeLimit || 30);
          setSelectedAnswer("");
          setRecentAnswers([]);
          break;
          
        case 'participant_joined':
          setParticipants(prev => [...prev, message.participant]);
          toast({ title: `${message.participant.user.displayName} joined the competition` });
          break;
          
        case 'participant_disconnected':
          setParticipants(prev => prev.filter(p => p.userId !== message.userId));
          break;
          
        case 'answer_submitted':
          setRecentAnswers(prev => [...prev.slice(-9), {
            userId: message.userId,
            questionId: message.questionId,
            timeToAnswer: message.timeToAnswer,
            timestamp: Date.now()
          }]);
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
      socketRef.current = null;
    };

    ws.onerror = () => {
      toast({ title: "Connection error", variant: "destructive" });
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user, competitionId, questions]);

  const handleAnswerSubmit = (answer: string) => {
    if (!currentQuestion || selectedAnswer || !user) return;
    
    setSelectedAnswer(answer);
    const timeToAnswer = (currentQuestion.timeLimit || 30) - timeLeft;
    
    submitAnswerMutation.mutate({
      questionId: currentQuestion.id,
      selectedAnswer: answer,
      timeToAnswer,
    });
  };

  const handleTimeUp = () => {
    if (!selectedAnswer && currentQuestion) {
      handleAnswerSubmit("");
    }
  };

  const getParticipantByUserId = (userId: number) => {
    return participants.find(p => p.userId === userId);
  };

  if (!competitionId || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Invalid competition or please log in</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading competition...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Competition Header */}
      <Card className="mb-6">
        <div className="bg-primary field-pattern p-6 text-primary-foreground">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <Zap className="w-6 h-6 mr-2" />
                {competition.title}
              </h1>
              <p className="opacity-90">{competition.description}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-4">
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
                <Badge variant={gameStatus === 'live' ? "destructive" : "secondary"}>
                  {gameStatus === 'live' ? "LIVE" : gameStatus.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Game Area */}
        <div className="lg:col-span-2">
          {gameStatus === 'waiting' ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-4">Waiting for Competition to Start</h3>
                <p className="text-muted-foreground mb-6">
                  {participants.length} players are ready. Competition will begin shortly.
                </p>
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              </CardContent>
            </Card>
          ) : currentQuestion ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Question {questionIndex + 1}</CardTitle>
                  <GameTimer
                    timeLeft={timeLeft}
                    onTimeUpdate={setTimeLeft}
                    onTimeUp={handleTimeUp}
                    isActive={!selectedAnswer}
                  />
                </div>
                <Progress 
                  value={((competition.questionIds?.length || 0) > 0) 
                    ? (questionIndex / (competition.questionIds.length - 1)) * 100 
                    : 0} 
                  className="h-2"
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">{currentQuestion.text}</h3>
                  
                  {currentQuestion.type === 'text-input' ? (
                    <div className="space-y-4">
                      <Input
                        placeholder="Type your answer here..."
                        value={selectedAnswer}
                        onChange={(e) => setSelectedAnswer(e.target.value)}
                        disabled={!!selectedAnswer}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && selectedAnswer.trim()) {
                            handleAnswerSubmit(selectedAnswer.trim());
                          }
                        }}
                      />
                      <Button 
                        onClick={() => handleAnswerSubmit(selectedAnswer.trim())}
                        disabled={!selectedAnswer.trim() || !!selectedAnswer}
                        className="w-full"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Submit Answer
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['A', 'B', 'C', 'D'].map((option) => {
                        const answerKey = `answer${option}` as keyof typeof currentQuestion;
                        const answerText = currentQuestion[answerKey];
                        if (!answerText) return null;
                        
                        return (
                          <Button
                            key={option}
                            variant={selectedAnswer === option ? "default" : "outline"}
                            className="p-4 h-auto text-left"
                            onClick={() => handleAnswerSubmit(option)}
                            disabled={!!selectedAnswer}
                          >
                            <div>
                              <div className="font-bold">{option}.</div>
                              <div>{answerText}</div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  {selectedAnswer && (
                    <div className="text-center">
                      <Badge variant="default">Answer Submitted!</Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        Waiting for other players to finish...
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-4">Competition Finished!</h3>
                <p className="text-muted-foreground">
                  Thanks for participating. Check the leaderboard for final results.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {participants
                  .sort((a, b) => b.score - a.score)
                  .map((participant, index) => (
                  <div 
                    key={participant.id} 
                    className={`flex items-center justify-between p-2 rounded ${
                      participant.userId === user?.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      {index === 0 && (
                        <Crown className="w-4 h-4 text-yellow-500 mr-2" />
                      )}
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-2">
                        <span className="text-primary-foreground text-xs font-bold">
                          {participant.user.displayName.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {participant.user.displayName}
                        {participant.userId === user?.id && ' (You)'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{participant.score}</Badge>
                      {participant.isConnected ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      ) : (
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Answers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recentAnswers.slice(-5).reverse().map((answer, index) => {
                  const participant = getParticipantByUserId(answer.userId);
                  return (
                    <div key={index} className="text-sm text-muted-foreground">
                      <span className="font-medium">
                        {participant?.user.displayName || 'Unknown'}
                      </span>{' '}
                      answered in {answer.timeToAnswer}s
                    </div>
                  );
                })}
                {recentAnswers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No answers yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}