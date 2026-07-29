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
  const isHot = story.score > 300;
  const isPopular = (story.descendants ?? 0) > 200;
  const isRecent = Date.now() / 1000 - story.time <= 3 * 3600;

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
      tabIndex={0}>
      <span className="story-rank">{rank}</span>
      <div className="story-content">
        <a
          className="story-title"
          href={story.url ?? commentsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={stopPropagation}>
          {story.title}
        </a>
        {hostname && <span className="story-host">({hostname})</span>}
        <div className="story-meta">
          <span>by {story.by}</span>
          <span className={isRecent ? 'story-time--recent' : undefined}>
            {formatTimeAgo(story.time)}
          </span>
          <div style={{display: 'flex', marginLeft: 'auto', gap: '3px'}}>
            <span
              className={`story-points${isHot ? ' story-points--hot' : ''}`}>
              <svg
                fill="currentColor"
                height="10"
                viewBox="0 0 20 20"
                width="10"
                aria-hidden="true">
                <path d="M10 19a3.966 3.966 0 01-3.96-3.962V10.98H2.838a1.731 1.731 0 01-1.605-1.073 1.734 1.734 0 01.377-1.895L9.364.254a.925.925 0 011.272 0l7.754 7.759c.498.499.646 1.242.376 1.894-.27.652-.9 1.073-1.605 1.073h-3.202v4.058A3.965 3.965 0 019.999 19H10zM2.989 9.179H7.84v5.731c0 1.13.81 2.163 1.934 2.278a2.163 2.163 0 002.386-2.15V9.179h4.851L10 2.163 2.989 9.179z" />
              </svg>
              {story.score}
            </span>
            <span
              className={`story-comments${isPopular ? ' story-comments--hot' : ''}`}>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              {story.descendants ?? 0}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}
