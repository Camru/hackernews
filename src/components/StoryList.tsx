import { StoryItem } from './StoryItem'
import type { Story } from '../types'

interface StoryListProps {
  stories: Story[]
}

export function StoryList({ stories }: StoryListProps) {
  return (
    <ol className="story-list">
      {stories.map((story, index) => (
        <StoryItem key={story.id} story={story} rank={index + 1} />
      ))}
    </ol>
  )
}
