import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
  {
    variants: {
      variant: {
        primary: "bg-[#141414] text-white hover:bg-[#141414]/90 shadow-sm",
        secondary: "bg-white text-[#141414] border border-slate-200 hover:border-[#141414]",
        blue: "bg-[#3B82F6] text-white hover:bg-blue-500 shadow-blue-glow",
        ghost: "bg-transparent text-[#141414] hover:bg-slate-100",
        danger: "bg-red-600 text-white hover:bg-red-700",
        outline: "border-2 border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-white",
      },
      size: {
        sm: "text-xs px-3 py-2",
        md: "text-sm px-5 py-2.5",
        lg: "text-base px-7 py-3.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
