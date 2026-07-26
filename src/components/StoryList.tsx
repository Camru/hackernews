import { useQueries } from '@tanstack/react-query'
import { fetchStory } from '../api/hackerNews'
import { StoryItem } from './StoryItem'

interface StoryListProps {
  storyIds: number[]
  searchQuery: string
}

export function StoryList({ storyIds, searchQuery }: StoryListProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  // Reads from the same ['story', id] cache each StoryItem already populates
  // via useStory, so this doesn't trigger extra fetches beyond what's already
  // in flight — it just lets us filter by title once data arrives.
  const storyQueries = useQueries({
    queries: storyIds.map((id) => ({
      queryKey: ['story', id],
      queryFn: () => fetchStory(id),
    })),
  })

  const visibleEntries = storyIds
    .map((id, index) => ({ id, rank: index + 1, title: storyQueries[index]?.data?.title }))
    .filter((entry) => !normalizedQuery || entry.title?.toLowerCase().includes(normalizedQuery))

  return (
    <ol className="story-list">
      {visibleEntries.map((entry) => (
        <StoryItem key={entry.id} id={entry.id} rank={entry.rank} />
      ))}
      {normalizedQuery && visibleEntries.length === 0 && (
        <li className="status">No stories match "{searchQuery}".</li>
      )}
    </ol>
  )
}
