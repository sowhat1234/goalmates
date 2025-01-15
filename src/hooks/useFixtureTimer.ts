import { useState, useEffect, useCallback } from 'react'
import { MatchTimer } from '@/types/fixture.types'
import { INITIAL_MATCH_MINUTES, OVERTIME_MINUTES } from '@/constants/game-rules'

interface UseFixtureTimerProps {
  fixtureId: string
  onTimeEnd?: () => void
}

export function useFixtureTimer({ fixtureId, onTimeEnd }: UseFixtureTimerProps) {
  const [timer, setTimer] = useState<MatchTimer>(() => {
    // Initialize with 0:00 for both server and client
    const initialTimer = {
      minutes: 0,
      seconds: 0,
      isRunning: false
    }

    // Only try to load saved state on client side
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`fixture_timer_${fixtureId}`)
        if (saved) {
          return JSON.parse(saved)
        }
      } catch (error) {
        console.error('Error loading timer state:', error)
      }
    }
    
    return initialTimer
  })

  const [isOvertime, setIsOvertime] = useState(false)

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`fixture_timer_${fixtureId}`, JSON.stringify(timer))
    }
  }, [timer, fixtureId])

  const adjustTime = useCallback((secondsToAdd: number) => {
    setTimer(prevTimer => {
      let newSeconds = prevTimer.seconds + secondsToAdd
      let newMinutes = prevTimer.minutes

      if (newSeconds >= 60) {
        newMinutes += Math.floor(newSeconds / 60)
        newSeconds = newSeconds % 60
      } else if (newSeconds < 0) {
        if (newMinutes > 0) {
          newMinutes--
          newSeconds = 60 + newSeconds
        } else {
          newSeconds = 0
        }
      }

      return {
        ...prevTimer,
        minutes: Math.max(0, newMinutes),
        seconds: Math.max(0, newSeconds)
      }
    })
  }, [])

  const startTimer = useCallback(() => {
    if (!timer.isRunning) {
      setTimer(prev => ({ ...prev, isRunning: true }))
    }
  }, [timer.isRunning])

  const pauseTimer = useCallback(() => {
    if (timer.isRunning) {
      setTimer(prev => ({ ...prev, isRunning: false }))
    }
  }, [timer.isRunning])

  // Handle the actual timer countdown - now counting up
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timer.isRunning) {
      interval = setInterval(() => {
        setTimer(prevTimer => {
          const newSeconds = prevTimer.seconds + 1
          if (newSeconds === 60) {
            // Check if we've reached the time limit
            const newMinutes = prevTimer.minutes + 1
            if ((!isOvertime && newMinutes >= INITIAL_MATCH_MINUTES) || 
                (isOvertime && newMinutes >= OVERTIME_MINUTES)) {
              if (interval) clearInterval(interval);
              onTimeEnd?.();
              return { ...prevTimer, isRunning: false };
            }
            return {
              ...prevTimer,
              minutes: newMinutes,
              seconds: 0
            };
          }
          return {
            ...prevTimer,
            seconds: newSeconds
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, isOvertime, onTimeEnd]);

  const setOvertimeTimer = useCallback(() => {
    setTimer({
      minutes: 0,
      seconds: 0,
      isRunning: false
    })
    setIsOvertime(true)
  }, [])

  return {
    timer,
    isOvertime,
    startTimer,
    pauseTimer,
    setOvertimeTimer,
    adjustTime
  }
} 