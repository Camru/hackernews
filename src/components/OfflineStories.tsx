import {useIsOnline} from '../hooks/useIsOnline';
import {useOfflineSnapshot} from '../hooks/useOfflineSnapshot';
import {formatTimeAgo} from '../utils/time';
import {StoryItem} from './StoryItem';

export function OfflineStories() {
  const {state, sync, cancel} = useOfflineSnapshot();
  const isOnline = useIsOnline();
  const isSyncing = state.status === 'syncing';

  return (
    <div className="offline-panel">
      <div className="offline-panel-header">
        <div className="offline-panel-status">
          <span>
            {state.syncedAt
              ? `Synced ${formatTimeAgo(state.syncedAt / 1000)}`
              : 'Not synced yet'}
          </span>
          {isSyncing && state.progress && (
            <span className="offline-panel-progress">
              {state.progress.storiesDone}/{state.progress.storiesTotal}{' '}
              stories · {state.progress.nodesFetched} comments
            </span>
          )}
          {state.status === 'error' && state.error && (
            <span className="status-error">{state.error}</span>
          )}
        </div>
        <button
          type="button"
          className="offline-sync-button"
          onClick={() => (isSyncing ? cancel() : sync())}
          disabled={!isSyncing && !isOnline}>
          {isSyncing ? 'Cancel' : 'Sync now'}
        </button>
      </div>
      {state.stories.length === 0 ? (
        <p className="status">
          {isOnline
            ? 'Nothing downloaded yet — tap "Sync now" to save the top 10 stories for offline reading.'
            : 'Nothing downloaded yet. Connect to the internet and tap "Sync now" to save stories for offline reading.'}
        </p>
      ) : (
        <ol className="story-list">
          {state.stories.map((story, index) => (
            <StoryItem
              key={story.id}
              id={story.id}
              rank={index + 1}
              story={story}
            />
          ))}
        </ol>
      )}
    </div>
  );
}
