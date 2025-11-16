import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Clock, Flame, TrendingUp } from "lucide-react";

const SuggestedWorkouts = () => {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchWorkouts();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchWorkouts = async () => {
    setLoading(true);
    try {
      // Default workout suggestions
      const defaultWorkouts = [
        {
          id: "1",
          name: "Push Ups",
          type: "strength",
          description: "Upper body strength exercise",
          difficulty: "beginner",
          duration: 10,
          calories_burned: 50,
        },
        {
          id: "2",
          name: "Pull Ups",
          type: "strength",
          description: "Back and arm strength exercise",
          difficulty: "intermediate",
          duration: 10,
          calories_burned: 60,
        },
        {
          id: "3",
          name: "Planks",
          type: "core",
          description: "Core stability exercise",
          difficulty: "beginner",
          duration: 5,
          calories_burned: 30,
        },
      ];
      setWorkouts(defaultWorkouts);
    } catch (error: any) {
      toast({
        title: "Error fetching workouts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIWorkout = async () => {
    setLoading(true);
    toast({
      title: "Generating workout...",
      description: "AI is creating a personalized workout plan for you",
    });
    
    // TODO: Replace with actual AI API call
    setTimeout(() => {
      toast({
        title: "Workout generated!",
        description: "Your personalized workout plan is ready",
      });
      setLoading(false);
    }, 2000);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "text-green-500";
      case "intermediate": return "text-yellow-500";
      case "advanced": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Suggested Workouts</h1>
            <p className="text-muted-foreground">AI-powered exercise recommendations</p>
          </div>
          <Button onClick={generateAIWorkout} disabled={loading} size="lg">
            {loading ? "Generating..." : "Generate AI Workout"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workouts.map((workout) => (
            <Card key={workout.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Dumbbell className="h-6 w-6 text-primary" />
                  </div>
                  <span className={`text-xs font-semibold uppercase ${getDifficultyColor(workout.difficulty)}`}>
                    {workout.difficulty}
                  </span>
                </div>
                <CardTitle className="mt-4">{workout.name}</CardTitle>
                <CardDescription>{workout.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{workout.duration} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-secondary" />
                    <span>{workout.calories_burned} cal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="capitalize">{workout.type}</span>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => navigate("/perform-exercise", { state: { exercise: workout } })}
                >
                  Start Exercise
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestedWorkouts;
