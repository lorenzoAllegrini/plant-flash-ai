import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Leaf, Award, TrendingUp, Calendar } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) setProfile(data);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-botanical flex items-center justify-center">
        <Leaf className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-botanical">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna al Giardino
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
                  {profile.full_name?.[0] || "?"}
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {profile.full_name || "Botanico"}
                  </h1>
                  <p className="text-muted-foreground">{profile.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard
              icon={<Leaf className="w-8 h-8" />}
              title="Piante Raccolte"
              value={profile.total_plants || 0}
              subtitle="nel tuo giardino"
            />
            <StatsCard
              icon={<Award className="w-8 h-8" />}
              title="Streak Corrente"
              value={`${profile.streak_count || 0} giorni`}
              subtitle="di apprendimento"
            />
            <StatsCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Accuratezza Quiz"
              value={`${profile.quiz_accuracy || 0}%`}
              subtitle="risposte corrette"
            />
          </div>

          {/* Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Attività Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Le tue attività appariranno qui
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
}

const StatsCard = ({ icon, title, value, subtitle }: StatsCardProps) => {
  return (
    <Card className="hover:shadow-botanical transition-all">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold mb-1">{value}</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Profile;
