import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommandBlock } from "@/components/board/CommandBlock";
import { VERIFICATION_COMMANDS, TRIAGE_SEQUENCE } from "@/data/stepContent";

export default function VerificationCenter() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Verification Center
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          All diagnostic commands in one place. Run these to verify your OpenClaw setup.
        </p>
      </div>

      {/* Triage Sequence */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recommended Triage Sequence</CardTitle>
          <p className="text-xs text-muted-foreground">When something's wrong, run these in order.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {TRIAGE_SEQUENCE.map((t) => (
            <div key={t.step} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {t.step}
              </span>
              <div className="flex-1 space-y-1">
                <CommandBlock command={t.command} />
                <p className="text-xs text-muted-foreground">{t.purpose}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* All Commands Grid */}
      <div>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">All Diagnostic Commands</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {VERIFICATION_COMMANDS.map((vc) => (
            <Card key={vc.command} className="hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 flex-wrap">
                  {vc.description}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CommandBlock command={vc.command} />
                <p className="text-xs text-muted-foreground">{vc.whatItChecks}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <Badge variant="outline" className="mb-1 text-[10px] border-[hsl(var(--success))]/40 text-[hsl(var(--success))]">
                      Healthy
                    </Badge>
                    <p className="text-muted-foreground">{vc.healthy}</p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-1 text-[10px] border-destructive/40 text-destructive">
                      Broken
                    </Badge>
                    <p className="text-muted-foreground">{vc.broken}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
