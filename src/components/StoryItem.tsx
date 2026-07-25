import { formatTimeAgo } from '../utils/time'
import { getHostname } from '../utils/url'
import type { Story } from '../types'

interface StoryItemProps {
  story: Story
  rank: number
}

export function StoryItem({ story, rank }: StoryItemProps) {
  const hostname = getHostname(story.url)
  const commentsUrl = `https://news.ycombinator.com/item?id=${story.id}`

  return (
    <li className="story-item">
      <span className="story-rank">{rank}</span>
      <div className="story-content">
        <a
          className="story-title"
          href={story.url ?? commentsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {story.title}
        </a>
        {hostname && <span className="story-host">({hostname})</span>}
        <div className="story-meta">
          <span>{story.score} points</span>
          <span>by {story.by}</span>
          <span>{formatTimeAgo(story.time)}</span>
          <a className="story-comments" href={`#story/${story.id}`}>
            {story.descendants ?? 0} comments
          </a>
        </div>
      </div>
    </li>
  )
}
