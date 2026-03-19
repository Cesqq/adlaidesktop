import { WizardCard } from "../WizardCard";
import { Monitor, Apple, Terminal } from "lucide-react";
import type { OS, WindowsMode } from "@/types/wizard";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  os: OS | null;
  windowsMode: WindowsMode | null;
  onOsChange: (os: OS) => void;
  onWindowsModeChange: (mode: WindowsMode) => void;
}

export function EnvironmentStep({ os, windowsMode, onOsChange, onWindowsModeChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">What's your operating system?</h2>
        <p className="mt-1 text-muted-foreground">We'll tailor the setup instructions for your platform.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <WizardCard
          title="Windows"
          description="Windows 10/11"
          icon={<Monitor className="h-5 w-5" />}
          selected={os === 'windows'}
          onClick={() => onOsChange('windows')}
        />
        <WizardCard
          title="macOS"
          description="Apple Silicon or Intel"
          icon={<Apple className="h-5 w-5" />}
          selected={os === 'macos'}
          onClick={() => onOsChange('macos')}
        />
        <WizardCard
          title="Linux"
          description="Ubuntu, Debian, Fedora, etc."
          icon={<Terminal className="h-5 w-5" />}
          selected={os === 'linux'}
          onClick={() => onOsChange('linux')}
        />
      </div>

      <AnimatePresence>
        {os === 'windows' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-2">
              <h3 className="font-heading text-lg font-semibold text-foreground">How do you want to run your agent on Windows?</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <WizardCard
                  title="WSL2"
                  description="OpenClaw strongly recommends WSL2 on Windows. Best compatibility."
                  icon={<Terminal className="h-5 w-5" />}
                  selected={windowsMode === 'wsl2'}
                  badge={{ label: "Recommended", color: "green" }}
                  onClick={() => onWindowsModeChange('wsl2')}
                />
                <WizardCard
                  title="PowerShell"
                  description="Works but may have PATH issues. Open new terminal after install."
                  icon={<Monitor className="h-5 w-5" />}
                  selected={windowsMode === 'powershell'}
                  badge={{ label: "Advanced", color: "amber" }}
                  onClick={() => onWindowsModeChange('powershell')}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
