import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CompleteSessionRequest {
  session_id: string;
  tutor_notes?: string;
  learner_notes?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client for credit operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get auth user from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { session_id, tutor_notes, learner_notes }: CompleteSessionRequest = await req.json();

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "session_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Completing session ${session_id} by user ${user.id}`);

    // Fetch the session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      console.error("Session not found:", sessionError);
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is participant
    if (session.tutor_id !== user.id && session.learner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "You are not a participant in this session" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check session isn't already completed
    if (session.status === "completed") {
      return new Response(
        JSON.stringify({ error: "Session is already completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate credit amounts
    const isAiSession = session.is_ai_session;
    const creditCost = isAiSession ? 0.5 : 1;

    // Check learner has enough credits
    const { data: learnerProfile, error: learnerError } = await supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("user_id", session.learner_id)
      .single();

    if (learnerError || !learnerProfile) {
      console.error("Learner profile not found:", learnerError);
      return new Response(
        JSON.stringify({ error: "Learner profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (learnerProfile.credits < creditCost) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update session status
    const { error: updateError } = await supabaseAdmin
      .from("sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        tutor_notes: tutor_notes || session.tutor_notes,
        learner_notes: learner_notes || session.learner_notes,
      })
      .eq("id", session_id);

    if (updateError) {
      console.error("Failed to update session:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct credits from learner
    const { error: deductError } = await supabaseAdmin
      .from("profiles")
      .update({ credits: learnerProfile.credits - creditCost })
      .eq("user_id", session.learner_id);

    if (deductError) {
      console.error("Failed to deduct credits:", deductError);
    }

    // Add credits to tutor (only for human sessions)
    if (!isAiSession) {
      const { data: tutorProfile } = await supabaseAdmin
        .from("profiles")
        .select("credits")
        .eq("user_id", session.tutor_id)
        .single();

      if (tutorProfile) {
        await supabaseAdmin
          .from("profiles")
          .update({ credits: tutorProfile.credits + 1 })
          .eq("user_id", session.tutor_id);
      }
    }

    // Create credit transaction records
    // Learner spent credits
    await supabaseAdmin.from("credit_transactions").insert({
      user_id: session.learner_id,
      amount: -creditCost,
      type: isAiSession ? "ai_session" : "learning",
      session_id: session_id,
      description: isAiSession ? "AI Learning Session" : "Human tutoring session",
    });

    // Tutor earned credits (only for human sessions)
    if (!isAiSession) {
      await supabaseAdmin.from("credit_transactions").insert({
        user_id: session.tutor_id,
        amount: 1,
        type: "teaching",
        session_id: session_id,
        description: "Teaching session completed",
      });
    }

    console.log(`Session ${session_id} completed successfully. Credits transferred.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Session completed and credits transferred" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
