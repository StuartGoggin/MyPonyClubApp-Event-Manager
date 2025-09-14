"use client"

import * as React from "react"
import { ChevronDown, ChevronRight, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface HelpSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  variant?: "default" | "info" | "warning" | "success"
  className?: string
}

export function HelpSection({ 
  title, 
  children, 
  defaultOpen = false,
  variant = "default",
  className 
}: HelpSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  const variantStyles = {
    default: "border-border bg-muted/30",
    info: "border-blue-200 bg-blue-50/50",
    warning: "border-amber-200 bg-amber-50/50", 
    success: "border-green-200 bg-green-50/50"
  }

  const iconColors = {
    default: "text-muted-foreground",
    info: "text-blue-600",
    warning: "text-amber-600",
    success: "text-green-600"
  }

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className={cn("border rounded-lg", variantStyles[variant], className)}
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left hover:bg-background/50 transition-colors">
        <div className="flex items-center gap-2">
          <Info className={cn("h-4 w-4", iconColors[variant])} />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <div className="text-sm text-muted-foreground space-y-2">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}