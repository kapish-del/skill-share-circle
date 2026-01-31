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

const hotTopics = [
  "Photography", "Public Speaking", "UI/UX Design", "Python", "Guitar", "Cooking"
];

const upcomingSessions = [
  {
    tutorName: "Sarah J.",
    topic: "Intro to UX Design",
    date: "Today",
    time: "4:00 PM",
    duration: "1 hour",
    status: "upcoming" as const,
  },
  {
    tutorName: "Michael R.",
    topic: "Advanced Python",
    date: "Tomorrow",
    time: "2:00 PM",
    duration: "45 min",
    status: "upcoming" as const,
  },
];

const activeRequests = [
  {
    name: "Spanish Tutor",
    topic: "Conversational Spanish",
    message: "Perfect! 2 hours ago",
    timeAgo: "2h",
    type: "outgoing" as const,
    status: "pending" as const,
  },
  {
    name: "Chess Lessons",
    topic: "Chess Strategy",
    message: "Posted 1 day ago",
    timeAgo: "1d",
    type: "incoming" as const,
    status: "pending" as const,
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const firstName = profile?.name?.split(' ')[0] || 'there';
  const credits = profile?.credits ?? 0;

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
            >
              <Plus className="h-4 w-4 mr-1" />
              Top Up
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
            <button className="text-sm text-primary hover:underline">See all</button>
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
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              View all
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {upcomingSessions.map((session, i) => (
              <SessionCard key={i} {...session} />
            ))}
          </div>
        </section>

        {/* Active Requests */}
        <section className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Active Requests</h3>
            <button className="text-sm text-primary hover:underline">See all</button>
          </div>
          <div className="space-y-3">
            {activeRequests.map((request, i) => (
              <RequestCard key={i} {...request} />
            ))}
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
