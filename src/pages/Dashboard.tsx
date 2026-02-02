import { Search, TrendingUp, Sparkles, ArrowRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CreditBadge from "@/components/ui/CreditBadge";
import SkillTag from "@/components/ui/SkillTag";
import SessionCard from "@/components/ui/SessionCard";
import RequestCard from "@/components/ui/RequestCard";
import { useAuth } from "@/contexts/AuthContext";
import { useSessions } from "@/hooks/useSessions";
import { useRequests } from "@/hooks/useRequests";
import { format, isToday, isTomorrow } from "date-fns";

const hotTopics = [
  "Photography", "Public Speaking", "UI/UX Design", "Python", "Guitar", "Cooking"
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { upcomingSessions, loading: sessionsLoading } = useSessions();
  const { incomingRequests, outgoingRequests, loading: requestsLoading } = useRequests();

  const firstName = profile?.name?.split(' ')[0] || 'there';
  const credits = profile?.credits ?? 0;

  const formatSessionDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const formatSessionTime = (dateStr: string) => {
    return format(new Date(dateStr), "h:mm a");
  };

  // Combine and format requests for display
  const activeRequests = [
    ...incomingRequests.map((req) => ({
      name: req.learner_profile?.name || "Unknown",
      topic: req.skill?.name || "General",
      message: req.message || "New request",
      timeAgo: getTimeAgo(req.created_at),
      type: "incoming" as const,
      status: req.status as "pending",
    })),
    ...outgoingRequests.map((req) => ({
      name: req.tutor_profile?.name || "Unknown",
      topic: req.skill?.name || "General",
      message: req.message || "Pending response",
      timeAgo: getTimeAgo(req.created_at),
      type: "outgoing" as const,
      status: req.status as "pending",
    })),
  ].slice(0, 4);

  function getTimeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  }

  return (
    <AppLayout title="Skill Swap">
      <div className="px-4 py-6 space-y-6">
        {/* Welcome section */}
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground">Hello, {firstName}! 👋</h2>
          <p className="text-muted-foreground mt-1">Ready to learn something new?</p>
        </div>

        {/* Credit balance card */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-primary/20 via-primary/10 to-card border border-primary/20 animate-scale-in">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-4xl font-bold gradient-text">{credits}</span>
              <span className="text-lg text-primary mb-1">Credits</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Teach to earn more credits
            </p>
            <Button 
              size="sm" 
              className="mt-3 rounded-full bg-primary hover:bg-primary/90"
              onClick={() => navigate("/history")}
            >
              <Plus className="h-4 w-4 mr-1" />
              View History
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for skills, tutors, or topics..."
            className="pl-12 h-12 rounded-2xl bg-secondary border-border/50 focus:border-primary"
            onClick={() => navigate("/search")}
            readOnly
          />
        </div>

        {/* Hot Topics */}
        <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Hot Topics</h3>
            </div>
            <button 
              className="text-sm text-primary hover:underline"
              onClick={() => navigate("/search")}
            >
              See all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {hotTopics.map((topic) => (
              <SkillTag 
                key={topic} 
                label={topic} 
                variant="primary"
                onClick={() => navigate(`/search?q=${topic}`)}
              />
            ))}
          </div>
        </section>

        {/* Upcoming Sessions */}
        <section className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Upcoming Sessions</h3>
            <button 
              className="text-sm text-primary hover:underline flex items-center gap-1"
              onClick={() => navigate("/history")}
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {sessionsLoading ? (
              <p className="text-sm text-muted-foreground">Loading sessions...</p>
            ) : upcomingSessions.length === 0 ? (
              <div className="p-4 rounded-2xl bg-card border border-border/50 text-center">
                <p className="text-sm text-muted-foreground">No upcoming sessions</p>
                <Button 
                  variant="link" 
                  className="text-primary p-0 h-auto mt-1"
                  onClick={() => navigate("/search")}
                >
                  Find a tutor →
                </Button>
              </div>
            ) : (
              upcomingSessions.slice(0, 2).map((session) => (
                <SessionCard 
                  key={session.id}
                  tutorName={
                    session.tutor_id === user?.id 
                      ? session.learner_profile?.name || "Learner"
                      : session.tutor_profile?.name || "Tutor"
                  }
                  topic={session.skill?.name || "General Session"}
                  date={formatSessionDate(session.scheduled_at)}
                  time={formatSessionTime(session.scheduled_at)}
                  duration={`${session.duration_minutes} min`}
                  status="upcoming"
                />
              ))
            )}
          </div>
        </section>

        {/* Active Requests */}
        <section className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Active Requests</h3>
            <button className="text-sm text-primary hover:underline">See all</button>
          </div>
          <div className="space-y-3">
            {requestsLoading ? (
              <p className="text-sm text-muted-foreground">Loading requests...</p>
            ) : activeRequests.length === 0 ? (
              <div className="p-4 rounded-2xl bg-card border border-border/50 text-center">
                <p className="text-sm text-muted-foreground">No active requests</p>
              </div>
            ) : (
              activeRequests.map((request, i) => (
                <RequestCard key={i} {...request} />
              ))
            )}
          </div>
        </section>

        {/* AI Tutor Promo */}
        <section className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-secondary via-card to-card border border-border/50">
            <div className="absolute -top-4 -right-4 w-24 h-24">
              <div className="w-full h-full rounded-full bg-primary/20 blur-2xl" />
            </div>
            <div className="relative flex items-start gap-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Can't wait? Learn with AI</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Get instant feedback on your questions. Available 24/7 without booking.
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <CreditBadge credits={0.5} size="sm" />
                  <Button size="sm" variant="outline" className="rounded-full border-primary text-primary hover:bg-primary/10">
                    Start AI Session
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
