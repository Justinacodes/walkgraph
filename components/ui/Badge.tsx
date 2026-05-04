import { cn } from "@/lib/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center font-mono text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-600",
        blue: "bg-blue-50 text-blue-700",
        green: "bg-emerald-50 text-emerald-700",
        yellow: "bg-amber-50 text-amber-700",
        red: "bg-red-50 text-red-700",
        ink: "bg-[#141414] text-white",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  children,
  className,
  variant,
}: React.PropsWithChildren<VariantProps<typeof badgeVariants> & { className?: string }>) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>;
}

export function BuildingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "green" | "yellow" | "red" | "blue" | "ink" }> = {
    DRAFT: { label: "Draft", variant: "yellow" },
    PUBLISHED: { label: "Published", variant: "green" },
    ARCHIVED: { label: "Archived", variant: "default" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "default" };
  return <Badge variant={variant}>{label}</Badge>;
}

export function NodeTypeBadge({ type }: { type: string }) {
  const colors: Record<string, "blue" | "green" | "red" | "yellow" | "default"> = {
    ENTRANCE: "green",
    EXIT: "red",
    EMERGENCY_EXIT: "red",
    RESTRICTED_AREA: "red",
    ELEVATOR: "blue",
    STAIRCASE: "blue",
    RAMP: "blue",
    ROOM: "default",
    OFFICE: "default",
    LECTURE_HALL: "default",
    RESTROOM: "default",
    RECEPTION: "yellow",
    LANDMARK: "yellow",
  };
  const label = type.replace(/_/g, " ");
  return <Badge variant={colors[type] ?? "default"}>{label}</Badge>;
}
