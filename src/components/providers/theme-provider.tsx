"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

type Attribute = 'class' | 'data-theme' | 'data-mode'

export function ThemeProvider({ 
  children, 
  ...props 
}: { 
  children: React.ReactNode 
  defaultTheme?: string
  storageKey?: string
  attribute?: Attribute | Attribute[]
  value?: { 
    light: string
    dark: string
    system: string 
  }
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
} 