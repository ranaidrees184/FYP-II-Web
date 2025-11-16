import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, LogOut, LayoutDashboard, User, Calculator, ListChecks, Activity, MessageCircle, History } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
    navigate("/auth");
  };

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/profile", icon: User, label: "Profile" },
    { path: "/bmi-calculator", icon: Calculator, label: "BMI" },
    { path: "/suggested-workouts", icon: ListChecks, label: "Workouts" },
    { path: "/perform-exercise", icon: Activity, label: "Exercise" },
    { path: "/exercise-history", icon: History, label: "History" },
    { path: "/ai-chatbot", icon: MessageCircle, label: "AI Chat" },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2 text-xl font-bold text-primary">
            <Dumbbell className="h-6 w-6" />
            <span>AI Fitness</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
