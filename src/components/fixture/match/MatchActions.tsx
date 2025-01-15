import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'

interface MatchActionsProps {
  onEndMatch: () => void
  onEndFixture: () => void
}

export function MatchActions({ onEndMatch, onEndFixture }: MatchActionsProps) {
  const [showEndFixtureDialog, setShowEndFixtureDialog] = useState(false)

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
      <div className="container mx-auto max-w-4xl flex justify-center space-x-4">
        <button
          onClick={onEndMatch}
          className="bg-red-600 text-white py-3 px-8 rounded-lg hover:bg-red-700 transition-colors font-semibold"
        >
          End Match & Select Winner
        </button>
        <button
          onClick={() => setShowEndFixtureDialog(true)}
          className="bg-gray-600 text-white py-3 px-8 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
        >
          End Fixture
        </button>
      </div>

      <Dialog show={showEndFixtureDialog} onClose={() => setShowEndFixtureDialog(false)}>
        <h3 className="text-lg font-semibold mb-4">End Fixture</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to end this fixture? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowEndFixtureDialog(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onEndFixture()
              setShowEndFixtureDialog(false)
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            End Fixture
          </button>
        </div>
      </Dialog>
    </div>
  )
} 