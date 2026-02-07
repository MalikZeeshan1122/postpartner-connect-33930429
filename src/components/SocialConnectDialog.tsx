import { useState } from "react";
import { socialIcons } from "@/components/icons/SocialIcons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ExternalLink, Loader2, Shield } from "lucide-react";

interface SocialConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: {
    platform: string;
    label: string;
    color: string;
    placeholder: string;
    helpUrl: string;
    helpText: string;
  } | null;
  onConnect: (platform: string, accountName: string) => Promise<void>;
}

export default function SocialConnectDialog({
  open,
  onOpenChange,
  platform,
  onConnect,
}: SocialConnectDialogProps) {
  const [accountName, setAccountName] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConnect = async () => {
    if (!platform || !accountName.trim()) return;
    setConnecting(true);

    // Simulate OAuth-like delay
    await new Promise((r) => setTimeout(r, 1200));
    await onConnect(platform.platform, accountName.trim());

    setConnecting(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setAccountName("");
      onOpenChange(false);
    }, 1000);
  };

  const handleClose = (val: boolean) => {
    if (!connecting) {
      setAccountName("");
      setSuccess(false);
      onOpenChange(val);
    }
  };

  if (!platform) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${platform.color}`}
            >
              {socialIcons[platform.platform]
                ? socialIcons[platform.platform]({ className: "h-5 w-5 text-white" })
                : <span className="text-lg font-bold text-white">{platform.platform[0].toUpperCase()}</span>
              }
            </div>
            <div>
              <DialogTitle>Connect {platform.label}</DialogTitle>
              <DialogDescription className="mt-0.5">
                Link your account to create & schedule content.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <p className="font-semibold">Connected successfully!</p>
            <p className="text-sm text-muted-foreground">@{accountName}</p>
          </div>
        ) : connecting ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Connecting to {platform.label}...
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="account-name">
                {platform.platform === "youtube"
                  ? "Channel URL or handle"
                  : "Username or profile URL"}
              </Label>
              <Input
                id="account-name"
                placeholder={platform.placeholder}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              />
            </div>

            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {platform.helpText}
              </p>
              <a
                href={platform.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Learn more <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <Button
              onClick={handleConnect}
              disabled={!accountName.trim()}
              className="w-full gradient-primary"
            >
              Connect Account
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              <span>We never store your password</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
