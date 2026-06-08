import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-2xl border text-card-foreground transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-border/70 bg-card shadow-sm",
        elevated:
          "border-border/60 bg-card shadow-[0_10px_30px_hsl(var(--foreground)/0.06)]",
        muted:
          "border-border/60 bg-card/80 backdrop-blur-sm shadow-sm",
        film:
          "border-border/60 bg-gradient-to-b from-card to-muted/40 shadow-sm",
        field:
          "border-primary/10 bg-card shadow-sm [background-image:linear-gradient(hsl(var(--primary)/0.06)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.06)_1px,transparent_1px)] [background-size:24px_24px]",
      },
      size: {
        default: "",
        sm: "rounded-xl",
        lg: "rounded-[1.25rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const cardSectionVariants = cva("", {
  variants: {
    spacing: {
      default: "p-6",
      sm: "p-4",
      lg: "p-7",
    },
  },
  defaultVariants: {
    spacing: "default",
  },
})

const Card = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size }), className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef(
  ({ className, spacing, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-1.5",
        cardSectionVariants({ spacing }),
        className
      )}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "font-heading text-base font-semibold leading-none tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "text-sm leading-6 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(
  ({ className, spacing, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "pt-0",
        cardSectionVariants({ spacing }),
        className
      )}
      {...props}
    />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(
  ({ className, spacing, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center pt-0",
        cardSectionVariants({ spacing }),
        className
      )}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
}