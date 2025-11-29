# Timestamp Audio Player - Design Document

## Overview

A React-based web application for precise audio playback control with timestamp-driven features. Users can upload audio files, navigate to specific time positions, loop between two timestamps, and automatically section tracks into repeatable segments.

## Problem Statement

The original implementation had several time math issues:

- Rounding errors causing off-by-one second loops
- NaN/Infinity propagation when audio metadata isn't loaded
- Progress bar click positioning inaccuracies
- Sectioning algorithms with compounded rounding errors
- Race conditions between loop logic and audio ended events

## Design Goals

1. **Precision**: Accurate time calculations without rounding-induced drift
2. **Robustness**: Handle edge cases (NaN, Infinity, invalid durations, metadata delays)
3. **Responsiveness**: Smooth UI updates without flickering or jumps
4. **Accessibility**: Keyboard navigation, screen reader support, clear visual feedback
5. **Portability**: React components that can be adapted for React Native/Expo
6. **Aesthetics**: Clean, responsive design with accessible controls, take HEAVY inspiration from spotify's UI for the music player's look

## Architecture

### Component Hierarchy

```
App
├── AudioUpload
├── ThemeProvider
│   ├── AudioPlayer
│   │   ├── TrackInfo (Cover Art, Title, Artist)
│   │   ├── PlaybackControls
│   │   ├── ProgressBar
│   │   ├── TimestampDisplay
│   │   └── LoopControls
│   ├── SectioningControls
│   └── SectionList
└── ErrorBoundary
```

### State Management

```typescript
interface AudioState {
  file: File | null;
  url: string | null;
  metadata: AudioMetadata | null;
  duration: number; // guaranteed finite, defaults to 0
  currentTime: number;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  coverArtUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface LoopState {
  isActive: boolean;
  startTime: number; // clamped [0, duration]
  endTime: number; // clamped [startTime, duration]
}

interface SectioningState {
  sections: AudioSection[];
  activeSectionIndex: number | null;
  mode: "count" | "duration"; // sections by count vs by duration
}

interface AudioSection {
  startTime: number;
  endTime: number;
  label: string;
}
```

### Time Math Utilities

```typescript
// Core time math with edge case handling
class TimeMath {
  static formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";

    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  static clampTime(time: number, min: number, max: number): number {
    if (!Number.isFinite(time)) return min;
    return Math.max(min, Math.min(max, time));
  }

  static calculateProgress(currentTime: number, duration: number): number {
    if (
      !Number.isFinite(currentTime) ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      return 0;
    }
    return (currentTime / duration) * 100;
  }

  static calculateTimeFromProgress(
    progressPercent: number,
    duration: number
  ): number {
    if (
      !Number.isFinite(progressPercent) ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      return 0;
    }
    return this.clampTime((progressPercent / 100) * duration, 0, duration);
  }

  static parseTimestamp(minutes: number, seconds: number): number {
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return 0;

    // Normalize seconds to 0-59
    const normalizedMinutes = Math.floor(Math.max(0, minutes));
    const normalizedSeconds = Math.floor(Math.max(0, Math.min(59, seconds)));

    return normalizedMinutes * 60 + normalizedSeconds;
  }
}
```

### Sectioning Algorithm

```typescript
class SectioningEngine {
  static createSectionsByCount(
    duration: number,
    count: number
  ): AudioSection[] {
    if (
      !Number.isFinite(duration) ||
      duration <= 0 ||
      !Number.isFinite(count) ||
      count <= 0
    ) {
      return [];
    }

    const sectionCount = Math.floor(count);
    const sectionDuration = duration / sectionCount;
    const sections: AudioSection[] = [];

    for (let i = 0; i < sectionCount; i++) {
      const startTime = i * sectionDuration;
      const endTime =
        i === sectionCount - 1 ? duration : (i + 1) * sectionDuration;

      sections.push({
        startTime,
        endTime,
        label: `${TimeMath.formatTime(startTime)} - ${TimeMath.formatTime(
          endTime
        )}`,
      });
    }

    return sections;
  }

  static createSectionsByDuration(
    duration: number,
    sectionDuration: number
  ): AudioSection[] {
    if (
      !Number.isFinite(duration) ||
      duration <= 0 ||
      !Number.isFinite(sectionDuration) ||
      sectionDuration <= 0
    ) {
      return [];
    }

    const count = Math.ceil(duration / sectionDuration);
    const sections: AudioSection[] = [];

    for (let i = 0; i < count; i++) {
      const startTime = i * sectionDuration;
      const endTime = Math.min((i + 1) * sectionDuration, duration);

      sections.push({
        startTime,
        endTime,
        label: `${TimeMath.formatTime(startTime)} - ${TimeMath.formatTime(
          endTime
        )}`,
      });
    }

    return sections;
  }
}
```

### Loop Logic

