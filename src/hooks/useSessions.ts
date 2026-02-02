import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Session {
  id: string;
  request_id: string | null;
  tutor_id: string;
  learner_id: string;
  skill_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  tutor_notes: string | null;
  learner_notes: string | null;
  is_ai_session: boolean;
  created_at: string;
  completed_at: string | null;
  tutor_profile?: {
    name: string;
    avatar_url: string | null;
  };
  learner_profile?: {
    name: string;
    avatar_url: string | null;
  };
  skill?: {
    name: string;
  };
}

export function useSessions() {
  const { user } = useAuth();
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [completedSessions, setCompletedSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    if (!user) return;

    setLoading(true);

    const now = new Date().toISOString();

    // Fetch upcoming sessions
    const { data: upcoming } = await supabase
      .from("sessions")
      .select(`*, skill:skills(name)`)
      .or(`tutor_id.eq.${user.id},learner_id.eq.${user.id}`)
      .eq("status", "scheduled")
      .gte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(10);

    // Fetch completed sessions
    const { data: completed } = await supabase
      .from("sessions")
      .select(`*, skill:skills(name)`)
      .or(`tutor_id.eq.${user.id},learner_id.eq.${user.id}`)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(20);

    // Enrich with profile data
    const allSessions = [...(upcoming || []), ...(completed || [])];
    const userIds = new Set<string>();
    allSessions.forEach((s) => {
      userIds.add(s.tutor_id);
      userIds.add(s.learner_id);
    });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, avatar_url")
      .in("user_id", Array.from(userIds));

    const enrichSession = (session: any) => ({
      ...session,
      tutor_profile: profiles?.find((p) => p.user_id === session.tutor_id),
      learner_profile: profiles?.find((p) => p.user_id === session.learner_id),
    });

    setUpcomingSessions((upcoming || []).map(enrichSession));
    setCompletedSessions((completed || []).map(enrichSession));
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  return { upcomingSessions, completedSessions, loading, refetch: fetchSessions };
}
