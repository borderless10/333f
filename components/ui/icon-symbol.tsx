// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.down': 'keyboard-arrow-down',
  'chevron.up': 'keyboard-arrow-up',
  'chart.bar.fill': 'bar-chart',
  'building.columns.fill': 'business',
  'building.columns': 'business',
  'building.2': 'business',
  'building.2.fill': 'domain',
  'list.bullet': 'list',
  'person.crop.circle.fill': 'account-circle',
  'person.fill': 'person',
  'person.3.fill': 'group',
  'person.circle.fill': 'account-circle',
  'arrow.down.circle.fill': 'south',
  'arrow.up.circle.fill': 'north',
  'arrow.down.circle': 'south',
  'arrow.up.circle': 'north',
  'arrow.left.arrow.right.circle.fill': 'sync-alt',
  'arrow.clockwise': 'refresh',
  'arrow.counterclockwise': 'undo',
  'dollarsign.circle.fill': 'attach-money',
  'circle.fill': 'circle',
  'arrow.up.right': 'trending-up',
  'arrow.down.right': 'trending-down',
  'plus.circle.fill': 'add-circle',
  'minus.circle.fill': 'remove-circle',
  'pencil': 'edit',
  'trash': 'delete',
  'xmark.circle.fill': 'cancel',
  'xmark.circle': 'cancel',
  'xmark': 'close',
  'magnifyingglass': 'search',
  'phone.fill': 'phone',
  'phone': 'phone',
  'envelope.fill': 'email',
  'envelope': 'email',
  'mappin.circle.fill': 'location-on',
  'mappin': 'location-on',
  'location.fill': 'location-on',
  'location': 'location-on',
  'creditcard': 'credit-card',
  'checkmark.circle.fill': 'check-circle',
  'checkmark': 'check',
  'info.circle.fill': 'info',
  'exclamationmark.triangle.fill': 'warning',
  'clock': 'access-time',
  'clock.arrow.circlepath': 'history',
  'link.circle.fill': 'link',
  'doc.text.fill': 'description',
  'square.and.arrow.up.fill': 'file-upload',
  'sparkles': 'auto-awesome',
  'line.3.horizontal.decrease': 'filter-list',
  'hourglass': 'hourglass-empty',
  'creditcard.fill': 'credit-card',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
