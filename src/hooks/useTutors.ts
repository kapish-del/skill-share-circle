import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Tutor {
  user_id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  availability_status: string | null;
  credits: number;
  teach_skills: { id: string; name: string }[];
  learn_skills: { id: string; name: string }[];
  rating: number;
  session_count: number;
}

export function useTutors(searchQuery: string = "") {
  const { user } = useAuth();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTutors = async () => {
    setLoading(true);

    // Fetch all profiles except current user
    let query = supabase
      .from("profiles")
      .select("*")
      .neq("user_id", user?.id || "");

    const { data: profiles } = await query;

    if (!profiles || profiles.length === 0) {
      setTutors([]);
      setLoading(false);
      return;
    }

    const userIds = profiles.map((p) => p.user_id);

    // Fetch teach skills for all users
    const { data: teachSkillsData } = await supabase
      .from("user_teach_skills")
      .select("user_id, skill:skills(id, name)")
      .in("user_id", userIds);

    // Fetch learn skills for all users
    const { data: learnSkillsData } = await supabase
      .from("user_learn_skills")
      .select("user_id, skill:skills(id, name)")
      .in("user_id", userIds);

    // Fetch session counts and ratings
    const { data: sessionsData } = await supabase
      .from("sessions")
      .select("tutor_id")
      .eq("status", "completed")
      .in("tutor_id", userIds);

    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("reviewee_id, rating")
      .in("reviewee_id", userIds);

    // Build tutor objects
    const enrichedTutors: Tutor[] = profiles.map((profile) => {
      const teachSkills = (teachSkillsData || [])
        .filter((ts) => ts.user_id === profile.user_id)
        .map((ts) => ts.skill as { id: string; name: string });

      const learnSkills = (learnSkillsData || [])
        .filter((ls) => ls.user_id === profile.user_id)
        .map((ls) => ls.skill as { id: string; name: string });

      const sessionCount = (sessionsData || []).filter(
        (s) => s.tutor_id === profile.user_id
      ).length;

      const userReviews = (reviewsData || []).filter(
        (r) => r.reviewee_id === profile.user_id
      );
      const avgRating =
        userReviews.length > 0
          ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length
          : 0;

      return {
        user_id: profile.user_id,
        name: profile.name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        availability_status: profile.availability_status,
        credits: profile.credits,
        teach_skills: teachSkills,
        learn_skills: learnSkills,
        rating: Math.round(avgRating * 10) / 10,
        session_count: sessionCount,
      };
    });

    // Filter by search query
    let filtered = enrichedTutors;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = enrichedTutors.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.teach_skills.some((s) => s.name.toLowerCase().includes(query)) ||
          t.learn_skills.some((s) => s.name.toLowerCase().includes(query))
      );
    }

    // Only show tutors with teach skills
    filtered = filtered.filter((t) => t.teach_skills.length > 0);

    setTutors(filtered);
    setLoading(false);
  };

  useEffect(() => {
    fetchTutors();
  }, [user, searchQuery]);

  return { tutors, loading, refetch: fetchTutors };
}

export function useTutorProfile(userId: string | undefined) {
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutor = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Try to find by user_id first
      let { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      // If not found, try by name (URL encoded)
      if (!profile) {
        const { data: profileByName } = await supabase
          .from("profiles")
          .select("*")
          .ilike("name", decodeURIComponent(userId))
          .single();
        profile = profileByName;
      }

      if (!profile) {
        setTutor(null);
        setLoading(false);
        return;
      }

      // Fetch skills
      const { data: teachSkillsData } = await supabase
        .from("user_teach_skills")
        .select("skill:skills(id, name)")
        .eq("user_id", profile.user_id);

      const { data: learnSkillsData } = await supabase
        .from("user_learn_skills")
        .select("skill:skills(id, name)")
        .eq("user_id", profile.user_id);

      // Fetch stats
      const { count: sessionCount } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("tutor_id", profile.user_id)
        .eq("status", "completed");

      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewee_id", profile.user_id);

      const avgRating =
        reviews && reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      setTutor({
        user_id: profile.user_id,
        name: profile.name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        availability_status: profile.availability_status,
        credits: profile.credits,
        teach_skills: (teachSkillsData || []).map((ts) => ts.skill as { id: string; name: string }),
        learn_skills: (learnSkillsData || []).map((ls) => ls.skill as { id: string; name: string }),
        rating: Math.round(avgRating * 10) / 10,
        session_count: sessionCount || 0,
      });
      setLoading(false);
    };

    fetchTutor();
  }, [userId]);

  return { tutor, loading };
}
