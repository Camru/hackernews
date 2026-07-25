import { useEffect, useState } from 'react'

function parseStoryId(hash: string): number | null {
  const match = hash.match(/^#story\/(\d+)$/)
  return match ? Number(match[1]) : null
}

export function useHashRoute() {
  const [storyId, setStoryId] = useState<number | null>(() => parseStoryId(window.location.hash))

  useEffect(() => {
    function handleHashChange() {
      setStoryId(parseStoryId(window.location.hash))
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  function openStory(id: number) {
    window.location.hash = `story/${id}`
  }

  function closeStory() {
    window.location.hash = ''
  }

  return { storyId, openStory, closeStory }
}
