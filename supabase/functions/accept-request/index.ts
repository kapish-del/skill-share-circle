import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AcceptRequestBody {
  request_id: string;
  scheduled_at: string;
  duration_minutes?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { request_id, scheduled_at, duration_minutes = 60 }: AcceptRequestBody = await req.json();

    if (!request_id || !scheduled_at) {
      return new Response(
        JSON.stringify({ error: "request_id and scheduled_at are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the request
    const { data: request, error: requestError } = await supabaseAdmin
      .from("learning_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (requestError || !request) {
      return new Response(
        JSON.stringify({ error: "Request not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is the tutor
    if (request.tutor_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Only the tutor can accept this request" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check request is pending
    if (request.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Request is no longer pending" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update request status
    await supabaseAdmin
      .from("learning_requests")
      .update({ status: "accepted" })
      .eq("id", request_id);

    // Create session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .insert({
        request_id: request_id,
        tutor_id: request.tutor_id,
        learner_id: request.learner_id,
        skill_id: request.skill_id,
        scheduled_at: scheduled_at,
        duration_minutes: duration_minutes,
        status: "scheduled",
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Failed to create session:", sessionError);
      return new Response(
        JSON.stringify({ error: "Failed to create session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send message to conversation
    const sortedIds = [request.learner_id, request.tutor_id].sort();
    const { data: convo } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .eq("participant_1", sortedIds[0])
      .eq("participant_2", sortedIds[1])
      .single();

    if (convo) {
      await supabaseAdmin.from("messages").insert({
        conversation_id: convo.id,
        sender_id: user.id,
        content: `✅ Request accepted! Session scheduled for ${new Date(scheduled_at).toLocaleString()}`,
      });

      await supabaseAdmin
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", convo.id);
    }

    console.log(`Request ${request_id} accepted. Session ${session.id} created.`);

    return new Response(
      JSON.stringify({ success: true, session }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
