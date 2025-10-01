-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  streak_count INTEGER DEFAULT 0,
  total_plants INTEGER DEFAULT 0,
  quiz_accuracy DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create plants table
CREATE TABLE IF NOT EXISTS public.plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scientific_name TEXT NOT NULL,
  common_name TEXT,
  family TEXT,
  description TEXT,
  first_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plants"
  ON public.plants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plants"
  ON public.plants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plants"
  ON public.plants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plants"
  ON public.plants FOR DELETE
  USING (auth.uid() = user_id);

-- Create plant_photos table (timeline)
CREATE TABLE IF NOT EXISTS public.plant_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.plant_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plant photos"
  ON public.plant_photos FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM public.plants WHERE id = plant_id
  ));

CREATE POLICY "Users can insert own plant photos"
  ON public.plant_photos FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.plants WHERE id = plant_id
  ));

CREATE POLICY "Users can delete own plant photos"
  ON public.plant_photos FOR DELETE
  USING (auth.uid() IN (
    SELECT user_id FROM public.plants WHERE id = plant_id
  ));

-- Create flashcards table
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  front_image_url TEXT NOT NULL,
  back_text TEXT NOT NULL,
  interval_days INTEGER DEFAULT 1,
  ease_factor DECIMAL(3,2) DEFAULT 2.5,
  repetitions INTEGER DEFAULT 0,
  due_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flashcards"
  ON public.flashcards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards"
  ON public.flashcards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards"
  ON public.flashcards FOR UPDATE
  USING (auth.uid() = user_id);

-- Create quiz_results table
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  was_correct BOOLEAN NOT NULL,
  response_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz results"
  ON public.quiz_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results"
  ON public.quiz_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_plants_updated_at
  BEFORE UPDATE ON public.plants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_flashcards_updated_at
  BEFORE UPDATE ON public.flashcards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create storage bucket for plant photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('plant-photos', 'plant-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for plant photos
CREATE POLICY "Public can view plant photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'plant-photos');

CREATE POLICY "Authenticated users can upload plant photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'plant-photos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own plant photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'plant-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own plant photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'plant-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );