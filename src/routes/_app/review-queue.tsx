import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Check,
  X,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowUpDown,
  Eye,
  Flame,
  Shield,
  Camera as CameraIcon,
  MapPin,
  CheckSquare,
  Square,
  Inbox,
  Zap,
  TriangleAlert,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/layout/TopBar";
import { SoftCard } from "@/components/soft/SoftCard";
import { SoftBadge } from "@/components/soft/SoftBadge";
import { SoftButton } from "@/components/soft/SoftButton";
import { useVisionDetectionsContext } from "@/hooks/VisionDetectionsContext";
import { useReviewDecisions } from "@/hooks/ReviewDecisionsContext";
import { isVisionDetection } from "@/lib/vision/parser";
import { ViolationPreview } from "@/components/ViolationPreview";
import type { Detection } from "@/lib/mock/data";

export const Route = createFileRoute("/_app/review-queue")({
  head: () => ({
    meta: [
      { title: "Pending Review Queue — LitterCam AI" },
      {
        name: "description",
        content:
          "Officer action queue: new AI detections awaiting human approval or rejection.",
      },
    ],
  }),
  component: ReviewQueuePage,
});

// ── Helpers ────────────────────────────────────────────────────────

type SortField = "time" | "confidence" | "severity";
type SeverityFilter = "all" | "high" | "medium" | "low";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function fmtTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const severityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };

// ── Stat card component ────────────────────────────────────────────

function StatPill({
  icon: Icon,
  label,
  value,
  tone,
  index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  tone: "blue" | "green" | "red" | "gold";
  index: number;
}) {
  const toneClass = {
    blue: "text-brand-blue",
    green: "text-brand-green",
    red: "text-brand-red",
    gold: "text-brand-gold",
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
    >
      <SoftCard className="!p-4">
        <div className="flex items-center gap-3">
          <div
            className={`soft-pressed-sm h-10 w-10 rounded-2xl grid place-items-center shrink-0 ${toneClass}`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold truncate">
              {label}
            </div>
            <div
              className={`text-xl font-black tracking-tight tabular-nums ${toneClass}`}
            >
              {value}
            </div>
          </div>
        </div>
      </SoftCard>
    </motion.div>
  );
}

// ── Individual queue row ───────────────────────────────────────────

function QueueRow({
  d,
  index,
  isSelected,
  onToggleSelect,
  isExpanded,
  onToggleExpand,
  onApprove,
  onReject,
}: {
  d: Detection;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isVision = isVisionDetection(d);
  const visionMeta = isVision ? d.__visionMeta : null;
  const age = timeAgo(d.timestamp);

  const severityConfig = {
    high: { tone: "red" as const, icon: Flame, label: "HIGH" },
    medium: { tone: "gold" as const, icon: TriangleAlert, label: "MED" },
    low: { tone: "blue" as const, icon: Shield, label: "LOW" },
  }[d.severity];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <SoftCard hover className="!p-0 overflow-hidden mb-3">
        {/* Main row content */}
        <div className="flex items-center gap-3 p-4">
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect();
            }}
            className="soft-press shrink-0"
            aria-label={isSelected ? "Deselect" : "Select"}
          >
            {isSelected ? (
              <CheckSquare className="h-5 w-5 text-brand-blue" />
            ) : (
              <Square className="h-5 w-5 text-muted-foreground/40" />
            )}
          </button>

          {/* Severity indicator */}
          <div
            className={`soft-pressed-sm h-9 w-9 rounded-xl grid place-items-center shrink-0 ${
              {
                red: "text-brand-red",
                gold: "text-brand-gold",
                blue: "text-brand-blue",
              }[severityConfig.tone]
            }`}
          >
            <severityConfig.icon className="h-4 w-4" />
          </div>

          {/* Thumbnail */}
          <div className="soft-pressed rounded-xl h-14 w-20 shrink-0 grid place-items-center relative overflow-hidden">
            {isVision && visionMeta?.imageDataUri ? (
              <img
                src={visionMeta.imageDataUri}
                alt="Detection"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <>
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(180deg,#c9d0da,#8993a4)",
                  }}
                />
                <div className="relative text-brand-blue font-black text-[10px]">
                  {d.plate}
                </div>
              </>
            )}
            {isVision && (
              <div className="absolute top-0.5 left-0.5">
                <span className="inline-block rounded-md px-1 py-0.5 text-[7px] font-black uppercase tracking-wider bg-brand-blue/80 text-white">
                  AI
                </span>
              </div>
            )}
          </div>

          {/* Main info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm truncate">{d.litter}</span>
              <SoftBadge tone={severityConfig.tone} className="!py-0.5 !text-[9px]">
                {severityConfig.label}
              </SoftBadge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1 truncate">
                <CameraIcon className="h-3 w-3 shrink-0" />
                {d.cameraName}
              </span>
              <span className="flex items-center gap-1 truncate">
                <Clock className="h-3 w-3 shrink-0" />
                {age}
              </span>
              {d.gps !== "—" && (
                <span className="hidden sm:flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {d.gps}
                </span>
              )}
            </div>
          </div>

          {/* Confidence */}
          <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
            <span className="text-sm font-black text-brand-green tabular-nums">
              {(d.confidence * 100).toFixed(0)}%
            </span>
            <div className="soft-pressed-sm h-1.5 w-16 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${d.confidence * 100}%`,
                  background:
                    d.confidence >= 0.9
                      ? "var(--brand-green)"
                      : d.confidence >= 0.75
                        ? "var(--brand-blue)"
                        : "var(--brand-gold)",
                }}
              />
            </div>
          </div>

          {/* Plate */}
          <div className="hidden lg:block shrink-0">
            <div className="soft-pressed-sm rounded-xl px-3 py-1.5 text-[11px] font-black text-brand-blue tabular-nums">
              {d.plate}
            </div>
          </div>

          {/* Time stamp */}
          <div className="hidden xl:block text-[11px] text-muted-foreground shrink-0 w-28 text-right">
            {fmtTimestamp(d.timestamp)}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <SoftButton
              variant="success"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onApprove();
              }}
              aria-label="Approve"
              className="!h-9 !w-9 !rounded-xl"
            >
              <Check className="h-4 w-4" />
            </SoftButton>
            <SoftButton
              variant="danger"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onReject();
              }}
              aria-label="Reject"
              className="!h-9 !w-9 !rounded-xl"
            >
              <X className="h-4 w-4" />
            </SoftButton>
            <button
              onClick={onToggleExpand}
              className="soft-raised-sm soft-press rounded-xl h-9 w-9 grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand details"}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable preview */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/40 px-4 pb-4 pt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                    Full Report Preview
                  </span>
                  <Link
                    to="/violations/$id"
                    params={{ id: d.id }}
                    className="soft-raised-sm soft-press rounded-xl px-3 py-1.5 text-[11px] font-bold text-brand-blue inline-flex items-center gap-1"
                  >
                    Open Detail <Eye className="h-3 w-3" />
                  </Link>
                </div>
                <ViolationPreview detection={d} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SoftCard>
    </motion.div>
  );
}

