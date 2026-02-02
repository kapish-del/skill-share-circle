import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendRequestBody {
  tutor_id: string;
  skill_id?: string;
  message: string;
  proposed_datetime?: string;
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

    const { tutor_id, skill_id, message, proposed_datetime }: SendRequestBody = await req.json();

    if (!tutor_id || !message) {
      return new Response(
        JSON.stringify({ error: "tutor_id and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tutor_id === user.id) {
      return new Response(
        JSON.stringify({ error: "You cannot send a request to yourself" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if learner has enough credits
    const { data: learnerProfile } = await supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("user_id", user.id)
      .single();

    if (!learnerProfile || learnerProfile.credits < 1) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits to send a request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check tutor exists
    const { data: tutorProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name")
      .eq("user_id", tutor_id)
      .single();

    if (!tutorProfile) {
      return new Response(
        JSON.stringify({ error: "Tutor not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the learning request
    const { data: request, error: insertError } = await supabaseAdmin
      .from("learning_requests")
      .insert({
        learner_id: user.id,
        tutor_id: tutor_id,
        skill_id: skill_id || null,
        message: message,
        proposed_datetime: proposed_datetime || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create request:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create or get conversation between users
    const sortedIds = [user.id, tutor_id].sort();
    
    // Check if conversation exists
    const { data: existingConvo } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .eq("participant_1", sortedIds[0])
      .eq("participant_2", sortedIds[1])
      .single();

    let conversationId = existingConvo?.id;

    if (!conversationId) {
      const { data: newConvo, error: convoError } = await supabaseAdmin
        .from("conversations")
        .insert({
          participant_1: sortedIds[0],
          participant_2: sortedIds[1],
        })
        .select()
        .single();

      if (convoError) {
        console.error("Failed to create conversation:", convoError);
      } else {
        conversationId = newConvo.id;
      }
    }

    // Send initial message if conversation was created
    if (conversationId) {
      await supabaseAdmin.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: `📚 Learning Request: ${message}`,
      });

      await supabaseAdmin
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
    }

    console.log(`Request ${request.id} created by ${user.id} for tutor ${tutor_id}`);

    return new Response(
      JSON.stringify({ success: true, request }),
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
