"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { partyMemberSchema, type PartyMemberInput, RELATIONSHIP_OPTIONS } from "@/lib/validations/itinerary";
import { addPartyMember } from "@/actions/party";

export function AddPartyMemberDialog({ boardMemberId }: { boardMemberId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PartyMemberInput>({
    resolver: zodResolver(partyMemberSchema),
  });

  const onSubmit = (data: PartyMemberInput) => {
    startTransition(async () => {
      const result = await addPartyMember(boardMemberId, data.name, data.relationship);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${data.name} added`);
        reset();
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="h-9 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-all flex items-center gap-1.5 shadow-sm">
        <Plus className="h-3.5 w-3.5" /> Add Member
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Party Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div>
            <label htmlFor="pm-name" className="text-sm font-medium text-gray-700">Full Name</label>
            <input
              id="pm-name"
              className="mt-1.5 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
              placeholder="Enter full name"
              {...register("name")}
            />
            {errors.name && <p className="text-[13px] text-red-600 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="pm-relationship" className="text-sm font-medium text-gray-700">Relationship</label>
            <select
              id="pm-relationship"
              className="mt-1.5 w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
              {...register("relationship")}
            >
              <option value="">Select...</option>
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.relationship && <p className="text-[13px] text-red-600 mt-1">{errors.relationship.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="h-9 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1.5">
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Add
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