// ── Main page component ────────────────────────────────────────────

function ReviewQueuePage() {
  const { allDetections } = useVisionDetectionsContext();
  const { decide, decideBatch } = useReviewDecisions();
  const [sortBy, setSortBy] = useState<SortField>("time");
  const [sortAsc, setSortAsc] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  // Only pending items (decisions already applied via context)
  const pending = useMemo(
    () => allDetections.filter((d) => d.status === "pending"),
    [allDetections],
  );

  // Filtered
  const filtered = useMemo(
    () =>
      severityFilter === "all"
        ? pending
        : pending.filter((d) => d.severity === severityFilter),
    [pending, severityFilter],
  );

  // Sorted
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "time") {
        cmp =
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else if (sortBy === "confidence") {
        cmp = b.confidence - a.confidence;
      } else {
        cmp =
          (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0);
      }
      return sortAsc ? -cmp : cmp;
    });
    return arr;
  }, [filtered, sortBy, sortAsc]);

  // Severity counts
  const highCount = pending.filter((d) => d.severity === "high").length;
  const medCount = pending.filter((d) => d.severity === "medium").length;
  const lowCount = pending.filter((d) => d.severity === "low").length;

  // Oldest item age
  const oldestAge =
    pending.length > 0
      ? timeAgo(
          pending.reduce((oldest, d) =>
            new Date(d.timestamp) < new Date(oldest.timestamp) ? d : oldest,
          ).timestamp,
        )
      : "—";

  // Selection helpers
  const allSelected =
    sorted.length > 0 && sorted.every((d) => selected.has(d.id));
  const someSelected = sorted.some((d) => selected.has(d.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map((d) => d.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApprove = (id: string) => {
    decide(id, "approved");
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleReject = (id: string) => {
    decide(id, "rejected");
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleBatchApprove = () => {
    decideBatch([...selected], "approved");
    setSelected(new Set());
  };

  const handleBatchReject = () => {
    decideBatch([...selected], "rejected");
    setSelected(new Set());
  };

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortAsc((v) => !v);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  return (
    <>
      <TopBar
        title="Pending review queue"
        subtitle="New detections requiring officer action — review, approve, or reject"
      />

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatPill
          icon={Inbox}
          label="Total Pending"
          value={pending.length}
          tone="gold"
          index={0}
        />
        <StatPill
          icon={Flame}
          label="High Priority"
          value={highCount}
          tone="red"
          index={1}
        />
        <StatPill
          icon={Zap}
          label="Medium Priority"
          value={medCount}
          tone="gold"
          index={2}
        />
        <StatPill
          icon={Clock}
          label="Oldest Item"
          value={oldestAge}
          tone="blue"
          index={3}
        />
      </div>

      {/* ── Toolbar ── */}
      <SoftCard className="!p-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Select all */}
          <button
            onClick={toggleAll}
            className="soft-press flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-brand-blue" />
            ) : someSelected ? (
              <CheckSquare className="h-4 w-4 text-brand-blue/40" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {allSelected
                ? "Deselect all"
                : `Select all (${sorted.length})`}
            </span>
          </button>

          <div className="h-6 w-px bg-border/60" />

          {/* Severity filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {(
              [
                { key: "all", label: "All" },
                { key: "high", label: "High" },
                { key: "medium", label: "Med" },
                { key: "low", label: "Low" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setSeverityFilter(f.key)}
                className={`soft-press rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all ${
                  severityFilter === f.key
                    ? "soft-pressed-sm text-brand-blue"
                    : "soft-raised-sm text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-border/60" />

          {/* Sort buttons */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            {(
              [
                { key: "time", label: "Newest" },
                { key: "confidence", label: "Confidence" },
                { key: "severity", label: "Severity" },
              ] as const
            ).map((s) => (
              <button
                key={s.key}
                onClick={() => toggleSort(s.key)}
                className={`soft-press rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all ${
                  sortBy === s.key
                    ? "soft-pressed-sm text-brand-blue"
                    : "soft-raised-sm text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
                {sortBy === s.key && (
                  <span className="ml-1 text-[9px]">
                    {sortAsc ? "↑" : "↓"}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Batch actions */}
          <AnimatePresence>
            {someSelected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2"
              >
                <span className="text-[11px] font-bold text-muted-foreground">
                  {selected.size} selected
                </span>
                <SoftButton
                  variant="success"
                  size="sm"
                  icon={<Check className="h-3.5 w-3.5" />}
                  onClick={handleBatchApprove}
                  className="!py-1.5 !px-3 !text-xs"
                >
                  Approve
                </SoftButton>
                <SoftButton
                  variant="danger"
                  size="sm"
                  icon={<X className="h-3.5 w-3.5" />}
                  onClick={handleBatchReject}
                  className="!py-1.5 !px-3 !text-xs"
                >
                  Reject
                </SoftButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SoftCard>

      {/* ── Disclaimer banner ── */}
      <SoftCard className="!p-3 mb-4 flex items-center gap-3">
        <div className="soft-pressed-sm h-8 w-8 rounded-xl grid place-items-center text-brand-gold shrink-0">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground">
            Officer review required.
          </span>{" "}
          AI assigns confidence and severity — no enforcement action is taken
          without human authorization. Expand any item for the full evidence
          report.
        </p>
      </SoftCard>

      {/* ── Queue list ── */}
      {sorted.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SoftCard className="text-center !py-16">
            <div className="soft-pressed h-20 w-20 rounded-3xl grid place-items-center mx-auto mb-4 text-brand-green">
              <Check className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold mb-1">Queue clear</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {severityFilter !== "all"
                ? `No ${severityFilter}-priority items pending. Try removing the filter.`
                : "All detections have been reviewed. New AI-flagged events will appear here automatically."}
            </p>
          </SoftCard>
        </motion.div>
      ) : (
        <div>
          {sorted.map((d, i) => (
            <QueueRow
              key={d.id}
              d={d}
              index={i}
              isSelected={selected.has(d.id)}
              onToggleSelect={() => toggleOne(d.id)}
              isExpanded={expanded === d.id}
              onToggleExpand={() =>
                setExpanded((prev) => (prev === d.id ? null : d.id))
              }
              onApprove={() => handleApprove(d.id)}
              onReject={() => handleReject(d.id)}
            />
          ))}

          {/* Footer count */}
          <div className="text-center py-4">
            <span className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-bold text-foreground">{sorted.length}</span>{" "}
              of{" "}
              <span className="font-bold text-foreground">
                {pending.length}
              </span>{" "}
              pending items
              {severityFilter !== "all" && (
                <span>
                  {" "}
                  ·{" "}
                  <button
                    onClick={() => setSeverityFilter("all")}
                    className="text-brand-blue font-bold hover:underline"
                  >
                    Clear filter
                  </button>
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
