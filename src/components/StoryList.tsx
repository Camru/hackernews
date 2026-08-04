import { StoryItem } from './StoryItem'

interface StoryListProps {
  storyIds: number[]
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function StoryList({ storyIds }: StoryListProps) {
  return (
    <>
      <ol className="story-list">
        {storyIds.map((id, index) => (
          <StoryItem key={id} id={id} rank={index + 1} />
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
