import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Cpu, Wand2, Kanban, Puzzle, KeyRound, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import mascotHero from "@/assets/mascot-hero.png";
import mascotWelcome from "@/assets/mascot-welcome.png";

const features = [
  {
    icon: Wand2,
    title: "Guided Setup Wizard",
    description: "Answer a few questions. We generate your config, check prerequisites, and walk you through every step.",
  },
  {
    icon: Kanban,
    title: "Visual Kanban Board",
    description: "Track every setup step across six stages: Plan → Ready → Needs Info → Setup → Validate → Live.",
  },
  {
    icon: Shield,
    title: "Security-First Configuration",
    description: "Allowlists, token auth, loopback-only binding — configured correctly from the start. Zero secrets stored in the cloud.",
  },
  {
    icon: Puzzle,
    title: "Multi-Agent Support",
    description: "OpenClaw, ZeroClaw, Nanobot, and more. One studio for every framework in the Claw ecosystem.",
  },
  {
    icon: KeyRound,
    title: "Smart Credential Management",
    description: "API keys stored in your OS keychain — never in our database. We only track what keys you need, not what they are.",
  },
  {
    icon: Rocket,
    title: "Premium: AI Setup Architect",
    description: "Lumina's AI generates custom setup blueprints tailored to your hardware, use case, and security requirements. $25/mo.",
  },
];

const agents = [
  { name: "OpenClaw", slug: "openclaw", description: "The original. 300K+ stars. Full-featured AI assistant.", language: "Node.js", status: "Supported" as const, color: "hsl(265, 70%, 60%)" },
  { name: "ZeroClaw", slug: "zeroclaw", description: "Ultra-lightweight Rust runtime. Under 5MB.", language: "Rust", status: "Supported" as const, color: "hsl(20, 85%, 55%)" },
  { name: "Nanobot", slug: "nanobot", description: "OpenClaw in 4,000 lines of Python.", language: "Python", status: "Supported" as const, color: "hsl(190, 85%, 55%)" },
  { name: "NanoClaw", slug: "nanoclaw", description: "Security-first with Docker container isolation.", language: "TypeScript", status: "Coming Soon" as const, color: "hsl(340, 75%, 55%)" },
  { name: "PicoClaw", slug: "picoclaw", description: "Built for IoT and embedded devices.", language: "Go", status: "Coming Soon" as const, color: "hsl(160, 84%, 39%)" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={mascotHero} alt="Adl._.Ai Studio" className="h-8 w-8 object-contain" />
            <span className="font-mono text-base font-semibold text-foreground">Adl._.Ai</span>
            <span className="text-base font-normal text-foreground">Studio</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About OpenClaw</a>
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
          </nav>
          <Link to="/signup" className="md:hidden">
            <Button size="sm" className="gradient-primary border-0 text-primary-foreground">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(260,60%,65%,0.08)_0%,_transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(190,85%,55%,0.05)_0%,_transparent_60%)]" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="container relative z-10 flex flex-col items-center gap-8 lg:flex-row lg:gap-16"
        >
          <div className="flex-1 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground">
              <Cpu className="h-3.5 w-3.5 text-primary" />
              Visual Command Center for AI Agents
            </div>
            <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Your AI Agents,
              <span className="block text-primary">Set Up in Minutes</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground mx-auto lg:mx-0">
              <span className="font-mono font-semibold text-foreground">Adl._.Ai</span>{" "}
              <span className="text-foreground">Studio</span> is the visual command center for installing, configuring, and managing open-source AI agents. No terminal required.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link to="/new-project">
                <Button size="lg" className="gradient-primary border-0 px-8 text-primary-foreground">
                  Start Free Setup <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="px-8">
                  View Demo
                </Button>
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Supports <span className="text-foreground/80">OpenClaw</span> · <span className="text-foreground/80">ZeroClaw</span> · <span className="text-foreground/80">NanoClaw</span> · <span className="text-foreground/80">Nanobot</span> · and more
            </p>
            <p className="text-xs text-muted-foreground/60">
              by Lumina
            </p>
          </div>
          {/* Hero mascot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            className="flex-shrink-0 w-64 sm:w-72 lg:w-80"
          >
            <img
              src={mascotWelcome}
              alt="Adl._.Ai Studio mascot welcoming you"
              className="w-full h-auto drop-shadow-[0_0_40px_hsl(260,60%,65%,0.3)]"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Choose Your Agent */}
      <section id="agents" className="py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground">One Studio. Every Agent.</h2>
            <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
              <span className="font-mono font-semibold text-foreground">Adl._.Ai</span>{" "}
              <span className="text-foreground">Studio</span> supports the full Claw family and beyond. Pick your framework, and we handle the rest.
            </p>
          </div>
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-5"
          >
            {agents.map((agent) => {
              const isSupported = agent.status === "Supported";
              const cardContent = (
                <motion.div
                  key={agent.name}
                  variants={item}
                  className={cn(
                    "group relative flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center transition-all duration-300",
                    isSupported
                      ? "hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_24px_hsl(265,70%,60%,0.15)] cursor-pointer"
                      : "opacity-70 cursor-default"
                  )}
                >
                  {/* Icon placeholder */}
                  <div
                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-primary-foreground"
                    style={{ background: agent.color }}
                  >
                    {agent.name[0]}
                  </div>
                  <h3 className="font-heading text-base font-semibold text-foreground">{agent.name}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{agent.description}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {agent.language}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                        isSupported
                          ? "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]"
                          : "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]"
                      )}
                    >
                      {agent.status}
                    </span>
                  </div>
                </motion.div>
              );

              if (isSupported) {
                return (
                  <Link key={agent.name} to={`/new-project?framework=${agent.slug}`}>
                    {cardContent}
                  </Link>
                );
              }

              return (
                <Tooltip key={agent.name}>
                  <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
                  <TooltipContent>Join the waitlist</TooltipContent>
                </Tooltip>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground">Setup Without the Terminal</h2>
            <p className="mt-3 text-muted-foreground">Everything you need to go from zero to running AI agent — visually.</p>
          </div>
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={item}
                className="rounded-2xl border border-border bg-card p-8 flex flex-col"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About OpenClaw */}
      <section id="about" className="border-t border-border py-24">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground">What is OpenClaw?</h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            OpenClaw is an open-source AI agent framework with over 300K+ GitHub stars. It lets you build autonomous agents that can browse the web, write code, manage files, and interact with APIs.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            <strong className="text-foreground">This app is not OpenClaw itself.</strong> It's a free visual setup studio by Lumina that guides you through installing, configuring, and verifying OpenClaw — safely and successfully.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <img src={mascotHero} alt="Adl._.Ai Studio" className="h-6 w-6 object-contain" />
            <span className="font-mono text-sm font-semibold text-foreground">Adl._.Ai</span>
            <span className="text-sm font-normal text-foreground">Studio</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <a href="https://github.com" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </nav>
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Adl._.Ai Studio · by Lumina
            </p>
            <p className="text-xs text-muted-foreground/70">
              Part of the Lumina AI consulting ecosystem
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
