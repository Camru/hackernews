import type {Feed} from '../api/hackerNews';

export type Tab = Feed | 'saved' | 'offline';

const FEEDS: {id: Feed; label: string}[] = [
  {id: 'top', label: 'Top'},
  {id: 'best', label: 'Best'},
  {id: 'ask', label: 'Ask'},
];

interface FeedTabsProps {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
}

export function FeedTabs({activeTab, onSelect}: FeedTabsProps) {
  return (
    <nav className="feed-tabs" aria-label="Story feeds">
      {FEEDS.map((feed) => (
        <button
          key={feed.id}
          type="button"
          className={`feed-tab${feed.id === activeTab ? ' feed-tab--active' : ''}`}
          aria-current={feed.id === activeTab ? 'true' : undefined}
          onClick={() => onSelect(feed.id)}>
          {feed.label}
        </button>
      ))}
      <div className="feed-tabs-secondary">
        <button
          type="button"
          className={`feed-tab feed-tab--offline${activeTab === 'offline' ? ' feed-tab--active' : ''}`}
          aria-current={activeTab === 'offline' ? 'true' : undefined}
          aria-label="Offline stories"
          onClick={() => onSelect('offline')}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true">
            <path d="M8 17l4 4 4-4" />
            <path d="M12 12v9" />
            <path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 104 16.29" />
          </svg>
        </button>
        <button
          type="button"
          className={`feed-tab feed-tab--saved${activeTab === 'saved' ? ' feed-tab--active' : ''}`}
          aria-current={activeTab === 'saved' ? 'true' : undefined}
          aria-label="Saved stories"
          onClick={() => onSelect('saved')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 2h12v20l-6-4-6 4z" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
