import { StoryItem } from './StoryItem'

interface StoryListProps {
  storyIds: number[]
}

export function StoryList({ storyIds }: StoryListProps) {
  return (
    <ol className="story-list">
      {storyIds.map((id, index) => (
        <StoryItem key={id} id={id} rank={index + 1} />
      ))}
    </ol>
  )
}
