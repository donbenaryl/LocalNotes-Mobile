import { useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const THUMB_SIZE = 24;
const TRACK_HEIGHT = 6;
const ROW_HEIGHT = 32;
const DEFAULT_MIN = 0;
const DEFAULT_MAX = 100;
const DEFAULT_STEP = 1;

interface SliderProps {
  value: number;
  onChange: (nextValue: number) => void;
  colors: string[];
  min?: number;
  max?: number;
  step?: number;
  thumbBorderColor?: string;
  containerClassName?: string;
  trackClassName?: string;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

function normalizeHexColor(color: string) {
  const stripped = color.replace('#', '');
  if (stripped.length === 3) {
    return stripped
      .split('')
      .map((char) => char + char)
      .join('');
  }
  return stripped;
}

function hexToRgb(color: string): RgbColor {
  const normalized = normalizeHexColor(color);
  if (normalized.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }

  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function interpolateChannel(start: number, end: number, factor: number) {
  return Math.round(start + (end - start) * factor);
}

function interpolateGradientColor(colors: string[], progress: number) {
  if (colors.length === 0) return 'rgb(0,0,0)';
  if (colors.length === 1) return colors[0];

  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const segmentSize = 1 / (colors.length - 1);
  const segmentIndex = Math.min(
    Math.floor(clampedProgress / segmentSize),
    colors.length - 2,
  );
  const segmentStart = segmentSize * segmentIndex;
  const localFactor = (clampedProgress - segmentStart) / segmentSize;

  const start = hexToRgb(colors[segmentIndex]);
  const end = hexToRgb(colors[segmentIndex + 1]);

  const r = interpolateChannel(start.r, end.r, localFactor);
  const g = interpolateChannel(start.g, end.g, localFactor);
  const b = interpolateChannel(start.b, end.b, localFactor);

  return `rgb(${r},${g},${b})`;
}

export function Slider({
  value,
  onChange,
  colors,
  min = DEFAULT_MIN,
  max = DEFAULT_MAX,
  step = DEFAULT_STEP,
  thumbBorderColor,
  containerClassName,
  trackClassName,
}: SliderProps) {
  const [railWidth, setRailWidth] = useState(0);

  const range = max - min;
  const boundedValue = Math.min(Math.max(value, min), max);
  const progress = range > 0 ? (boundedValue - min) / range : 0;
  const boundedX = railWidth > 0 ? progress * railWidth : 0;
  const dynamicThumbColor = thumbBorderColor ?? interpolateGradientColor(colors, progress);

  const gradientColors: readonly [string, string, ...string[]] =
    colors.length >= 2 ? [colors[0], colors[1], ...colors.slice(2)] : ['#6B7280', '#6B7280'];

  // Keep the latest layout/config values available to the gesture handlers
  // without recreating the PanResponder (which would interrupt an active drag).
  const railWidthRef = useRef(railWidth);
  railWidthRef.current = railWidth;
  const configRef = useRef({ min, max, step, range });
  configRef.current = { min, max, step, range };
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const startXRef = useRef(0);

  const commitValueFromX = (x: number) => {
    const width = railWidthRef.current;
    const { min: cMin, max: cMax, step: cStep, range: cRange } = configRef.current;
    if (!width || cRange <= 0) return;
    const clampedX = Math.min(Math.max(x, 0), width);
    const rawValue = cMin + (clampedX / width) * cRange;
    const steppedValue = Math.round((rawValue - cMin) / cStep) * cStep + cMin;
    const nextValue = Math.min(Math.max(steppedValue, cMin), cMax);
    onChangeRef.current(nextValue);
  };

  const onRailLayout = (event: LayoutChangeEvent) => {
    setRailWidth(event.nativeEvent.layout.width);
  };

  const handleTrackPress = (event: GestureResponderEvent) => {
    commitValueFromX(event.nativeEvent.locationX);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          startXRef.current = event.nativeEvent.locationX;
          commitValueFromX(startXRef.current);
        },
        onPanResponderMove: (_, gestureState) => {
          commitValueFromX(startXRef.current + gestureState.dx);
        },
      }),
    [],
  );

  return (
    <View
      className={`relative justify-center ${containerClassName ?? ''}`}
      style={{ height: ROW_HEIGHT }}
      onLayout={onRailLayout}
      onStartShouldSetResponder={() => true}
      onResponderRelease={handleTrackPress}
      {...panResponder.panHandlers}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        className={`rounded-full overflow-hidden ${trackClassName ?? ''}`}
        style={{ height: TRACK_HEIGHT, width: '100%', borderRadius: TRACK_HEIGHT / 2 }}
      />
      <View
        pointerEvents="none"
        className="absolute rounded-full bg-white border-[5px]"
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          top: (ROW_HEIGHT - THUMB_SIZE) / 2,
          left: Math.min(Math.max(boundedX - THUMB_SIZE / 2, 0), Math.max(railWidth - THUMB_SIZE, 0)),
          borderColor: dynamicThumbColor,
        }}
      />
    </View>
  );
}
