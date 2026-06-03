"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  className?: string
}

export function ColorPicker({ color, onChange, className = "" }: ColorPickerProps) {
  const [currentColor, setCurrentColor] = useState(color || "#000000")

  useEffect(() => {
    setCurrentColor(color || "#000000")
  }, [color])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setCurrentColor(newColor)
    onChange(newColor)
  }

  return (
    <div className={`relative w-8 h-8 rounded overflow-hidden border border-gray-700 shrink-0 shadow-sm ${className}`}>
      <input
        type="color"
        value={currentColor}
        onChange={handleChange}
        className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer opacity-0"
      />
      <div 
        className="w-full h-full pointer-events-none" 
        style={{ backgroundColor: currentColor }} 
      />
    </div>
  )
}
