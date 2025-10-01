import { Button } from "@/components/ui/button";
import { Leaf, Camera, Brain, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-botanical.jpg";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-block">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
                <Leaf className="w-4 h-4" />
                Il tuo giardino botanico personale
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              Impara le piante
              <span className="block text-primary">con l'AI</span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              Riconosci piante con l'intelligenza artificiale e impara a ricordarle 
              con flashcard a ripetizione spaziata. Come Duolingo, ma per botanica!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-lg h-14 px-8 bg-primary hover:bg-primary-hover shadow-botanical"
                onClick={() => navigate('/auth')}
              >
                Inizia Gratis
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg h-14 px-8"
              >
                Come Funziona
              </Button>
            </div>
          </div>
          
          <div className="relative animate-scale-in">
            <div className="relative rounded-3xl overflow-hidden shadow-botanical">
              <img 
                src={heroImage} 
                alt="Piante botaniche"
                className="w-full h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Camera className="w-8 h-8" />}
            title="Riconosci con AI"
            description="Scatta una foto e scopri il nome scientifico e comune della pianta in pochi secondi"
          />
          <FeatureCard
            icon={<Brain className="w-8 h-8" />}
            title="Impara e Ricorda"
            description="Sistema di flashcard con ripetizione spaziata per memorizzare davvero le piante"
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Traccia Progressi"
            description="Streak giornalieri, statistiche e quiz personalizzati per migliorare costantemente"
          />
        </div>
      </section>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary transition-all duration-300 hover:shadow-botanical animate-slide-up">
      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

export default Hero;
