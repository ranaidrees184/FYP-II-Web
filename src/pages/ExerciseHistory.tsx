import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Activity, Clock, Flame } from "lucide-react";

const ExerciseHistory = () => {
  const [history, setHistory] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchHistory();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("exercise_history")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });
      
      if (data) {
        setHistory(data);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Exercise History</h1>
        
        {history.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground">No exercise history yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start your first workout to see your progress here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <Card key={item.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{item.exercise_type}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(item.completed_at), "MMM dd, yyyy 'at' HH:mm")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="text-2xl font-bold text-primary">{item.reps || 0}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Reps</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-2xl font-bold text-primary">{item.duration || 0}s</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Flame className="h-4 w-4 text-secondary" />
                        <span className="text-2xl font-bold text-secondary">{item.calories_burned || 0}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Calories</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseHistory;
