## Goal
Prevent accidental or duplicate officer decisions on the violation detail page (`src/routes/_app/violations.$id.tsx`).

## Changes

### 1. Disable approve/reject once reviewed
- Compute `alreadyReviewed = v.status === "confirmed" || v.status === "dismissed"`.
- Disable the **Approve** and **Reject** `SoftButton`s when `alreadyReviewed` is true (in addition to the existing `mut.isPending`).
- Show a small helper line under the buttons when disabled: "Decision already recorded — reset to pending to change."
- Keep the existing "Reset to pending" link enabled so an officer can explicitly reopen the case; that reset does not require confirmation (it's non-destructive and already exposed).

### 2. Confirmation modal before submitting a decision
- Add a shadcn `AlertDialog` (already available in the project's ui kit) driven by local state `pending: "confirmed" | "dismissed" | null`.
- Approve/Reject buttons no longer call `mut.mutate` directly — they call `setPending("confirmed" | "dismissed")`.
- Dialog contents adapt to the pending action:
  - Approve → title "Approve this violation?", body reminds the officer the decision and their identity will be recorded with a timestamp.
  - Reject → title "Reject as false positive?", body notes the violation will be dismissed and stamped with their id/time.
- Dialog actions: **Cancel** (clears `pending`) and a confirm button ("Approve" / "Reject") that calls `mut.mutate(pending)` then clears `pending` in `onSuccess`/`onSettled`.
- Confirm button shows a pending state while `mut.isPending`.

### 3. Scope
- Only the violation detail route is touched. No server function, schema, or other page changes.
- No new dependencies (shadcn `alert-dialog` is part of the existing ui set; if missing from the project we'll add just that component file — verified during implementation).

## Technical notes
- File: `src/routes/_app/violations.$id.tsx` only.
- Import `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` from `@/components/ui/alert-dialog`.
- Use `open={pending !== null}` with `onOpenChange={(o) => !o && setPending(null)}` so Escape/overlay click cancels cleanly.
