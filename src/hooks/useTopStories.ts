import { useEffect, useState } from 'react'
import { fetchTopStories } from '../api/hackerNews'
import type { Story } from '../types'

interface UseTopStoriesResult {
  stories: Story[]
  isLoading: boolean
  error: string | null
}

export function useTopStories(limit: number): UseTopStoriesResult {
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const topStories = await fetchTopStories(limit)
        if (!isCancelled) {
          setStories(topStories)
        }
      } catch {
        if (!isCancelled) {
          setError('Failed to load stories. Please try again.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      isCancelled = true
    }
  }, [limit])

  return { stories, isLoading, error }
}
