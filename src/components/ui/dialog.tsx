import React from 'react'

interface DialogProps {
  children: React.ReactNode
  show: boolean
  onClose: () => void
}

export function Dialog({ children, show, onClose }: DialogProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        {children}
      </div>
    </div>
  )
} 