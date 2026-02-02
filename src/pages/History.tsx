import { ArrowUpRight, ArrowDownLeft, Coins, Sparkles } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditHistory } from "@/hooks/useCreditHistory";
import { format, isToday, isYesterday } from "date-fns";

const History = () => {
  const { profile } = useAuth();
  const { transactions, loading } = useCreditHistory();
  
  const currentBalance = profile?.credits ?? 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return `Today, ${format(date, "h:mm a")}`;
    if (isYesterday(date)) return `Yesterday, ${format(date, "h:mm a")}`;
    return format(date, "MMM d, h:mm a");
  };

  const getTransactionIcon = (type: string, amount: number) => {
    if (type === "ai_session") {
      return <Sparkles className="h-5 w-5 text-primary" />;
    }
    if (type === "welcome_bonus" || type === "top_up") {
      return <Coins className="h-5 w-5 text-warning" />;
    }
    if (amount > 0) {
      return <ArrowDownLeft className="h-5 w-5 text-success" />;
    }
    return <ArrowUpRight className="h-5 w-5 text-destructive" />;
  };

  const getTransactionTitle = (type: string, description: string | null) => {
    switch (type) {
      case "teaching":
        return "Taught Session";
      case "learning":
        return "Learning Session";
      case "ai_session":
        return "AI Learning Session";
      case "welcome_bonus":
        return "Welcome Bonus";
      case "top_up":
        return "Credit Top Up";
      default:
        return description || "Transaction";
    }
  };

  return (
    <AppLayout title="Credit History">
      <div className="px-4 py-6 space-y-6">
        {/* Balance card */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-card via-card to-secondary border border-border/50 animate-scale-in">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
          <div className="relative text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Current Balance</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Coins className="h-8 w-8 text-primary" />
              <span className="text-5xl font-bold gradient-text">{currentBalance}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Skill Credits</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <button className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
            All
          </button>
          <button className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
            Earned
          </button>
          <button className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
            Spent
          </button>
        </div>

        {/* Transaction list */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Transactions
          </h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-card animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-card border border-border/50 text-center">
              <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start teaching or learning to see your credit history
              </p>
            </div>
          ) : (
            transactions.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 animate-fade-in"
                style={{ animationDelay: `${0.15 + i * 0.05}s` }}
              >
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                  item.amount > 0 ? "bg-success/10" : "bg-destructive/10"
                )}>
                  {getTransactionIcon(item.type, item.amount)}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground">
                    {getTransactionTitle(item.type, item.description)}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {item.description || item.type}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(item.created_at)}
                  </p>
                </div>

                <div className={cn(
                  "text-lg font-bold",
                  item.amount > 0 ? "text-success" : "text-foreground"
                )}>
                  {item.amount > 0 ? "+" : ""}{item.amount}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default History;
