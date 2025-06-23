import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Game from "@/pages/game";
import Leaderboard from "@/pages/leaderboard";
import Friends from "@/pages/friends";
import Admin from "@/pages/admin";
import Auth from "@/pages/auth";
import LiveCompetitions from "@/pages/live-competitions";
import LiveCompetitionRoom from "@/pages/live-competition-room";
import SuggestQuestion from "@/pages/suggest-question";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@shared/schema";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/game/:id?" component={Game} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/friends" component={Friends} />
      <Route path="/live-competitions" component={LiveCompetitions} />
      <Route path="/live-competition/:id" component={LiveCompetitionRoom} />
      <Route path="/suggest-question" component={SuggestQuestion} />
      <Route path="/admin" component={Admin} />
      <Route path="/auth" component={Auth} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to get current user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Soccer Trivia...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Auth onAuthSuccess={setCurrentUser} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <Header user={currentUser} onLogout={() => setCurrentUser(null)} />
          <main className="flex-1">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
