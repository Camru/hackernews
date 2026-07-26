import type {KeyboardEvent, MouseEvent} from 'react';
import {useStory} from '../hooks/useStory';
import {formatTimeAgo} from '../utils/time';
import {getHostname} from '../utils/url';

interface StoryItemProps {
  id: number;
  rank: number;
}

export function StoryItem({id, rank}: StoryItemProps) {
  const {data: story, isPending, isError} = useStory(id);

  if (isPending) {
    return (
      <li className="story-item">
        <span className="story-rank">{rank}</span>
        <div className="story-content">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-meta" />
        </div>
      </li>
    );
  }

  if (isError || !story) {
    return (
      <li className="story-item">
        <span className="story-rank">{rank}</span>
        <div className="story-content">
          <p className="status-error">Failed to load this story.</p>
        </div>
      </li>
    );
  }

  const hostname = getHostname(story.url);
  const storyId = story.id;
  const commentsUrl = `https://news.ycombinator.com/item?id=${storyId}`;

  function openComments() {
    window.location.hash = `story/${storyId}`;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLLIElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openComments();
    }
  }

  function stopPropagation(event: MouseEvent) {
    event.stopPropagation();
  }

  return (
    <li
      className="story-item story-item--clickable"
      onClick={openComments}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
    >
      <span className="story-rank">{rank}</span>
      <div className="story-content">
        <a
          className="story-title"
          href={story.url ?? commentsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={stopPropagation}
        >
          {story.title}
        </a>
        {hostname && <span className="story-host">({hostname})</span>}
        <div className="story-meta">
          <span>{story.score} points</span>
          <span>by {story.by}</span>
          <span>{formatTimeAgo(story.time)}</span>
          <a className="story-comments" href={`#story/${storyId}`} onClick={stopPropagation}>
            {story.descendants ?? 0} comments
          </a>
        </div>
      </div>
    </li>
  );
}
