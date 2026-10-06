import Svg, { Circle, Path, SvgProps } from 'react-native-svg';

export const FACEBOOK_BLUE = '#3273F1';

// The "f" stem runs past the bottom of the white circle into the blue ring so the two merge.
const F_PATH =
  'M11.5 18.5V14.5H9.7V12.7H11.5V10.4C11.5 9.2 12.2 8.5 13.3 8.5H15.1V10.1H14.1C13.6 10.1 13.3 10.3 13.3 10.9V12.7H14.7L14.5 14.5H13.3V18.5Z';

export function FacebookIcon({ width = 48, height = 48, ...rest }: SvgProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest}>
      <Circle cx={12} cy={12} r={12} fill={FACEBOOK_BLUE} />
      <Circle cx={12} cy={12} r={6} fill="#FFFFFF" />
      <Path d={F_PATH} fill={FACEBOOK_BLUE} />
    </Svg>
  );
}
