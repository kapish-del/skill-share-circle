import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ArrowLeft, User, Sparkles, BookOpen, GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SkillTag from "@/components/ui/SkillTag";

interface Skill {
  id: string;
  name: string;
  category: string | null;
}

const profileSchema = z.object({
  name: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100),
  bio: z.string().trim().max(500, { message: "Bio must be less than 500 characters" }).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfileSetup = () => {
  const [step, setStep] = useState(1);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [teachSkills, setTeachSkills] = useState<string[]>([]);
  const [learnSkills, setLearnSkills] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      bio: "",
    },
  });

  useEffect(() => {
    const fetchSkills = async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching skills:", error);
        return;
      }

      setAllSkills(data as Skill[]);
    };

    fetchSkills();
  }, []);

  const toggleTeachSkill = (skillId: string) => {
    setTeachSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  };

  const toggleLearnSkill = (skillId: string) => {
    setLearnSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;

    const values = form.getValues();
    if (!values.name || values.name.trim().length < 2) {
      toast({
        variant: "destructive",
        title: "Invalid name",
        description: "Please enter a valid name.",
      });
      setStep(1);
      return;
    }

    if (teachSkills.length === 0) {
      toast({
        variant: "destructive",
        title: "No teaching skills",
        description: "Please select at least one skill you can teach.",
      });
      setStep(2);
      return;
    }

    if (learnSkills.length === 0) {
      toast({
        variant: "destructive",
        title: "No learning skills",
        description: "Please select at least one skill you want to learn.",
      });
      setStep(3);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: user.id,
        name: values.name.trim(),
        email: user.email || "",
        bio: values.bio?.trim() || null,
        credits: 3, // Initial credits
      });

      if (profileError) {
        throw profileError;
      }

      // Insert teach skills
      const teachSkillsData = teachSkills.map((skillId) => ({
        user_id: user.id,
        skill_id: skillId,
      }));

      const { error: teachError } = await supabase
        .from("user_teach_skills")
        .insert(teachSkillsData);

      if (teachError) {
        throw teachError;
      }

      // Insert learn skills
      const learnSkillsData = learnSkills.map((skillId) => ({
        user_id: user.id,
        skill_id: skillId,
      }));

      const { error: learnError } = await supabase
        .from("user_learn_skills")
        .insert(learnSkillsData);

      if (learnError) {
        throw learnError;
      }

      await refreshProfile();

      toast({
        title: "Profile created!",
        description: "You've received 3 credits to start learning.",
      });

      navigate("/");
    } catch (error: any) {
      console.error("Profile setup error:", error);
      toast({
        variant: "destructive",
        title: "Setup failed",
        description: error.message || "An error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Tell us about yourself</h2>
              <p className="text-muted-foreground mt-2">Let's start with the basics</p>
            </div>

            <Form {...form}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Your Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your full name"
                          className="h-12 bg-card border-border/50 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Bio (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Tell us a bit about yourself..."
                          className="bg-card border-border/50 rounded-xl min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Form>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">What can you teach?</h2>
              <p className="text-muted-foreground mt-2">Select skills you're confident teaching</p>
            </div>

            {/* Selected skills */}
            {teachSkills.length > 0 && (
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                <p className="text-sm text-primary mb-3 font-medium">Selected ({teachSkills.length})</p>
                <div className="flex flex-wrap gap-2">
                  {teachSkills.map((skillId) => {
                    const skill = allSkills.find((s) => s.id === skillId);
                    return skill ? (
                      <span
                        key={skillId}
                        onClick={() => toggleTeachSkill(skillId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-primary text-primary-foreground cursor-pointer"
                      >
                        {skill.name}
                        <X className="h-3 w-3" />
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* All skills */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {Object.entries(
                allSkills.reduce((acc, skill) => {
                  const category = skill.category || "Other";
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(skill);
                  return acc;
                }, {} as Record<string, Skill[]>)
              ).map(([category, skills]) => (
                <div key={category}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <SkillTag
                        key={skill.id}
                        label={skill.name}
                        variant={teachSkills.includes(skill.id) ? "primary" : "outline"}
                        onClick={() => toggleTeachSkill(skill.id)}
                        size="md"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">What do you want to learn?</h2>
              <p className="text-muted-foreground mt-2">Pick skills you're interested in</p>
            </div>

            {/* Selected skills */}
            {learnSkills.length > 0 && (
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50">
                <p className="text-sm text-foreground mb-3 font-medium">Selected ({learnSkills.length})</p>
                <div className="flex flex-wrap gap-2">
                  {learnSkills.map((skillId) => {
                    const skill = allSkills.find((s) => s.id === skillId);
                    return skill ? (
                      <span
                        key={skillId}
                        onClick={() => toggleLearnSkill(skillId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-foreground text-background cursor-pointer"
                      >
                        {skill.name}
                        <X className="h-3 w-3" />
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* All skills - excluding teach skills */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {Object.entries(
                allSkills
                  .filter((skill) => !teachSkills.includes(skill.id))
                  .reduce((acc, skill) => {
                    const category = skill.category || "Other";
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(skill);
                    return acc;
                  }, {} as Record<string, Skill[]>)
              ).map(([category, skills]) => (
                <div key={category}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <SkillTag
                        key={skill.id}
                        label={skill.name}
                        variant={learnSkills.includes(skill.id) ? "primary" : "outline"}
                        onClick={() => toggleLearnSkill(skill.id)}
                        size="md"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with logo and progress */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">SkillSwap</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-8 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-6 pb-6">
        {renderStep()}
      </div>

      {/* Navigation buttons */}
      <div className="p-6 border-t border-border/50 bg-card/50">
        <div className="flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1 h-12 rounded-xl"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back
            </Button>
          )}
          <Button
            onClick={() => {
              if (step < 3) {
                if (step === 1) {
                  const isValid = form.trigger();
                  isValid.then((valid) => {
                    if (valid) setStep(step + 1);
                  });
                } else {
                  setStep(step + 1);
                }
              } else {
                handleSubmit();
              }
            }}
            disabled={isSubmitting || (step === 2 && teachSkills.length === 0) || (step === 3 && learnSkills.length === 0)}
            className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isSubmitting ? (
              "Creating profile..."
            ) : step === 3 ? (
              <>
                Complete Setup
                <Sparkles className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
