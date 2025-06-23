import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertQuestionSuggestionSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentUser } from "@/lib/auth";
import { Lightbulb, Send } from "lucide-react";

const formSchema = insertQuestionSuggestionSchema.extend({
  type: insertQuestionSuggestionSchema.shape.type.default("text-input"),
});

type FormData = typeof formSchema._type;

export default function SuggestQuestion() {
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user
  useState(() => {
    getCurrentUser().then(setUser);
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      correctAnswer: "",
      answerA: "",
      answerB: "",
      answerC: "",
      answerD: "",
      acceptableAnswers: [],
      difficulty: "medium",
      category: "General",
      type: "text-input",
      explanation: "",
      submittedBy: user?.id || 1,
    },
  });

  const submitSuggestion = useMutation({
    mutationFn: (data: FormData) => apiRequest("/api/question-suggestions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({
        title: "Question Submitted!",
        description: "Your question suggestion has been submitted for review.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/question-suggestions"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit question suggestion.",
        variant: "destructive",
      });
    },
  });

  const questionType = form.watch("type");

  const onSubmit = (data: FormData) => {
    const submissionData = {
      ...data,
      submittedBy: user?.id || 1,
      acceptableAnswers: data.type === "text-input" 
        ? data.acceptableAnswers?.length ? data.acceptableAnswers : [data.correctAnswer]
        : undefined,
    };
    submitSuggestion.mutate(submissionData);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to suggest questions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">Suggest a Question</h1>
        </div>
        <p className="text-muted-foreground">
          Help grow our question database by suggesting new football trivia questions. 
          Our admin team will review your submission.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
          <CardDescription>
            Provide all the details for your football trivia question
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your football trivia question..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Premier League, World Cup" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Question Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="text-input" id="text-input" />
                          <Label htmlFor="text-input">Text Input (Open answer)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="multiple-choice" id="multiple-choice" />
                          <Label htmlFor="multiple-choice">Multiple Choice (A, B, C, D)</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {questionType === "multiple-choice" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="answerA"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Answer A</FormLabel>
                          <FormControl>
                            <Input placeholder="Option A" {...field} />
                          </FormControl>
                          <FormMessage />
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
                            <Input placeholder="Option B" {...field} />
                          </FormControl>
                          <FormMessage />
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
                            <Input placeholder="Option C" {...field} />
                          </FormControl>
                          <FormMessage />
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
                            <Input placeholder="Option D" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="correctAnswer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correct Answer</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select the correct answer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={form.watch("answerA") || "A"}>{form.watch("answerA") || "Answer A"}</SelectItem>
                            <SelectItem value={form.watch("answerB") || "B"}>{form.watch("answerB") || "Answer B"}</SelectItem>
                            <SelectItem value={form.watch("answerC") || "C"}>{form.watch("answerC") || "Answer C"}</SelectItem>
                            <SelectItem value={form.watch("answerD") || "D"}>{form.watch("answerD") || "Answer D"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="correctAnswer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correct Answer</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the correct answer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="explanation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explanation (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide an explanation or additional context for the answer..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitSuggestion.isPending}
              >
                {submitSuggestion.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Question
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}