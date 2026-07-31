import { MIN_SEARCH_QUERY_LENGTH } from '../api/algolia'
import { useStorySearch } from '../hooks/useStorySearch'
import { StoryItem } from './StoryItem'

interface SearchResultsProps {
  query: string
}

export function SearchResults({ query }: SearchResultsProps) {
  const { data: stories, isPending, isError } = useStorySearch(query)

  // A query below the minimum length never fires (see useStorySearch), so it
  // must be checked before isPending — otherwise a disabled query's
  // permanently-pending status would show "Searching…" forever.
  if (query.trim().length < MIN_SEARCH_QUERY_LENGTH) {
    return <p className="status">Keep typing to search all of Hacker News…</p>
  }

  if (isPending) {
    return <p className="status">Searching…</p>
  }

  if (isError) {
    return (
      <p className="status status-error">Search failed. Please try again.</p>
    )
  }

  if (stories.length === 0) {
    return <p className="status">No stories match "{query}".</p>
  }

  return (
    <ol className="story-list">
      {stories.map((story, index) => (
        <StoryItem key={story.id} id={story.id} rank={index + 1} story={story} />
      ))}
    </ol>
  )
}
