import { useState } from "react";
import { ArrowLeft, Star, Clock, Award, BookOpen, MessageSquare } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import SkillTag from "@/components/ui/SkillTag";
import CreditBadge from "@/components/ui/CreditBadge";
import { useTutorProfile } from "@/hooks/useTutors";
import { useReviews } from "@/hooks/useReviews";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const TutorProfile = () => {
  const navigate = useNavigate();
  const { name } = useParams();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { tutor, loading } = useTutorProfile(name);
  const { reviews } = useReviews(tutor?.user_id);
  
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendRequest = async () => {
    if (!tutor || !user || !requestMessage.trim()) return;

    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-request", {
        body: {
          tutor_id: tutor.user_id,
          message: requestMessage.trim(),
        },
      });

      if (error) throw error;

      toast({
        title: "Request sent!",
        description: `Your learning request has been sent to ${tutor.name}.`,
      });

      setRequestDialogOpen(false);
      setRequestMessage("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send request",
        description: error.message || "Please try again.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleStartConversation = async () => {
    if (!tutor || !user) return;

    // Check if conversation exists
    const sortedIds = [user.id, tutor.user_id].sort();
    const { data: existingConvo } = await supabase
      .from("conversations")
      .select("id")
      .eq("participant_1", sortedIds[0])
      .eq("participant_2", sortedIds[1])
      .single();

    if (existingConvo) {
      navigate("/messages");
    } else {
      // Create conversation
      await supabase.from("conversations").insert({
        participant_1: sortedIds[0],
        participant_2: sortedIds[1],
      });
      navigate("/messages");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Tutor not found</p>
        <Button onClick={() => navigate("/search")}>Back to Search</Button>
      </div>
    );
  }

  const initials = tutor.name.split(' ').map(n => n[0]).join('').toUpperCase();
  const canSendRequest = profile && profile.credits >= 1 && tutor.user_id !== user?.id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-medium">Profile</span>
        </div>
      </div>

      <div className="px-4 py-6 pb-32 space-y-6">
        {/* Profile header */}
        <div className="text-center animate-fade-in">
          <Avatar className="h-24 w-24 mx-auto ring-4 ring-primary/20">
            <AvatarImage src={tutor.avatar_url || ""} alt={tutor.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold text-foreground mt-4">{tutor.name}</h1>
          <p className="text-sm text-muted-foreground">
            {tutor.availability_status === "available" ? "🟢 Available" : "⚪ Away"}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-5 w-5 text-warning fill-warning" />
                <span className="text-lg font-bold">{tutor.rating || "N/A"}</span>
              </div>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <span className="text-lg font-bold">{tutor.session_count}</span>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <span className="text-lg font-bold">{tutor.credits}</span>
              <p className="text-xs text-muted-foreground">Credits</p>
            </div>
          </div>
        </div>

        {/* About */}
        {tutor.bio && (
          <section className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              About Me
            </h2>
            <p className="text-sm text-secondary-foreground leading-relaxed">
              {tutor.bio}
            </p>
          </section>
        )}

        {/* Skills I Teach */}
        <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              I Teach
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {tutor.teach_skills.length > 0 ? (
              tutor.teach_skills.map((skill) => (
                <SkillTag key={skill.id} label={skill.name} variant="primary" />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No teaching skills listed</p>
            )}
          </div>
        </section>

        {/* Skills I Want to Learn */}
        <section className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              I Want to Learn
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {tutor.learn_skills.length > 0 ? (
              tutor.learn_skills.map((skill) => (
                <SkillTag key={skill.id} label={skill.name} variant="outline" />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No learning goals listed</p>
            )}
          </div>
        </section>

        {/* Recent Reviews */}
        <section className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Recent Reviews
            </h2>
            {reviews.length > 0 && (
              <button className="text-sm text-primary hover:underline">See All</button>
            )}
          </div>
          <div className="space-y-3">
            {reviews.length > 0 ? (
              reviews.slice(0, 3).map((review) => (
                <div
                  key={review.id}
                  className="p-4 rounded-2xl bg-card border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.reviewer_profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {review.reviewer_profile?.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">
                        {review.reviewer_profile?.name || "Anonymous"}
                      </h4>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-warning fill-warning" />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 rounded-2xl bg-card border border-border/50 text-center">
                <p className="text-sm text-muted-foreground">No reviews yet</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Fixed bottom CTA */}
      {tutor.user_id !== user?.id && (
        <div className="fixed bottom-0 left-0 right-0 p-4 glass border-t border-border/50">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-12 w-12 rounded-2xl shrink-0"
              onClick={handleStartConversation}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button 
              className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 font-semibold"
              onClick={() => setRequestDialogOpen(true)}
              disabled={!canSendRequest}
            >
              Send Request
              <CreditBadge credits={1} size="sm" className="ml-2 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground" />
            </Button>
          </div>
          {profile && profile.credits < 1 && (
            <p className="text-xs text-destructive text-center mt-2">
              You need at least 1 credit to send a request
            </p>
          )}
        </div>
      )}

      {/* Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Learning Request</DialogTitle>
            <DialogDescription>
              Tell {tutor.name} what you'd like to learn. Be specific about your goals!
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="I'd love to learn about..."
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            className="min-h-[120px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendRequest} 
              disabled={!requestMessage.trim() || sending}
            >
              {sending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutorProfile;
