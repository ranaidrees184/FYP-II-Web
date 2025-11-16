import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchProfile();
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
      if (data) {
        setProfile(data);
        setHeight(data.height.toString());
        setWeight(data.weight.toString());
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({
            height: parseFloat(height),
            weight: parseFloat(weight),
          })
          .eq("id", user.id);

        if (error) throw error;
        toast({ title: "Profile updated successfully!" });
        fetchProfile();
      }
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Profile Management</h1>
        
        {profile && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <p className="text-lg font-semibold mt-1">{profile.full_name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-lg font-semibold mt-1">{profile.email}</p>
                </div>
                <div>
                  <Label>Age</Label>
                  <p className="text-lg font-semibold mt-1">{profile.age} years</p>
                </div>
                <div>
                  <Label>Current BMI</Label>
                  <p className="text-2xl font-bold text-primary mt-1">{profile.bmi}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Update Measurements</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.01"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Updating..." : "Update Measurements"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
