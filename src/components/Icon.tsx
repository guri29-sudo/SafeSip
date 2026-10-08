import React from 'react';
import { View, StyleSheet } from 'react-native';

export type IconName =
  | 'home'
  | 'map'
  | 'history'
  | 'user'
  | 'droplet'
  | 'bluetooth'
  | 'bluetooth-connected'
  | 'bluetooth-searching'
  | 'battery'
  | 'wifi'
  | 'wifi-off'
  | 'check'
  | 'alert-triangle'
  | 'alert-circle'
  | 'x'
  | 'search'
  | 'filter'
  | 'share'
  | 'chevron-right'
  | 'chevron-left'
  | 'refresh-cw'
  | 'arrow-right'
  | 'play'
  | 'compass'
  | 'map-pin'
  | 'eye'
  | 'info'
  | 'thermometer'
  | 'activity'
  | 'layers'
  | 'shield-check'
  | 'cloud-sync'
  | 'plus'
  | 'download';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

/**
 * Minimalist, precise vector stroke icon renderer (Lucide outline style)
 * Implemented using pure React Native Views for cross-platform reliability
 * without native font link dependencies.
 */
export const Icon: React.FC<IconProps> = ({ name, size = 20, color = '#475569' }) => {
  const s = size;
  const stroke = 1.75;

  const renderIcon = () => {
    switch (name) {
      case 'home':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.7,
                height: s * 0.55,
                borderWidth: stroke,
                borderColor: color,
                borderTopWidth: 0,
                marginTop: s * 0.25,
                borderBottomLeftRadius: 2,
                borderBottomRightRadius: 2,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: s * 0.12,
                width: s * 0.55,
                height: s * 0.55,
                borderTopWidth: stroke,
                borderLeftWidth: stroke,
                borderColor: color,
                transform: [{ rotate: '45deg' }],
              }}
            />
          </View>
        );

      case 'map':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.75,
                height: s * 0.7,
                borderWidth: stroke,
                borderColor: color,
                borderRadius: 2,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ width: 1, backgroundColor: color, height: '100%', marginLeft: '33%' }} />
              <View style={{ width: 1, backgroundColor: color, height: '100%', marginRight: '33%' }} />
            </View>
          </View>
        );

      case 'history':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.75,
                height: s * 0.75,
                borderRadius: s * 0.375,
                borderWidth: stroke,
                borderColor: color,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: stroke,
                  height: s * 0.25,
                  backgroundColor: color,
                  position: 'absolute',
                  top: s * 0.12,
                }}
              />
              <View
                style={{
                  width: s * 0.2,
                  height: stroke,
                  backgroundColor: color,
                  position: 'absolute',
                  left: s * 0.34,
                }}
              />
            </View>
          </View>
        );

      case 'user':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.38,
                height: s * 0.38,
                borderRadius: s * 0.19,
                borderWidth: stroke,
                borderColor: color,
                marginBottom: 2,
              }}
            />
            <View
              style={{
                width: s * 0.7,
                height: s * 0.32,
                borderTopLeftRadius: s * 0.35,
                borderTopRightRadius: s * 0.35,
                borderWidth: stroke,
                borderBottomWidth: 0,
                borderColor: color,
              }}
            />
          </View>
        );

      case 'droplet':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.55,
                height: s * 0.55,
                borderWidth: stroke,
                borderColor: color,
                borderBottomLeftRadius: s * 0.3,
                borderBottomRightRadius: s * 0.3,
                borderTopLeftRadius: s * 0.05,
                borderTopRightRadius: s * 0.3,
                transform: [{ rotate: '-45deg' }],
                marginTop: s * 0.1,
              }}
            />
          </View>
        );

      case 'bluetooth':
      case 'bluetooth-connected':
      case 'bluetooth-searching':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View style={{ width: stroke, height: s * 0.8, backgroundColor: color }} />
            <View
              style={{
                position: 'absolute',
                width: s * 0.35,
                height: s * 0.35,
                borderTopWidth: stroke,
                borderRightWidth: stroke,
                borderColor: color,
                transform: [{ rotate: '45deg' }],
                top: s * 0.12,
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: s * 0.35,
                height: s * 0.35,
                borderBottomWidth: stroke,
                borderRightWidth: stroke,
                borderColor: color,
                transform: [{ rotate: '-45deg' }],
                bottom: s * 0.12,
              }}
            />
          </View>
        );

      case 'battery':
        return (
          <View style={[styles.center, { width: s, height: s, flexDirection: 'row' }]}>
            <View
              style={{
                width: s * 0.7,
                height: s * 0.42,
                borderWidth: stroke,
                borderColor: color,
                borderRadius: 2,
                padding: 1.5,
              }}
            >
              <View style={{ width: '65%', height: '100%', backgroundColor: color, borderRadius: 1 }} />
            </View>
            <View style={{ width: 2, height: s * 0.2, backgroundColor: color, borderTopRightRadius: 1, borderBottomRightRadius: 1 }} />
          </View>
        );

      case 'check':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.55,
                height: s * 0.3,
                borderBottomWidth: stroke + 0.5,
                borderLeftWidth: stroke + 0.5,
                borderColor: color,
                transform: [{ rotate: '-45deg' }],
                marginBottom: s * 0.1,
              }}
            />
          </View>
        );

      case 'alert-triangle':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.75,
                height: s * 0.7,
                borderWidth: stroke,
                borderColor: color,
                borderTopLeftRadius: 2,
                transform: [{ rotate: '45deg' }],
              }}
            />
            <View style={{ position: 'absolute', width: stroke, height: s * 0.22, backgroundColor: color, top: s * 0.3 }} />
            <View style={{ position: 'absolute', width: stroke + 1, height: stroke + 1, borderRadius: 1, backgroundColor: color, bottom: s * 0.28 }} />
          </View>
        );

      case 'alert-circle':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.8,
                height: s * 0.8,
                borderRadius: s * 0.4,
                borderWidth: stroke,
                borderColor: color,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ width: stroke, height: s * 0.28, backgroundColor: color, position: 'absolute', top: s * 0.16 }} />
              <View style={{ width: stroke + 1, height: stroke + 1, borderRadius: 1, backgroundColor: color, position: 'absolute', bottom: s * 0.16 }} />
            </View>
          </View>
        );

      case 'x':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View style={{ position: 'absolute', width: s * 0.65, height: stroke, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
            <View style={{ position: 'absolute', width: s * 0.65, height: stroke, backgroundColor: color, transform: [{ rotate: '-45deg' }] }} />
          </View>
        );

      case 'search':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.52,
                height: s * 0.52,
                borderRadius: s * 0.26,
                borderWidth: stroke,
                borderColor: color,
                position: 'absolute',
                top: s * 0.12,
                left: s * 0.15,
              }}
            />
            <View
              style={{
                width: stroke,
                height: s * 0.32,
                backgroundColor: color,
                position: 'absolute',
                bottom: s * 0.12,
                right: s * 0.2,
                transform: [{ rotate: '-45deg' }],
              }}
            />
          </View>
        );

      case 'filter':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.7,
                height: stroke,
                backgroundColor: color,
                position: 'absolute',
                top: s * 0.2,
              }}
            />
            <View
              style={{
                width: s * 0.46,
                height: stroke,
                backgroundColor: color,
                position: 'absolute',
                top: s * 0.46,
              }}
            />
            <View
              style={{
                width: s * 0.22,
                height: stroke,
                backgroundColor: color,
                position: 'absolute',
                top: s * 0.72,
              }}
            />
          </View>
        );

      case 'chevron-right':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.35,
                height: s * 0.35,
                borderTopWidth: stroke,
                borderRightWidth: stroke,
                borderColor: color,
                transform: [{ rotate: '45deg' }],
                marginRight: 2,
              }}
            />
          </View>
        );

      case 'chevron-left':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.35,
                height: s * 0.35,
                borderBottomWidth: stroke,
                borderLeftWidth: stroke,
                borderColor: color,
                transform: [{ rotate: '45deg' }],
                marginLeft: 2,
              }}
            />
          </View>
        );

      case 'arrow-right':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View style={{ width: s * 0.65, height: stroke, backgroundColor: color }} />
            <View
              style={{
                position: 'absolute',
                right: s * 0.16,
                width: s * 0.32,
                height: s * 0.32,
                borderTopWidth: stroke,
                borderRightWidth: stroke,
                borderColor: color,
                transform: [{ rotate: '45deg' }],
              }}
            />
          </View>
        );

      case 'map-pin':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.5,
                height: s * 0.5,
                borderRadius: s * 0.25,
                borderWidth: stroke,
                borderColor: color,
                marginBottom: 2,
              }}
            />
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: 4,
                borderRightWidth: 4,
                borderTopWidth: 5,
                borderStyle: 'solid',
                backgroundColor: 'transparent',
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderTopColor: color,
                marginTop: -2,
              }}
            />
          </View>
        );

      case 'refresh-cw':
      case 'cloud-sync':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.72,
                height: s * 0.72,
                borderRadius: s * 0.36,
                borderWidth: stroke,
                borderColor: color,
                borderRightColor: 'transparent',
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: s * 0.12,
                right: s * 0.18,
                width: 0,
                height: 0,
                borderLeftWidth: 3,
                borderRightWidth: 3,
                borderBottomWidth: 5,
                borderStyle: 'solid',
                backgroundColor: 'transparent',
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: color,
              }}
            />
          </View>
        );

      case 'shield-check':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.65,
                height: s * 0.75,
                borderWidth: stroke,
                borderColor: color,
                borderBottomLeftRadius: s * 0.35,
                borderBottomRightRadius: s * 0.35,
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: s * 0.3,
                height: s * 0.18,
                borderBottomWidth: stroke,
                borderLeftWidth: stroke,
                borderColor: color,
                transform: [{ rotate: '-45deg' }],
                marginBottom: 2,
              }}
            />
          </View>
        );

      case 'activity':
      case 'layers':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.7,
                height: s * 0.45,
                borderWidth: stroke,
                borderColor: color,
                borderRadius: 2,
              }}
            />
            <View style={{ width: s * 0.4, height: stroke, backgroundColor: color, marginTop: 3 }} />
          </View>
        );

      case 'thermometer':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.22,
                height: s * 0.5,
                borderWidth: stroke,
                borderColor: color,
                borderTopLeftRadius: s * 0.1,
                borderTopRightRadius: s * 0.1,
                borderBottomWidth: 0,
              }}
            />
            <View
              style={{
                width: s * 0.42,
                height: s * 0.42,
                borderRadius: s * 0.21,
                borderWidth: stroke,
                borderColor: color,
                marginTop: -4,
                backgroundColor: color,
              }}
            />
          </View>
        );

      case 'share':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.6,
                height: s * 0.45,
                borderWidth: stroke,
                borderColor: color,
                borderTopWidth: 0,
                borderRadius: 2,
                marginTop: s * 0.2,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: s * 0.12,
                width: stroke,
                height: s * 0.42,
                backgroundColor: color,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: s * 0.12,
                width: s * 0.24,
                height: s * 0.24,
                borderTopWidth: stroke,
                borderLeftWidth: stroke,
                borderColor: color,
                transform: [{ rotate: '45deg' }],
              }}
            />
          </View>
        );

      case 'download':
        return (
          <View style={[styles.center, { width: s, height: s }]}>
            <View
              style={{
                width: s * 0.7,
                height: s * 0.35,
                borderWidth: stroke,
                borderColor: color,
                borderTopWidth: 0,
                borderRadius: 2,
                marginTop: s * 0.3,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: s * 0.15,
                width: stroke,
                height: s * 0.4,
                backgroundColor: color,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: s * 0.35,
                width: s * 0.25,
                height: s * 0.25,
                borderBottomWidth: stroke,
                borderRightWidth: stroke,
                borderColor: color,
                transform: [{ rotate: '45deg' }],
              }}
            />
          </View>
        );

      default:
        return (
          <View
            style={[
              styles.center,
              { width: s * 0.6, height: s * 0.6, borderRadius: 2, borderWidth: stroke, borderColor: color },
            ]}
          />
        );
    }
  };

  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>{renderIcon()}</View>;
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
