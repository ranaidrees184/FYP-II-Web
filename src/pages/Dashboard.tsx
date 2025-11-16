import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, Flame, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalCalories: 0,
    totalDuration: 0,
    weeklyWorkouts: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchProfile();
    fetchStats();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    }
  };

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: history } = await supabase
        .from("exercise_history")
        .select("*")
        .eq("user_id", user.id);

      if (history) {
        const totalCalories = history.reduce((sum, item) => sum + (item.calories_burned || 0), 0);
        const totalDuration = history.reduce((sum, item) => sum + (item.duration || 0), 0);
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyWorkouts = history.filter(
          (item) => new Date(item.completed_at) >= oneWeekAgo
        ).length;

        setStats({
          totalWorkouts: history.length,
          totalCalories,
          totalDuration,
          weeklyWorkouts,
        });
      }
    }
  };

  const statCards = [
    {
      title: "Total Workouts",
      value: stats.totalWorkouts,
      icon: Activity,
      color: "text-primary",
    },
    {
      title: "Weekly Workouts",
      value: stats.weeklyWorkouts,
      icon: TrendingUp,
      color: "text-secondary",
    },
    {
      title: "Total Calories",
      value: `${stats.totalCalories} kcal`,
      icon: Flame,
      color: "text-secondary",
    },
    {
      title: "Total Duration",
      value: `${stats.totalDuration} min`,
      icon: Clock,
      color: "text-primary",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {profile?.full_name || "User"}!
          </h1>
          <p className="text-muted-foreground">Track your fitness journey and achieve your goals</p>
        </div>

        {profile && (
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
              <CardDescription>Current BMI: {profile.bmi}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{profile.age}</p>
                  <p className="text-sm text-muted-foreground">Years</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{profile.height} cm</p>
                  <p className="text-sm text-muted-foreground">Height</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{profile.weight} kg</p>
                  <p className="text-sm text-muted-foreground">Weight</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
