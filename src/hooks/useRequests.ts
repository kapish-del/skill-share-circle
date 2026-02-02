import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LearningRequest {
  id: string;
  learner_id: string;
  tutor_id: string;
  skill_id: string | null;
  message: string | null;
  proposed_datetime: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  learner_profile?: {
    name: string;
    avatar_url: string | null;
  };
  tutor_profile?: {
    name: string;
    avatar_url: string | null;
  };
  skill?: {
    name: string;
  };
}

export function useRequests() {
  const { user } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<LearningRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<LearningRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch incoming requests (where user is tutor)
    const { data: incoming } = await supabase
      .from("learning_requests")
      .select(`
        *,
        skill:skills(name)
      `)
      .eq("tutor_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    // Fetch outgoing requests (where user is learner)
    const { data: outgoing } = await supabase
      .from("learning_requests")
      .select(`
        *,
        skill:skills(name)
      `)
      .eq("learner_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    // Fetch profile info for incoming requests
    if (incoming && incoming.length > 0) {
      const learnerIds = incoming.map((r) => r.learner_id);
      const { data: learnerProfiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", learnerIds);

      const enrichedIncoming = incoming.map((req) => ({
        ...req,
        learner_profile: learnerProfiles?.find((p) => p.user_id === req.learner_id),
      }));
      setIncomingRequests(enrichedIncoming);
    } else {
      setIncomingRequests([]);
    }

    // Fetch profile info for outgoing requests
    if (outgoing && outgoing.length > 0) {
      const tutorIds = outgoing.map((r) => r.tutor_id);
      const { data: tutorProfiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", tutorIds);

      const enrichedOutgoing = outgoing.map((req) => ({
        ...req,
        tutor_profile: tutorProfiles?.find((p) => p.user_id === req.tutor_id),
      }));
      setOutgoingRequests(enrichedOutgoing);
    } else {
      setOutgoingRequests([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("requests-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "learning_requests",
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { incomingRequests, outgoingRequests, loading, refetch: fetchRequests };
}
