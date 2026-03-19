import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Check } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { motion } from "framer-motion";

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const { refresh } = useSubscription();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          navigate("/projects", { replace: true });
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate, refresh]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center space-y-6 max-w-md"
      >
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-premium/20 border-2 border-premium/40"
        >
          <Check className="h-10 w-10 text-premium" strokeWidth={3} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-center gap-2">
            <Crown className="h-5 w-5 text-premium" />
            <h1 className="font-heading text-2xl font-bold text-foreground">Welcome to Lumina Premium!</h1>
          </div>
          <p className="text-muted-foreground">
            Your subscription is now active. All premium features are unlocked.
          </p>
        </motion.div>

        {/* Sparkle particles */}
        <div className="relative h-8">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-premium"
              initial={{ opacity: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                y: [-20, -40 - i * 8],
                x: [0, (i % 2 === 0 ? 1 : -1) * (10 + i * 12)],
              }}
              transition={{ delay: 0.3 + i * 0.1, duration: 1.2, ease: "easeOut" }}
              style={{ left: "50%" }}
            />
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Redirecting to dashboard in {countdown}…
        </p>
      </motion.div>
    </div>
  );
}
