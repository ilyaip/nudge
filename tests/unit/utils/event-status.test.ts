import { describe, it, expect } from 'vitest'
import {
  determineEventStatusTransition,
  shouldTransitionToInProgress,
  shouldTransitionToCompleted,
  isValidStatusTransition,
  getEventsNeedingStatusUpdate
} from '../../../server/utils/event-status'
import type { Event } from '../../../server/db/schema'

describe('Event Status Utils', () => {
  describe('determineEventStatusTransition', () => {
    it('должен возвращать in_progress когда scheduled событие началось', () => {
      const event: Pick<Event, 'status' | 'startDate' | 'endDate'> = {
        status: 'scheduled',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T12:00:00Z')
      }
      const now = new Date('2024-01-01T10:30:00Z')

      expect(determineEventStatusTransition(event, now)).toBe('in_progress')
    })

    it('должен возвращать completed когда scheduled событие полностью прошло', () => {
      const event: Pick<Event, 'status' | 'startDate' | 'endDate'> = {
        status: 'scheduled',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T12:00:00Z')
      }
      const now = new Date('2024-01-01T13:00:00Z')

      expect(determineEventStatusTransition(event, now)).toBe('completed')
    })

    it('должен возвращать completed когда in_progress событие завершилось', () => {
      const event: Pick<Event, 'status' | 'startDate' | 'endDate'> = {
        status: 'in_progress',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T12:00:00Z')
      }
      const now = new Date('2024-01-01T12:00:00Z')

      expect(determineEventStatusTransition(event, now)).toBe('completed')
    })

    it('должен возвращать null для cancelled события', () => {
      const event: Pick<Event, 'status' | 'startDate' | 'endDate'> = {
        status: 'cancelled',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T12:00:00Z')
      }
      const now = new Date('2024-01-01T13:00:00Z')

      expect(determineEventStatusTransition(event, now)).toBeNull()
    })

    it('должен возвращать null для completed события', () => {
      const event: Pick<Event, 'status' | 'startDate' | 'endDate'> = {
        status: 'completed',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T12:00:00Z')
      }
      const now = new Date('2024-01-01T13:00:00Z')

      expect(determineEventStatusTransition(event, now)).toBeNull()
    })

    it('должен возвращать null если событие еще не началось', () => {
      const event: Pick<Event, 'status' | 'startDate' | 'endDate'> = {
        status: 'scheduled',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T12:00:00Z')
      }
      const now = new Date('2024-01-01T09:00:00Z')

      expect(determineEventStatusTransition(event, now)).toBeNull()
    })

    it('должен возвращать null если in_progress событие еще не завершилось', () => {
      const event: Pick<Event, 'status' | 'startDate' | 'endDate'> = {
        status: 'in_progress',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T12:00:00Z')
      }
      const now = new Date('2024-01-01T11:00:00Z')

      expect(determineEventStatusTransition(event, now)).toBeNull()
    })
  })

  describe('shouldTransitionToInProgress', () => {
    it('должен возвращать true для scheduled события после startDate', () => {
      const event: Pick<Event, 'status' | 'startDate' | 'endDate'> = {
        status: 'scheduled',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T12:00:00Z')
      }
      const now = new Date('2024-01-01T10:30:00Z')

      expect(shouldTransitionToInProgress(event, now)).toBe(true)
    })

    it('должен возвращать false если событие уже завершилось', () => {
      const event: Pick<Event, 'status' | 'startDate' | 'endDate'> = {
        status: 'scheduled',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T12:00:00Z')
      }
      const now = new Date('2024-01-01T13:00:00Z')

      expect(shouldTransitionToInProgress(event, now)).toBe(false)
    })

    it('должен возвращать false для не-scheduled события', () => {
      const event: Pick<Event, 'status' | 'startDate' | 'endDate'> = {
        status: 'in_progress',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T12:00:00Z')
      }
      const now = new Date('2024-01-01T10:30:00Z')

      expect(shouldTransitionToInProgress(event, now)).toBe(false)
    })
  })

  describe('shouldTransitionToCompleted', () => {
    it('должен возвращать true для in_progress события после endDate', () => {
      const event: Pick<Event, 'status' | 'startDate' | 'endDate'> = {
        status: 'in_progress',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T12:00:00Z')
      }
      const now = new Date('2024-01-01T12:00:00Z')

      expect(shouldTransitionToCompleted(event, now)).toBe(true)
    })

    it('должен возвращать true для scheduled события после endDate', () => {
      const event: Pick<Event, 'status' | 'startDate' | 'endDate'> = {
        status: 'scheduled',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T12:00:00Z')
      }
      const now = new Date('2024-01-01T13:00:00Z')

      expect(shouldTransitionToCompleted(event, now)).toBe(true)
    })

    it('должен возвращать false для cancelled события', () => {
      const event: Pick<Event, 'status' | 'startDate' | 'endDate'> = {
        status: 'cancelled',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T12:00:00Z')
      }
      const now = new Date('2024-01-01T13:00:00Z')

      expect(shouldTransitionToCompleted(event, now)).toBe(false)
    })

    it('должен возвращать false для completed события', () => {
      const event: Pick<Event, 'status' | 'startDate' | 'endDate'> = {
        status: 'completed',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T12:00:00Z')
      }
      const now = new Date('2024-01-01T13:00:00Z')

      expect(shouldTransitionToCompleted(event, now)).toBe(false)
    })
  })

  describe('isValidStatusTransition', () => {
    it('должен разрешать scheduled → in_progress', () => {
      expect(isValidStatusTransition('scheduled', 'in_progress')).toBe(true)
    })

    it('должен разрешать scheduled → completed', () => {
      expect(isValidStatusTransition('scheduled', 'completed')).toBe(true)
    })

    it('должен разрешать in_progress → completed', () => {
      expect(isValidStatusTransition('in_progress', 'completed')).toBe(true)
    })

    it('должен запрещать переходы из cancelled', () => {
      expect(isValidStatusTransition('cancelled', 'scheduled')).toBe(false)
      expect(isValidStatusTransition('cancelled', 'in_progress')).toBe(false)
      expect(isValidStatusTransition('cancelled', 'completed')).toBe(false)
    })

    it('должен запрещать переходы из completed', () => {
      expect(isValidStatusTransition('completed', 'scheduled')).toBe(false)
      expect(isValidStatusTransition('completed', 'in_progress')).toBe(false)
      expect(isValidStatusTransition('completed', 'cancelled')).toBe(false)
    })

    it('должен запрещать переход в тот же статус', () => {
      expect(isValidStatusTransition('scheduled', 'scheduled')).toBe(false)
      expect(isValidStatusTransition('in_progress', 'in_progress')).toBe(false)
    })

    it('должен запрещать in_progress → scheduled', () => {
      expect(isValidStatusTransition('in_progress', 'scheduled')).toBe(false)
    })
  })

  describe('getEventsNeedingStatusUpdate', () => {
    it('должен корректно группировать события по типу перехода', () => {
      const events: Pick<Event, 'id' | 'status' | 'startDate' | 'endDate'>[] = [
        {
          id: 1,
          status: 'scheduled',
          startDate: new Date('2024-01-01T10:00:00Z'),
          endDate: new Date('2024-01-01T12:00:00Z')
        },
        {
          id: 2,
          status: 'in_progress',
          startDate: new Date('2024-01-01T08:00:00Z'),
          endDate: new Date('2024-01-01T10:00:00Z')
        },
        {
          id: 3,
          status: 'scheduled',
          startDate: new Date('2024-01-01T14:00:00Z'),
          endDate: new Date('2024-01-01T16:00:00Z')
        },
        {
          id: 4,
          status: 'cancelled',
          startDate: new Date('2024-01-01T10:00:00Z'),
          endDate: new Date('2024-01-01T12:00:00Z')
        }
      ]
      const now = new Date('2024-01-01T11:00:00Z')

      const result = getEventsNeedingStatusUpdate(events, now)

      expect(result.toInProgress).toHaveLength(1)
      expect(result.toInProgress[0].id).toBe(1)

      expect(result.toCompleted).toHaveLength(1)
      expect(result.toCompleted[0].id).toBe(2)
    })

    it('должен возвращать пустые массивы если нет событий для обновления', () => {
      const events: Pick<Event, 'id' | 'status' | 'startDate' | 'endDate'>[] = [
        {
          id: 1,
          status: 'scheduled',
          startDate: new Date('2024-01-01T14:00:00Z'),
          endDate: new Date('2024-01-01T16:00:00Z')
        }
      ]
      const now = new Date('2024-01-01T10:00:00Z')

      const result = getEventsNeedingStatusUpdate(events, now)

      expect(result.toInProgress).toHaveLength(0)
      expect(result.toCompleted).toHaveLength(0)
    })

    it('должен переводить scheduled событие сразу в completed если оно полностью прошло', () => {
      const events: Pick<Event, 'id' | 'status' | 'startDate' | 'endDate'>[] = [
        {
          id: 1,
          status: 'scheduled',
          startDate: new Date('2024-01-01T08:00:00Z'),
          endDate: new Date('2024-01-01T10:00:00Z')
        }
      ]
      const now = new Date('2024-01-01T12:00:00Z')

      const result = getEventsNeedingStatusUpdate(events, now)

      expect(result.toInProgress).toHaveLength(0)
      expect(result.toCompleted).toHaveLength(1)
      expect(result.toCompleted[0].id).toBe(1)
    })
  })
})
