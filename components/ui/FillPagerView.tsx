import { forwardRef, type ComponentProps } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import PagerView from "react-native-pager-view";

type PagerViewProps = ComponentProps<typeof PagerView>;

export type FillPagerViewProps = Omit<PagerViewProps, "style"> & {
  /**
   * When a numeric height is set (e.g. Profile embedded mode), apply it
   * directly. Otherwise wrap in a flex host and absolute-fill the pager so
   * Android ViewPager2 gets a real pixel size (flex:1 alone is unreliable).
   */
  style?: StyleProp<ViewStyle>;
};

function hasExplicitNumericHeight(style: StyleProp<ViewStyle>): boolean {
  const flat = StyleSheet.flatten(style);
  return typeof flat?.height === "number" && flat.height > 0;
}

/**
 * PagerView that fills its parent with a real size on Android.
 *
 * ViewPager2 often ignores flex:1; nesting then paints blank pages. Host with
 * flex:1 and absolute-fill the native pager (or pass an explicit height for
 * embedded Profile tabs). Pair with pagerPageFillStyle on page children.
 */
export const FillPagerView = forwardRef<PagerView, FillPagerViewProps>(
  function FillPagerView({ style, children, ...props }, ref) {
    if (hasExplicitNumericHeight(style)) {
      return (
        <PagerView ref={ref} style={style} {...props}>
          {children}
        </PagerView>
      );
    }

    return (
      <View collapsable={false} style={[styles.measureHost, style]}>
        <PagerView ref={ref} style={styles.absoluteFill} {...props}>
          {children}
        </PagerView>
      </View>
    );
  },
);

/** Documented Android page fill — flex:1 does not work on PagerView children. */
export const pagerPageFillStyle = StyleSheet.create({
  page: {
    width: "100%",
    height: "100%",
  },
}).page;

const styles = StyleSheet.create({
  measureHost: {
    flex: 1,
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
});
