/**
 * Event status management utilities
 * Handles status transitions: scheduled → in_progress → completed
 * Requirements: 8.1, 8.2, 8.3
 */

import type { Event } from '../db/schema'

// Valid event statuses
export const EVENT_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const
export type EventStatus = typeof EVENT_STATUSES[number]

/**
 * Determines the next status for an event based on current time
 * Status transitions:
 * - scheduled → in_progress: when now >= startDate
 * - in_progress → completed: when now >= endDate
 * - cancelled: terminal state (no transitions)
 * 
 * @param event - The event to check
 * @param now - Current time (defaults to new Date())
 * @returns The new status if a transition should occur, null otherwise
 */
export function determineEventStatusTransition(
  event: Pick<Event, 'status' | 'startDate' | 'endDate'>,
  now: Date = new Date()
): EventStatus | null {
  const { status, startDate, endDate } = event

  // Cancelled is a terminal state - no transitions
  if (status === 'cancelled') {
    return null
  }

  // Completed is a terminal state - no transitions
  if (status === 'completed') {
    return null
  }

  // scheduled → in_progress: when now >= startDate
  if (status === 'scheduled' && now >= startDate) {
    // Check if event should go directly to completed (if endDate has also passed)
    if (now >= endDate) {
      return 'completed'
    }
    return 'in_progress'
  }

  // in_progress → completed: when now >= endDate
  if (status === 'in_progress' && now >= endDate) {
    return 'completed'
  }

  // No transition needed
  return null
}

/**
 * Checks if an event should transition to in_progress status
 * @param event - The event to check
 * @param now - Current time
 * @returns true if event should become in_progress
 */
export function shouldTransitionToInProgress(
  event: Pick<Event, 'status' | 'startDate' | 'endDate'>,
  now: Date = new Date()
): boolean {
  return event.status === 'scheduled' && now >= event.startDate && now < event.endDate
}

/**
 * Checks if an event should transition to completed status
 * @param event - The event to check
 * @param now - Current time
 * @returns true if event should become completed
 */
export function shouldTransitionToCompleted(
  event: Pick<Event, 'status' | 'startDate' | 'endDate'>,
  now: Date = new Date()
): boolean {
  // Can transition from scheduled (if both start and end have passed) or from in_progress
  if (event.status === 'cancelled' || event.status === 'completed') {
    return false
  }
  return now >= event.endDate
}

/**
 * Validates that a status transition is allowed
 * Valid transitions:
 * - scheduled → in_progress
 * - scheduled → completed (if event duration has fully passed)
 * - in_progress → completed
 * - Any status → cancelled (manual only, not handled here)
 * 
 * @param fromStatus - Current status
 * @param toStatus - Target status
 * @returns true if transition is valid
 */
export function isValidStatusTransition(
  fromStatus: EventStatus,
  toStatus: EventStatus
): boolean {
  // Same status is not a transition
  if (fromStatus === toStatus) {
    return false
  }

  // Terminal states cannot transition
  if (fromStatus === 'cancelled' || fromStatus === 'completed') {
    return false
  }

  // Valid automatic transitions
  if (fromStatus === 'scheduled') {
    return toStatus === 'in_progress' || toStatus === 'completed'
  }

  if (fromStatus === 'in_progress') {
    return toStatus === 'completed'
  }

  return false
}

/**
 * Gets events that need status updates from a list
 * @param events - List of events to check
 * @param now - Current time
 * @returns Object with arrays of events needing each type of transition
 */
export function getEventsNeedingStatusUpdate(
  events: Pick<Event, 'id' | 'status' | 'startDate' | 'endDate'>[],
  now: Date = new Date()
): {
  toInProgress: Pick<Event, 'id' | 'status' | 'startDate' | 'endDate'>[]
  toCompleted: Pick<Event, 'id' | 'status' | 'startDate' | 'endDate'>[]
} {
  const toInProgress: Pick<Event, 'id' | 'status' | 'startDate' | 'endDate'>[] = []
  const toCompleted: Pick<Event, 'id' | 'status' | 'startDate' | 'endDate'>[] = []

  for (const event of events) {
    const newStatus = determineEventStatusTransition(event, now)
    
    if (newStatus === 'in_progress') {
      toInProgress.push(event)
    } else if (newStatus === 'completed') {
      toCompleted.push(event)
    }
  }

  return { toInProgress, toCompleted }
}
