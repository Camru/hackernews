interface StoryItemSkeletonProps {
  rank: number;
}

// Used while the story ids themselves are still loading, so unlike
// StoryItem's own pending state there's no id yet for an interactive
// save-toggle rank button.
export function StoryItemSkeleton({rank}: StoryItemSkeletonProps) {
  return (
    <li className="story-item">
      <span className="story-rank">{rank}</span>
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
