import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const reasons = [
  "Inappropriate behavior",
  "Nudity / Sexual content",
  "Harassment / Bullying",
  "Spam / Scam",
  "Other",
];

const ReportDialog = ({ open, onOpenChange }: ReportDialogProps) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = () => {
    if (!reason) return;
    toast({
      title: "Report submitted",
      description: "Thank you for helping keep the community safe.",
    });
    setReason("");
    setDetails("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Report User</DialogTitle>
          <DialogDescription>
            Help us keep the community safe by reporting inappropriate behavior.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
            {reasons.map((r) => (
              <div key={r} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50">
                <RadioGroupItem value={r} id={r} />
                <Label htmlFor={r} className="cursor-pointer text-sm">{r}</Label>
              </div>
            ))}
          </RadioGroup>

          <Textarea
            placeholder="Additional details (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="bg-secondary border-border resize-none"
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
          >
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
