import { StoryItem } from './StoryItem'
import type { Feed } from '../api/hackerNews'

interface StoryListProps {
  storyIds: number[]
  feed: Feed
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function StoryList({ storyIds, feed }: StoryListProps) {
  return (
    <>
      <ol className="story-list">
        {storyIds.map((id, index) => (
          <StoryItem
            key={id}
            id={id}
            rank={index + 1}
            showAuthor={feed === 'ask'}
          />
        ))}
      </ol>
      <button
        type="button"
        className="back-to-top-button"
        onClick={scrollToTop}
      >
        ↑ Top
      </button>
    </>
  )
}