```typescript
class LoopEngine {
  static shouldLoop(
    currentTime: number,
    loopEnd: number,
    duration: number
  ): boolean {
    if (!Number.isFinite(currentTime) || !Number.isFinite(loopEnd))
      return false;

    // Use a small epsilon to handle floating point precision
    const EPSILON = 0.01;
    return currentTime >= loopEnd - EPSILON;
  }

  static getLoopStartTime(loopStart: number, currentTime: number): number {
    if (!Number.isFinite(loopStart)) return 0;
    return Math.max(0, loopStart);
  }

  static validateLoopBounds(
    startTime: number,
    endTime: number,
    duration: number
  ): { valid: boolean; error?: string } {
    if (
      !Number.isFinite(startTime) ||
      !Number.isFinite(endTime) ||
      !Number.isFinite(duration)
    ) {
      return { valid: false, error: "Invalid time values" };
    }

    if (startTime < 0 || endTime < 0) {
      return { valid: false, error: "Time values cannot be negative" };
    }

    if (startTime >= duration) {
      return { valid: false, error: "Start time must be before track end" };
    }

    if (endTime > duration) {
      return { valid: false, error: "End time cannot exceed track duration" };
    }

    if (startTime >= endTime) {
      return { valid: false, error: "Start time must be before end time" };
    }

    return { valid: true };
  }
}

### Dynamic Theme & Metadata System

**Concept:**
The application will mimic Spotify's immersive design by extracting the dominant color from the track's cover art and applying it as a dynamic background gradient.

**Metadata Extraction:**
- Library: `jsmediatags`
- Extracted Fields: Title, Artist, Album, Genre, Picture (Cover Art)
- Fallback: Default placeholder image and neutral colors if no metadata is found.

**Color Extraction:**
- Library: `color-thief` (or similar lightweight alternative)
- Process:
    1.  Convert extracted picture data to a Blob/URL.
    2.  Pass image URL to Color Thief.
    3.  Extract dominant color and a palette.
    4.  Generate a complementary text color (YIQ contrast check) to ensure readability.

**Theme Application:**
- A `ThemeProvider` context will wrap the player.
- It will expose `--primary-theme-color` and `--secondary-theme-color` CSS variables.
- The UI will use a linear gradient background: `linear-gradient(to bottom, var(--primary-theme-color), #121212)`.
```

## Component Details

### AudioPlayer Component

**Responsibilities:**

- Audio element management
- Playback state synchronization
- Time update handling with requestAnimationFrame for smooth updates
- Error handling for unsupported formats

**Key Implementation Details:**

```typescript
const AudioPlayer: React.FC<AudioPlayerProps> = ({
  file,
  onTimeUpdate,
  onDurationChange,
  onEnded,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Use requestAnimationFrame for smooth progress updates
  useEffect(() => {
    if (!isPlaying) return;

    let animationFrame: number;
    const updateTime = () => {
      if (audioRef.current) {
        const time = audioRef.current.currentTime;
        setCurrentTime(time);
        onTimeUpdate(time);
      }
      animationFrame = requestAnimationFrame(updateTime);
    };

    animationFrame = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, onTimeUpdate]);

  // Handle metadata loading with proper validation
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const newDuration = audioRef.current.duration;
      if (Number.isFinite(newDuration) && newDuration > 0) {
        setDuration(newDuration);
        onDurationChange(newDuration);
      }
    }
  };

  // Prevent race conditions with ended event
  const handleEnded = () => {
    if (loopState.isActive && Number.isFinite(loopState.endTime)) {
      // Loop will handle the restart
      return;
    }
    onEnded();
  };

  return (
    <audio
      ref={audioRef}
      src={file ? URL.createObjectURL(file) : undefined}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      onError={(e) => console.error("Audio error:", e)}
    />
  );
};
```

### ProgressBar Component

**Responsibilities:**

- Accurate click positioning using getBoundingClientRect
- Smooth visual updates without flickering
- Keyboard navigation support

**Implementation:**

```typescript
const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  onSeek,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const time = TimeMath.calculateTimeFromProgress(percentage, duration);
    onSeek(time);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const time = TimeMath.calculateTimeFromProgress(percentage, duration);
    onSeek(time);
  };

  return (
    <div
      ref={containerRef}
      className="progress-bar-container"
      onClick={handleClick}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseMove={handleMouseMove}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={currentTime}
      tabIndex={0}
    >
      <div
        className="progress-bar"
        style={{
          width: `${TimeMath.calculateProgress(currentTime, duration)}%`,
        }}
      />
    </div>
  );
};
```

### LoopControls Component

**Responsibilities:**

- Input validation and normalization
- Real-time loop state management
- Visual feedback for active loops

**Implementation:**

```typescript
const LoopControls: React.FC<LoopControlsProps> = ({
  duration,
  onLoopChange,
}) => {
  const [startMin, setStartMin] = useState(0);
  const [startSec, setStartSec] = useState(0);
  const [endMin, setEndMin] = useState(0);
  const [endSec, setEndSec] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoopToggle = () => {
    if (isActive) {
      setIsActive(false);
      onLoopChange({ isActive: false, startTime: 0, endTime: 0 });
      return;
    }

    const startTime = TimeMath.parseTimestamp(startMin, startSec);
    const endTime = TimeMath.parseTimestamp(endMin, endSec);

    const validation = LoopEngine.validateLoopBounds(
      startTime,
      endTime,
      duration
    );

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError(null);
    setIsActive(true);
    onLoopChange({ isActive: true, startTime, endTime });
  };

  return (
    <div className="loop-controls">
      <div className="time-inputs">
        <div className="time-group">
          <label>From:</label>
          <input
            type="number"
            min="0"
            value={startMin}
            onChange={(e) => setStartMin(parseInt(e.target.value) || 0)}
            placeholder="00"
          />
          <span>:</span>
          <input
            type="number"
            min="0"
            max="59"
            value={startSec}
            onChange={(e) => setStartSec(parseInt(e.target.value) || 0)}
            placeholder="00"
          />
        </div>

        <div className="time-group">
          <label>To:</label>
          <input
            type="number"
            min="0"
            value={endMin}
            onChange={(e) => setEndMin(parseInt(e.target.value) || 0)}
            placeholder="00"
          />
          <span>:</span>
          <input
            type="number"
            min="0"
            max="59"
            value={endSec}
            onChange={(e) => setEndSec(parseInt(e.target.value) || 0)}
            placeholder="00"
          />
        </div>
      </div>

      <button
        className={`loop-button ${isActive ? "active" : ""}`}
        onClick={handleLoopToggle}
      >
        {isActive ? "Disable Loop" : "Enable Loop"}
      </button>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};
```

## Error Handling Strategy

### Audio Loading Errors

- Unsupported formats: Show user-friendly message with supported formats list
- Network errors: Retry mechanism with exponential backoff
- Corrupted files: Clear file input and show error message

### Time Math Errors

- All time calculations wrapped in validation functions
- Default fallbacks for invalid inputs
- User feedback for invalid loop bounds or section parameters

### Race Condition Prevention

- Debounced state updates for rapid time changes
- Proper cleanup of event listeners and animation frames
- Synchronized state updates between audio element and React state

## Performance Considerations

### Optimization Strategies

1. **RequestAnimationFrame**: Smooth 60fps updates instead of relying on timeupdate events
2. **Memoization**: Cache expensive calculations like section boundaries
3. **Debouncing**: Limit rapid state updates from user interactions
4. **Lazy Loading**: Load audio metadata progressively

### Memory Management

- Proper cleanup of object URLs created for audio files
- Event listener cleanup in useEffect cleanup functions
- Animation frame cancellation on component unmount

## Accessibility Features

### Keyboard Navigation

- Space bar for play/pause
- Arrow keys for seeking (left/right) and volume (up/down)
- Tab navigation through all interactive elements
- Enter key to activate buttons

### Screen Reader Support

- ARIA labels for all controls
- Live regions for time updates
- Semantic HTML structure
- Descriptive button labels

### Visual Accessibility

- High contrast mode support
- Focus indicators for keyboard navigation
- Clear visual feedback for active states
- Resizable text support

## Testing Strategy

### Unit Tests

- Time math utilities with edge cases
- Loop validation logic
- Sectioning algorithms with various inputs
- Input parsing and normalization

### Integration Tests

- Audio file upload and playback
- Loop functionality with different time ranges
- Section creation and interaction
- Progress bar seeking accuracy

### End-to-End Tests

- Complete user workflows
- Error handling scenarios
- Performance under load
- Cross-browser compatibility

## Future Enhancements

### React Native/Expo Migration

- Abstract audio playback to platform-agnostic hooks
- Replace HTML5 audio with expo-av for mobile
- Adapt UI components for touch interfaces
- Add gesture controls for seeking

### Advanced Features

- Waveform visualization
- Multiple loop regions
- Section bookmarks with names
- Export loop regions as separate files
- Keyboard shortcuts for power users

### Data Persistence

- Save loop regions to localStorage
- Export/import session data
- Cloud synchronization
- Session history

## Implementation Timeline

### Phase 1: Core Functionality (Week 1)

- Basic audio player with upload
- Time display and formatting
- Progress bar with accurate seeking
- Play/pause controls

### Phase 2: Loop System (Week 2)

- Loop input validation
- Loop activation/deactivation
- Loop boundary handling
- Visual feedback for active loops

### Phase 3: Sectioning (Week 3)

- Section creation algorithms
- Section list display
- Section interaction
- Section highlighting

### Phase 4: Polish & Testing (Week 4)

- Error handling
- Accessibility features
- Performance optimization
- Cross-browser testing
- Documentation completion

## Technical Stack

- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **Zustand** for lightweight state management
- **React Hook Form** for form handling
- **Vitest** for unit testing
- **React Testing Library** for component testing
- **ESLint + Prettier** for code quality

## Conclusion

This design addresses all the time math issues identified in the original implementation while providing a solid foundation for future mobile development. The modular architecture, comprehensive error handling, and accessibility features ensure a robust and user-friendly audio player that can grow with additional features.
