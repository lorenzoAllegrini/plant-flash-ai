import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Camera, Upload, Loader2 } from "lucide-react";

const AddPlant = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non autenticato");

      // Upload foto
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('plant-photos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('plant-photos')
        .getPublicUrl(fileName);

      // TODO: Chiamare edge function per riconoscimento AI
      // Per ora creiamo una pianta di esempio
      const { error: plantError } = await supabase
        .from('plants')
        .insert({
          user_id: user.id,
          scientific_name: "In elaborazione...",
          common_name: "Pianta non identificata",
          first_photo_url: publicUrl,
        });

      if (plantError) throw plantError;

      toast({
        title: "Foto caricata! 📸",
        description: "Riconoscimento AI in corso...",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

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

        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">
              Aggiungi Nuova Pianta
            </h1>

            {previewUrl ? (
              <div className="space-y-6">
                <div className="aspect-square rounded-xl overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl("");
                    }}
                  >
                    Cambia Foto
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Riconoscimento...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Identifica Pianta
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label
                  htmlFor="file-upload"
                  className="block cursor-pointer"
                >
                  <Card className="border-2 border-dashed hover:border-primary transition-colors">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <Camera className="w-16 h-16 text-primary mb-4" />
                      <h3 className="text-xl font-bold mb-2">
                        Scatta o Carica una Foto
                      </h3>
                      <p className="text-muted-foreground text-center">
                        Inquadra bene la pianta per un riconoscimento preciso
                      </p>
                    </CardContent>
                  </Card>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddPlant;
