import type {KeyboardEvent, MouseEvent} from 'react';
import {useStory} from '../hooks/useStory';
import {useSavedStories} from '../hooks/useSavedStories';
import {formatTimeAgo} from '../utils/time';
import {getHostname} from '../utils/url';
import type {Story} from '../types';

interface StoryItemProps {
  id: number;
  rank: number;
  // Search results already come back from Algolia as full Story objects, so
  // passing one in skips the redundant per-id Firebase fetch below.
  story?: Story;
  onRemove?: () => void;
}

export function StoryItem({
  id,
  rank,
  story: providedStory,
  onRemove,
}: StoryItemProps) {
  const {data: fetchedStory, isPending} = useStory(id, {
    enabled: !providedStory,
  });
  const story = providedStory ?? fetchedStory;
  const {savedIds, save, remove} = useSavedStories();
  const isSaved = savedIds.includes(id);

  function toggleSaved(event: MouseEvent) {
    event.stopPropagation();
    if (isSaved) {
      remove(id);
    } else {
      save(id);
    }
  }

  // A disabled query stays in `pending` status forever, so `isPending` alone
  // can't be used to gate the skeleton once a story is already provided.
  if (!story && isPending) {
    return (
      <li className="story-item">
        <button
          type="button"
          className="story-rank"
          onClick={toggleSaved}
          aria-label={isSaved ? 'Unsave story' : 'Save story'}>
          <span
            className={`story-rank-number${isSaved ? ' story-rank-number--saved' : ''}`}>
            {rank}
          </span>
        </button>
        <div className="story-content">
          <div className="story-main">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-host" />
            <div className="skeleton skeleton-meta" />
          </div>
        </div>
      </li>
    );
  }

  // A failed background refetch (e.g. a real network error, not just an
  // offline-paused one) shouldn't discard perfectly good cached/offline
  // data — only fall through to the error state once there's nothing to show.
  if (!story) {
    return (
      <li className="story-item">
        <button
          type="button"
          className="story-rank"
          onClick={toggleSaved}
          aria-label={isSaved ? 'Unsave story' : 'Save story'}>
          <span
            className={`story-rank-number${isSaved ? ' story-rank-number--saved' : ''}`}>
            {rank}
          </span>
        </button>
        <div className="story-content">
          <p className="status-error">Failed to load this story.</p>
          {onRemove && <UnsaveButton onRemove={onRemove} />}
        </div>
      </li>
    );
  }

  const hostname = getHostname(story.url);
  const storyId = story.id;
  const commentsUrl = `https://news.ycombinator.com/item?id=${storyId}`;
  const isHot = story.score > 300;
  const isPopular = (story.descendants ?? 0) > 200;
  const isRecent = Date.now() / 1000 - story.time < 2 * 3600;

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

  const iconSize = '12';

  return (
    <li
      className="story-item story-item--clickable"
      onClick={openComments}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}>
      <button
        type="button"
        className="story-rank"
        onClick={toggleSaved}
        aria-label={isSaved ? 'Unsave story' : 'Save story'}>
        <span
          className={`story-rank-number${isSaved ? ' story-rank-number--saved' : ''}`}>
          {rank}
        </span>
      </button>
      <div className="story-content">
        <div className="story-main">
          <a
            className="story-title"
            href={story.url ?? commentsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stopPropagation}>
            {story.title}
          </a>
          <div className="story-meta">
            <span>by {story.by}</span>
            {hostname && <span className="story-host">{hostname}</span>}
            <span className={isRecent ? 'story-time--recent' : undefined}>
              {formatTimeAgo(story.time)}
            </span>
          </div>
        </div>
        <div
          className={`story-stats${onRemove ? ' story-stats--removable' : ''}`}>
          {onRemove && <UnsaveButton onRemove={onRemove} />}
          <div className="story-stats-counts">
            <span
              className={`story-points${isHot ? ' story-points--hot' : ''}`}>
              <svg
                fill="currentColor"
                height={iconSize}
                viewBox="0 0 20 20"
                width={iconSize}
                aria-hidden="true">
                <path d="M10 19a3.966 3.966 0 01-3.96-3.962V10.98H2.838a1.731 1.731 0 01-1.605-1.073 1.734 1.734 0 01.377-1.895L9.364.254a.925.925 0 011.272 0l7.754 7.759c.498.499.646 1.242.376 1.894-.27.652-.9 1.073-1.605 1.073h-3.202v4.058A3.965 3.965 0 019.999 19H10zM2.989 9.179H7.84v5.731c0 1.13.81 2.163 1.934 2.278a2.163 2.163 0 002.386-2.15V9.179h4.851L10 2.163 2.989 9.179z" />
              </svg>
              {story.score}
            </span>
            <span
              className={`story-comments${isPopular ? ' story-comments--hot' : ''}`}>
              <svg
                width={iconSize}
                height={iconSize}
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

function UnsaveButton({onRemove}: {onRemove: () => void}) {
  function handleClick(event: MouseEvent) {
    event.stopPropagation();
    onRemove();
  }

  return (
    <button
      type="button"
      className="story-unsave"
      onClick={handleClick}
      aria-label="Unsave story">
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="currentColor" />
        <rect x="6" y="10" width="12" height="4" rx="2" fill="white" />
      </svg>
    </button>
  );
}
