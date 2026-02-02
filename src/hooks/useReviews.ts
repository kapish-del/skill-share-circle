import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  session_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_profile?: {
    name: string;
    avatar_url: string | null;
  };
}

export function useReviews(userId: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewee_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        const reviewerIds = data.map((r) => r.reviewer_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, avatar_url")
          .in("user_id", reviewerIds);

        const enriched = data.map((review) => ({
          ...review,
          reviewer_profile: profiles?.find((p) => p.user_id === review.reviewer_id),
        }));

        setReviews(enriched);
      } else {
        setReviews([]);
      }

      setLoading(false);
    };

    fetchReviews();
  }, [userId]);

  return { reviews, loading };
}
