import type {Feed} from '../api/hackerNews';

const FEEDS: {id: Feed; label: string}[] = [
  {id: 'top', label: 'Top'},
  {id: 'best', label: 'Best'},
  {id: 'ask', label: 'Ask'},
];

interface FeedTabsProps {
  activeFeed: Feed;
  onSelect: (feed: Feed) => void;
  isSavedActive: boolean;
  onSelectSaved: () => void;
  hasSavedStories: boolean;
}

export function FeedTabs({
  activeFeed,
  onSelect,
  isSavedActive,
  onSelectSaved,
  hasSavedStories,
}: FeedTabsProps) {
  return (
    <nav className="feed-tabs" aria-label="Story feeds">
      {FEEDS.map((feed) => (
        <button
          key={feed.id}
          type="button"
          className={`feed-tab${!isSavedActive && feed.id === activeFeed ? ' feed-tab--active' : ''}`}
          aria-current={!isSavedActive && feed.id === activeFeed ? 'true' : undefined}
          onClick={() => onSelect(feed.id)}>
          {feed.label}
        </button>
      ))}
      {hasSavedStories && (
        <button
          type="button"
          className={`feed-tab feed-tab--saved${isSavedActive ? ' feed-tab--active' : ''}`}
          aria-current={isSavedActive ? 'true' : undefined}
          aria-label="Saved stories"
          onClick={onSelectSaved}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 2h12v20l-6-4-6 4z" />
          </svg>
        </button>
      )}
    </nav>
  );
}
