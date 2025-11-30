import * as React from "react"
import { cn } from "./utils"

type ButtonVariant = "default" | "ghost" | "outline"
type ButtonSize = "default" | "icon"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer"

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-accent text-accent-foreground hover:bg-accent/90",
  ghost:
    "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-muted/30",
}

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  icon: "h-10 w-10",
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"
