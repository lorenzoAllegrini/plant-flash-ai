import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Plus, Camera, LogOut, User, Award } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Plant = Database['public']['Tables']['plants']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);
      await loadProfile(user.id);
      await loadPlants(user.id);
    } catch (error) {
      console.error("Error checking user:", error);
      navigate("/auth");
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Error loading profile:", error);
    } else {
      setProfile(data);
    }
  };

  const loadPlants = async (userId: string) => {
    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error loading plants:", error);
    } else {
      setPlants(data || []);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-botanical flex items-center justify-center">
        <Leaf className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-botanical">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">PlantFlash</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/profile')}>
                <User className="w-4 h-4 mr-2" />
                Profilo
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Esci
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={<Leaf className="w-5 h-5" />}
              label="Piante"
              value={profile?.total_plants || 0}
            />
            <StatCard
              icon={<Award className="w-5 h-5" />}
              label="Streak"
              value={`${profile?.streak_count || 0} giorni`}
            />
            <StatCard
              icon={<Award className="w-5 h-5" />}
              label="Accuratezza"
              value={`${profile?.quiz_accuracy || 0}%`}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Il Tuo Giardino</h2>
            <p className="text-muted-foreground">
              {plants.length > 0 
                ? `Hai raccolto ${plants.length} piante nel tuo giardino digitale` 
                : "Inizia aggiungendo la tua prima pianta!"}
            </p>
          </div>
          <Button 
            size="lg" 
            className="shadow-botanical"
            onClick={() => navigate('/add-plant')}
          >
            <Camera className="w-5 h-5 mr-2" />
            Aggiungi Pianta
          </Button>
        </div>

        {plants.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

const StatCard = ({ icon, label, value }: StatCardProps) => {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-background/50">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
};

const EmptyState = () => {
  const navigate = useNavigate();
  
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Plus className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-3">Nessuna pianta ancora</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Inizia il tuo viaggio botanico! Scatta una foto di una pianta 
          e scopri il suo nome con l'intelligenza artificiale.
        </p>
        <Button size="lg" onClick={() => navigate('/add-plant')}>
          <Camera className="w-5 h-5 mr-2" />
          Aggiungi la Prima Pianta
        </Button>
      </CardContent>
    </Card>
  );
};

interface PlantCardProps {
  plant: Plant;
}

const PlantCard = ({ plant }: PlantCardProps) => {
  return (
    <Card className="group hover:shadow-botanical transition-all duration-300 cursor-pointer overflow-hidden">
      <div className="aspect-square relative overflow-hidden">
        {plant.first_photo_url ? (
          <img 
            src={plant.first_photo_url} 
            alt={plant.common_name || plant.scientific_name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-botanical flex items-center justify-center">
            <Leaf className="w-16 h-16 text-primary/30" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-1 line-clamp-1">
          {plant.common_name || plant.scientific_name}
        </h3>
        <p className="text-sm text-muted-foreground italic line-clamp-1">
          {plant.scientific_name}
        </p>
        {plant.family && (
          <p className="text-xs text-muted-foreground mt-2">
            {plant.family}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default Dashboard;
