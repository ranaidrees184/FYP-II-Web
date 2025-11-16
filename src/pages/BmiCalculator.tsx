import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

const BmiCalculator = () => {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchUserData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) {
        setHeight(data.height.toString());
        setWeight(data.weight.toString());
        calculateBmi(data.height, data.weight);
      }
    }
  };

  const calculateBmi = (h: number, w: number) => {
    const heightInMeters = h / 100;
    const calculatedBmi = w / (heightInMeters * heightInMeters);
    setBmi(parseFloat(calculatedBmi.toFixed(2)));
    
    if (calculatedBmi < 18.5) setCategory("Underweight");
    else if (calculatedBmi < 25) setCategory("Normal weight");
    else if (calculatedBmi < 30) setCategory("Overweight");
    else setCategory("Obese");
  };

  const handleCalculate = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h && w) {
      calculateBmi(h, w);
    }
  };

  useEffect(() => {
    if (height && weight) {
      handleCalculate();
    }
  }, [height, weight]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">BMI Calculator</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Calculate Your BMI</CardTitle>
              <CardDescription>Enter your measurements to calculate your Body Mass Index</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.01"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Enter height in cm"
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
                  placeholder="Enter weight in kg"
                />
              </div>
            </CardContent>
          </Card>

          {bmi && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Your Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Your BMI</p>
                    <p className="text-6xl font-bold text-primary">{bmi}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Category</p>
                    <p className="text-2xl font-semibold">{category}</p>
                  </div>
                </div>
                
                <div className="mt-8 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Underweight:</span>
                    <span className="text-muted-foreground">&lt; 18.5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Normal weight:</span>
                    <span className="text-muted-foreground">18.5 - 24.9</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overweight:</span>
                    <span className="text-muted-foreground">25 - 29.9</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Obese:</span>
                    <span className="text-muted-foreground">&ge; 30</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BmiCalculator;
