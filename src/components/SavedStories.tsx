import {useSavedStories} from '../hooks/useSavedStories';
import {StoryItem} from './StoryItem';

export function SavedStories() {
  const {savedIds, remove} = useSavedStories();

  if (savedIds.length === 0) {
    return <p className="status">No saved stories yet.</p>;
  }

  return (
    <ol className="story-list">
      {savedIds.map((id, index) => (
        <StoryItem
          key={id}
          id={id}
          rank={index + 1}
          onRemove={() => remove(id)}
        />
      ))}
    </ol>
  );
}
