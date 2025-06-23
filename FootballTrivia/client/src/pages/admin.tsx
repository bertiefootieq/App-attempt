import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, BookOpen, Clock, CheckCircle, AlertCircle, FileText, Calendar, ThumbsUp, ThumbsDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuestionSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const createQuestionSchema = insertQuestionSchema.extend({
  text: z.string().min(1, "Question text is required"),
  answerA: z.string().min(1, "Answer A is required"),
  answerB: z.string().min(1, "Answer B is required"),
  answerC: z.string().min(1, "Answer C is required"),
  answerD: z.string().min(1, "Answer D is required"),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  difficulty: z.enum(["easy", "medium", "hard", "expert"]),
  category: z.string().min(1, "Category is required"),
  timeLimit: z.number().min(5).max(300),
  type: z.string().default("multiple-choice"),
});

type CreateQuestionForm = z.infer<typeof createQuestionSchema>;

export default function Admin() {
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: getCurrentUser,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["/api/questions"],
  });

  const { data: questionSuggestions = [] } = useQuery({
    queryKey: ["/api/question-suggestions"],
  });

  const form = useForm<CreateQuestionForm>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: {
      text: "",
      answerA: "",
      answerB: "",
      answerC: "",
      answerD: "",
      correctAnswer: "A",
      difficulty: "medium",
      category: "",
      timeLimit: 30,
      type: "multiple-choice",
      isActive: true,
      createdBy: user?.id,
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: CreateQuestionForm) => {
      return apiRequest("POST", "/api/questions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      form.reset();
      toast({ title: "Question created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create question", variant: "destructive" });
    },
  });

  const approveSuggestion = useMutation({
    mutationFn: ({ id, reviewNotes }: { id: number; reviewNotes?: string }) => 
      apiRequest("POST", `/api/question-suggestions/${id}/approve`, {
        reviewedBy: user?.id,
        reviewNotes,
      }),
    onSuccess: () => {
      toast({ title: "Question suggestion approved and added to database!" });
      queryClient.invalidateQueries({ queryKey: ["/api/question-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
  });

  const rejectSuggestion = useMutation({
    mutationFn: ({ id, reviewNotes }: { id: number; reviewNotes: string }) => 
      apiRequest("POST", `/api/question-suggestions/${id}/reject`, {
        reviewedBy: user?.id,
        reviewNotes,
      }),
    onSuccess: () => {
      toast({ title: "Question suggestion rejected." });
      queryClient.invalidateQueries({ queryKey: ["/api/question-suggestions"] });
    },
  });

  const scheduleQuestion = useMutation({
    mutationFn: ({ id, scheduledAt }: { id: number; scheduledAt: string }) => 
      apiRequest("POST", `/api/questions/${id}/schedule`, { scheduledAt }),
    onSuccess: () => {
      toast({ title: "Question scheduled successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
  });

  const onSubmit = (data: CreateQuestionForm) => {
    createQuestionMutation.mutate({ ...data, createdBy: user?.id });
  };

  const getStatusBadge = (question: any) => {
    if (question.scheduledAt && new Date(question.scheduledAt) > new Date()) {
      return <Badge variant="secondary">Scheduled</Badge>;
    }
    if (question.isActive) {
      return <Badge variant="default">Live</Badge>;
    }
    return <Badge variant="outline">Draft</Badge>;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-orange-600';
      case 'expert': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const stats = {
    totalQuestions: questions.length,
    published: questions.filter((q: any) => q.isActive).length,
    scheduled: questions.filter((q: any) => q.scheduledAt && new Date(q.scheduledAt) > new Date()).length,
    drafts: questions.filter((q: any) => !q.isActive).length,
  };

  const recentQuestions = questions.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Question Management</h1>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Question Creation Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Create New Question</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select question type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                            <SelectItem value="elimination">Elimination Round</SelectItem>
                            <SelectItem value="timed">Timed Challenge</SelectItem>
                            <SelectItem value="progressive">Progressive Difficulty</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Text</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your question here..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="answerA"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Answer A</FormLabel>
                          <FormControl>
                            <Input placeholder="First answer option" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="answerB"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Answer B</FormLabel>
                          <FormControl>
                            <Input placeholder="Second answer option" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="answerC"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Answer C</FormLabel>
                          <FormControl>
                            <Input placeholder="Third answer option" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="answerD"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Answer D</FormLabel>
                          <FormControl>
                            <Input placeholder="Fourth answer option" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="correctAnswer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correct Answer</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="A">Answer A</SelectItem>
                              <SelectItem value="B">Answer B</SelectItem>
                              <SelectItem value="C">Answer C</SelectItem>
                              <SelectItem value="D">Answer D</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="timeLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Limit (seconds)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="30"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Premier League, World Cup, History" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-4">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={createQuestionMutation.isPending}
                    >
                      Create Question
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => form.reset()}
                    >
                      Clear Form
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Question Bank & Analytics */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question Bank Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Questions</span>
                  <span className="font-bold text-foreground">{stats.totalQuestions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Published</span>
                  <span className="font-bold text-green-600">{stats.published}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Scheduled</span>
                  <span className="font-bold text-orange-500">{stats.scheduled}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Drafts</span>
                  <span className="font-bold text-muted-foreground">{stats.drafts}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentQuestions.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No questions yet</p>
                  </div>
                ) : (
                  recentQuestions.map((question: any) => (
                    <div 
                      key={question.id}
                      className="p-3 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-foreground text-sm line-clamp-2">
                          {question.text}
                        </h4>
                        {getStatusBadge(question)}
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{question.category}</span>
                        <span className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {questions.length > 5 && (
                <Button variant="ghost" className="w-full mt-4 text-primary">
                  View All Questions →
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
