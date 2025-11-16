import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import BmiCalculator from "./pages/BmiCalculator";
import SuggestedWorkouts from "./pages/SuggestedWorkouts";
import PerformExercise from "./pages/PerformExercise";
import ExerciseHistory from "./pages/ExerciseHistory";
import AIChatbot from "./pages/AIChatbot";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={session ? <Navigate to="/dashboard" /> : <Navigate to="/auth" />} />
            <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/auth" />} />
            <Route path="/profile" element={session ? <Profile /> : <Navigate to="/auth" />} />
            <Route path="/bmi-calculator" element={session ? <BmiCalculator /> : <Navigate to="/auth" />} />
            <Route path="/suggested-workouts" element={session ? <SuggestedWorkouts /> : <Navigate to="/auth" />} />
            <Route path="/perform-exercise" element={session ? <PerformExercise /> : <Navigate to="/auth" />} />
            <Route path="/exercise-history" element={session ? <ExerciseHistory /> : <Navigate to="/auth" />} />
            <Route path="/ai-chatbot" element={session ? <AIChatbot /> : <Navigate to="/auth" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
