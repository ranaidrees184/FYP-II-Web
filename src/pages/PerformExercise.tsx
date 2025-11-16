import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, Camera } from "lucide-react";

const API_BASE = "http://localhost:8000";

const PerformExercise = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const exercise = location.state?.exercise;
  const [isExercising, setIsExercising] = useState(false);
  const [reps, setReps] = useState(0);
  const [assignedReps, setAssignedReps] = useState(10);
  const [duration, setDuration] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  // Use ref to prevent stale closures
  const isExercisingRef = useRef(false);
  const pollingRef = useRef(null);

  // ---------- Auth check ----------
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/auth");
    };
    checkAuth();
    if (!exercise) navigate("/suggested-workouts");
  }, []);

  // ---------- Duration timer ----------
  useEffect(() => {
    let interval;
    if (isExercising && !isComplete) {
      interval = setInterval(() => setDuration((p) => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isExercising, isComplete]);

  // ---------- Poll backend status ----------
  useEffect(() => {
    const pollStatus = async () => {
      if (!isExercisingRef.current) return;
      
      try {
        const res = await fetch(`${API_BASE}/exercise_status`);
        const data = await res.json();
        
        console.log("Backend reps:", data.reps); // Debug log
        
        // Update reps from backend
        setReps(data.reps);
        
        // Only mark complete if assigned reps are met
        if (data.reps >= assignedReps && !isComplete) {
          setIsComplete(true);
          handleExerciseComplete(data.reps);
        }
      } catch (error) {
        console.error("Error polling exercise status:", error);
      }
    };

    if (isExercising) {
      // Start polling
      pollingRef.current = setInterval(pollStatus, 1500);
    } else {
      // Stop polling
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isExercising, assignedReps, isComplete]);

  // Update ref when state changes
  useEffect(() => {
    isExercisingRef.current = isExercising;
  }, [isExercising]);

  const startExercise = async () => {
    try {
      // FIRST: Stop any existing polling
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      
      // SECOND: Reset ALL local state immediately
      setIsExercising(false);
      setReps(0);
      setDuration(0);
      setIsComplete(false);
      isExercisingRef.current = false;
      
      console.log("State reset complete"); // Debug log
      
      // THIRD: Test backend connection first
      try {
        const healthCheck = await fetch(`${API_BASE}/`, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (!healthCheck.ok) {
          throw new Error("Backend is not responding");
        }
        console.log("Backend connection OK");
      } catch (healthError) {
        throw new Error(`Cannot connect to backend at ${API_BASE}. Make sure it's running.`);
      }
      
      // FOURTH: Reset backend and wait for confirmation
      const resetResponse = await fetch(`${API_BASE}/reset`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (!resetResponse.ok) {
        throw new Error(`Reset failed: ${resetResponse.status}`);
      }
      
      console.log("Backend reset status:", resetResponse.status); // Debug log
      
      // FIFTH: Verify backend is reset
      const statusResponse = await fetch(`${API_BASE}/exercise_status`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!statusResponse.ok) {
        throw new Error("Cannot get exercise status");
      }
      
      const statusData = await statusResponse.json();
      console.log("Backend status after reset:", statusData); // Debug log
      
      // Force reps to match backend (should be 0)
      setReps(statusData.reps || 0);
      
      // SIXTH: Wait a moment for everything to settle
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // FINALLY: Start exercising
      setIsExercising(true);
      isExercisingRef.current = true;
      
      toast({
        title: "Exercise started",
        description: "AI tracking activated with real-time feedback.",
      });
    } catch (error) {
      console.error("Start exercise error:", error);
      
      // Reset state on error
      setIsExercising(false);
      isExercisingRef.current = false;
      
      toast({
        title: "Error starting exercise",
        description: error.message || "Could not connect to tracking system.",
        variant: "destructive",
      });
    }
  };

  const stopExercise = async () => {
    setIsExercising(false);
    isExercisingRef.current = false;
    
    // Stop polling immediately
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    
    // Check if assigned reps were completed
    if (reps >= assignedReps) {
      handleExerciseComplete(reps);
    } else {
      toast({
        title: "Exercise stopped",
        description: `You completed ${reps}/${assignedReps} reps. Keep going to save progress!`,
        variant: "default",
      });
    }
  };

  const handleExerciseComplete = async (finalReps) => {
    // Only save if assigned reps are met
    if (finalReps < assignedReps) {
      return;
    }
    
    setIsExercising(false);
    isExercisingRef.current = false;
    setIsComplete(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && exercise) {
        const { error } = await supabase.from("exercise_history").insert({
          user_id: user.id,
          exercise_type: exercise.name,
          reps: finalReps,
          duration,
          calories_burned: Math.round((duration / 60) * exercise.calories_burned),
        });
        
        if (error) throw error;
        
        toast({
          title: "Exercise completed! 🎉",
          description: `✅ ${finalReps}/${assignedReps} reps in ${duration}s`,
        });
        
        // Navigate after a short delay to show success message
        setTimeout(() => {
          navigate("/exercise-history");
        }, 2000);
      }
    } catch (err) {
      toast({
        title: "Error saving exercise",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (!exercise) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Perform Exercise</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Section */}
          <Card>
            <CardHeader>
              <CardTitle>{exercise.name}</CardTitle>
              <CardDescription>{exercise.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{reps}</p>
                    <p className="text-sm text-muted-foreground">Performed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{assignedReps}</p>
                    <p className="text-sm text-muted-foreground">Assigned</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary">{duration}s</p>
                    <p className="text-sm text-muted-foreground">Duration</p>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((reps / assignedReps) * 100, 100)}%` }}
                  />
                </div>

                {!isExercising ? (
                  <Button onClick={startExercise} className="w-full" size="lg">
                    <Play className="mr-2 h-5 w-5" /> Start Exercise
                  </Button>
                ) : (
                  <Button onClick={stopExercise} variant="destructive" className="w-full" size="lg">
                    <Square className="mr-2 h-5 w-5" /> Stop Exercise
                  </Button>
                )}

                {isComplete && reps >= assignedReps && (
                  <div className="mt-4 p-3 rounded-lg bg-green-100 text-green-800 text-center font-medium">
                    🎉 Exercise Completed! Saving to history...
                  </div>
                )}
                
                {isExercising && reps > 0 && reps < assignedReps && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-100 text-blue-800 text-center">
                    Keep going! {assignedReps - reps} reps remaining
                  </div>
                )}
                
                {/* Debug info - remove in production */}
                <div className="text-xs text-muted-foreground text-center">
                  Debug: Reps={reps}, Exercising={isExercising.toString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Section */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" /> Webcam Monitor
              </CardTitle>
              <CardDescription>AI pose estimation tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center relative bg-black">
                {/* Stream from backend */}
                {isExercising ? (
                  <img
                    src={`${API_BASE}/video_feed`}
                    alt="Pose Stream"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                    <p>Start exercise to activate camera</p>
                  </div>
                )}
                
                {/* Stream info */}
                {isExercising && (
                  <div className="absolute bottom-2 left-2 right-2 text-xs text-white bg-black/70 p-2 rounded">
                    Live Feed Active
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PerformExercise;