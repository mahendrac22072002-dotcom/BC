import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";
import { Send, Loader2 } from "lucide-react";
import { errMessage } from "@/lib/format";

type Listing = Database["public"]["Tables"]["listings"]["Row"];

export function DealRequestModal({ listing, requestingBrokerId }: { listing: Listing, requestingBrokerId: string }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const [form, setForm] = useState({
    offer_price: listing.price ? listing.price.toString() : "",
    commission_proposal: "",
    message: "",
    notes: "",
    expected_closing_date: "",
  });

  const submitRequest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("deal_requests").insert({
        property_id: listing.id,
        listing_broker_id: listing.broker_id,
        requesting_broker_id: requestingBrokerId,
        offer_price: form.offer_price ? Number(form.offer_price) : null,
        commission_proposal: form.commission_proposal,
        message: form.message,
        notes: form.notes,
        expected_closing_date: form.expected_closing_date || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deal Request Sent");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["deal_requests"] });
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <Send className="h-4 w-4" /> Send Deal Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Deal Request</DialogTitle>
          <DialogDescription>
            Propose a deal for <strong>{listing.title}</strong> to the listing broker.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            submitRequest.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="offer_price">Offer Price (₹) *</Label>
              <Input
                id="offer_price"
                type="number"
                required
                value={form.offer_price}
                onChange={e => set("offer_price", e.target.value)}
                placeholder="e.g. 25000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission_proposal">Commission Proposal *</Label>
              <Input
                id="commission_proposal"
                required
                value={form.commission_proposal}
                onChange={e => set("commission_proposal", e.target.value)}
                placeholder="e.g. 50/50 split"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              required
              rows={3}
              value={form.message}
              onChange={e => set("message", e.target.value)}
              placeholder="Introduce your buyer's requirements..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              rows={2}
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="Any specific terms or requests?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_closing_date">Expected Closing Date (Optional)</Label>
            <Input
              id="expected_closing_date"
              type="date"
              value={form.expected_closing_date}
              onChange={e => set("expected_closing_date", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitRequest.isPending}>
              {submitRequest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
