import { useState, useEffect } from "react";
import { Camera, Edit2, ChevronRight, LogOut, Settings, HelpCircle, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import SkillTag from "@/components/ui/SkillTag";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Skill {
  id: string;
  name: string;
  category: string | null;
}

const menuItems = [
  { icon: Edit2, label: "Edit Profile", action: () => {} },
  { icon: Settings, label: "Settings", action: () => {} },
  { icon: Shield, label: "Privacy & Security", action: () => {} },
  { icon: HelpCircle, label: "Help & Support", action: () => {} },
];

const Profile = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [teachSkills, setTeachSkills] = useState<Skill[]>([]);
  const [learnSkills, setLearnSkills] = useState<Skill[]>([]);

  useEffect(() => {
    const fetchUserSkills = async () => {
      if (!profile?.user_id) return;

      // Fetch teach skills
      const { data: teachData } = await supabase
        .from("user_teach_skills")
        .select("skill_id, skills(id, name, category)")
        .eq("user_id", profile.user_id);

      if (teachData) {
        setTeachSkills(teachData.map((item: any) => item.skills) as Skill[]);
      }

      // Fetch learn skills
      const { data: learnData } = await supabase
        .from("user_learn_skills")
        .select("skill_id, skills(id, name, category)")
        .eq("user_id", profile.user_id);

      if (learnData) {
        setLearnSkills(learnData.map((item: any) => item.skills) as Skill[]);
      }
    };

    fetchUserSkills();
  }, [profile?.user_id]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (!profile) {
    return (
      <AppLayout title="Profile">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </AppLayout>
    );
  }

  const initials = profile.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <AppLayout title="Profile">
      <div className="px-4 py-6 space-y-6">
        {/* Profile header */}
        <div className="text-center animate-fade-in">
          <div className="relative inline-block">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20">
              <AvatarImage src={profile.avatar_url || ""} alt={profile.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <Camera className="h-4 w-4 text-primary-foreground" />
            </button>
          </div>
          <h1 className="text-2xl font-bold text-foreground mt-4">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {[
            { label: "Sessions", value: 0 },
            { label: "Rating", value: "N/A" },
            { label: "Credits", value: profile.credits },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-2xl bg-card border border-border/50 text-center"
            >
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              About
            </h3>
            <p className="text-sm text-secondary-foreground leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Skills I Teach */}
        <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            I Can Teach
          </h3>
          <div className="flex flex-wrap gap-2">
            {teachSkills.length > 0 ? (
              teachSkills.map((skill) => (
                <SkillTag key={skill.id} label={skill.name} variant="primary" />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No teaching skills added</p>
            )}
          </div>
        </div>

        {/* Skills I Want to Learn */}
        <div className="animate-fade-in" style={{ animationDelay: "0.25s" }}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            I Want to Learn
          </h3>
          <div className="flex flex-wrap gap-2">
            {learnSkills.length > 0 ? (
              learnSkills.map((skill) => (
                <SkillTag key={skill.id} label={skill.name} variant="outline" />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No learning skills added</p>
            )}
          </div>
        </div>

        {/* Menu items */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-2xl",
                "bg-card border border-border/50",
                "transition-all duration-200 hover:bg-secondary"
              )}
            >
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="flex-1 text-left font-medium text-foreground">
                {item.label}
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full h-12 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive animate-fade-in"
          style={{ animationDelay: "0.35s" }}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Sign Out
        </Button>
      </div>
    </AppLayout>
  );
};

export default Profile;
