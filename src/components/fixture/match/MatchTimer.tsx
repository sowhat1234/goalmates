'use client'

import { FaPlay, FaPause, FaForward, FaBackward } from 'react-icons/fa'
import { MatchTimer as MatchTimerType } from '@/types/fixture.types'

interface MatchTimerProps {
  timer: MatchTimerType
  fixtureStatus: string
  isOvertime: boolean
  onStartTimer: () => void
  onPauseTimer: () => void
  onAdjustTime: (seconds: number) => void
}

export function MatchTimer({
  timer,
  fixtureStatus,
  isOvertime,
  onStartTimer,
  onPauseTimer,
  onAdjustTime
}: MatchTimerProps) {
  const formattedTime = `${timer.minutes.toString().padStart(2, '0')}:${timer.seconds.toString().padStart(2, '0')}`

  return (
    <div className="flex flex-col items-center">
      <div className="bg-gray-800 rounded-lg px-6 py-3 shadow-lg">
        <div className="flex items-center gap-4">
          {fixtureStatus === 'IN_PROGRESS' && (
            <>
              <button
                onClick={() => onAdjustTime(-10)}
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Backward 10 seconds"
              >
                <FaBackward className="w-5 h-5" />
              </button>

              {timer.isRunning ? (
                <button
                  onClick={onPauseTimer}
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Pause timer"
                >
                  <FaPause className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={onStartTimer}
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Start timer"
                >
                  <FaPlay className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => onAdjustTime(10)}
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Forward 10 seconds"
              >
                <FaForward className="w-5 h-5" />
              </button>
            </>
          )}

          <div className="text-3xl font-mono font-bold text-white">
            {formattedTime}
            {/* Overtime feature temporarily disabled
            {isOvertime && <span className="ml-2 text-yellow-400">OT</span>}
            */}
          </div>
        </div>
      </div>
    </div>
  )
} 