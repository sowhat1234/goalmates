'use client'

interface OvertimePromptProps {
  show: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function OvertimePrompt({ show, onCancel, onConfirm }: OvertimePromptProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Match Tied!</h3>
        <p className="mb-4 text-gray-700">Would you like to go into overtime?</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Start Overtime
          </button>
        </div>
      </div>
    </div>
  )
} 