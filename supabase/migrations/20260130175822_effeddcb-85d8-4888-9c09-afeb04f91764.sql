-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  availability_status TEXT DEFAULT 'available',
  credits NUMERIC(10, 2) DEFAULT 3.0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create skills table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_skills junction table (skills users can teach)
CREATE TABLE public.user_teach_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, skill_id)
);

-- Create user_learn_skills junction table (skills users want to learn)
CREATE TABLE public.user_learn_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, skill_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_teach_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learn_skills ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Skills policies (public read, admin write)
CREATE POLICY "Anyone can view skills"
  ON public.skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert skills"
  ON public.skills FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- User teach skills policies
CREATE POLICY "Users can view all teach skills"
  ON public.user_teach_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own teach skills"
  ON public.user_teach_skills FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own teach skills"
  ON public.user_teach_skills FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User learn skills policies
CREATE POLICY "Users can view all learn skills"
  ON public.user_learn_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own learn skills"
  ON public.user_learn_skills FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learn skills"
  ON public.user_learn_skills FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default skills
INSERT INTO public.skills (name, category) VALUES
  ('Photography', 'Creative'),
  ('UI Design', 'Design'),
  ('Web Development', 'Technology'),
  ('Guitar', 'Music'),
  ('Piano', 'Music'),
  ('Spanish', 'Languages'),
  ('French', 'Languages'),
  ('Cooking', 'Lifestyle'),
  ('Yoga', 'Fitness'),
  ('Marketing', 'Business'),
  ('Data Science', 'Technology'),
  ('Video Editing', 'Creative'),
  ('Illustration', 'Creative'),
  ('Public Speaking', 'Communication'),
  ('Python', 'Technology'),
  ('JavaScript', 'Technology');