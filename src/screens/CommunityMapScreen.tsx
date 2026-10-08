import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { colors, radius, typography, shadows } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { Icon } from '../components/Icon';
import { SourceCard } from '../components/SourceCard';
import { WaterSource, SafetyStatus } from '../types';

interface CommunityMapScreenProps {
  onSelectSource: (source: WaterSource) => void;
}

const { width } = Dimensions.get('window');

export const CommunityMapScreen: React.FC<CommunityMapScreenProps> = ({ onSelectSource }) => {
  const { sources, selectedSourceId, setSelectedSourceId } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | SafetyStatus>('ALL');
  const [zoomLevel, setZoomLevel] = useState(14);

  const filteredSources = sources.filter(source => {
    const matchesFilter = selectedFilter === 'ALL' || source.safetyStatus === selectedFilter;
    const matchesSearch =
      source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      source.locationName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const selectedSource = sources.find(s => s.id === selectedSourceId) || sources[0];

  const getMarkerColor = (status: SafetyStatus) => {
    switch (status) {
      case 'SAFE':
        return colors.safe;
      case 'CAUTION':
        return colors.caution;
      case 'UNSAFE':
        return colors.unsafe;
      case 'UNVERIFIED':
      default:
        return colors.unverified;
    }
  };

  // Coordinates offset visual mapping for interactive map canvas
  const mapCenter = { lat: 37.7749, lng: -122.4194 };

  const getMarkerOffset = (lat: number, lng: number) => {
    const scale = 3800 * (zoomLevel / 14);
    const x = (lng - mapCenter.lng) * scale + width / 2;
    const y = -(lat - mapCenter.lat) * scale + 240;
    return { left: Math.max(20, Math.min(width - 50, x)), top: Math.max(80, Math.min(380, y)) };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Search & Filter Bar */}
      <View style={styles.topControlOverlay}>
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Search location, spring, well…"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <Icon name="filter" size={16} color={colors.textMuted} />
          )}
        </View>

        {/* Quick Filter Horizontal Scroll */}
        <View style={styles.filterRow}>
          {(['ALL', 'SAFE', 'CAUTION', 'UNSAFE', 'UNVERIFIED'] as const).map(filter => {
            const isSelected = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.7}
                onPress={() => setSelectedFilter(filter)}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
              >
                {filter !== 'ALL' && (
                  <View
                    style={[
                      styles.filterDot,
                      { backgroundColor: getMarkerColor(filter as SafetyStatus) },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Map Canvas with OpenStreetMap tile styling and interactive pins */}
      <View style={styles.mapContainer}>
        {/* Realistic OpenStreetMap Grid & Water Bodies Vector Canvas */}
        <View style={styles.mapCanvas}>
          {/* Simulated Lake / Reservoir Water Body */}
          <View style={styles.lakeArea} />
          {/* Creek stream line */}
          <View style={styles.streamLine} />
          {/* Streets & Road Grid */}
          <View style={[styles.roadLine, { top: 120, width: '100%' }]} />
          <View style={[styles.roadLine, { top: 230, width: '100%' }]} />
          <View style={[styles.roadLineVertical, { left: 90, height: '100%' }]} />
          <View style={[styles.roadLineVertical, { left: 240, height: '100%' }]} />

          {/* Current User Smartphone GPS Marker */}
          <View
            style={[
              styles.userLocationMarker,
              { left: width / 2 - 12, top: 230 },
            ]}
          >
            <View style={styles.userPulseRing} />
            <View style={styles.userDot} />
          </View>

          {/* Water Source Interactive Markers */}
          {filteredSources.map(source => {
            const pos = getMarkerOffset(source.latitude, source.longitude);
            const isSelected = source.id === selectedSource?.id;
            const markerBg = getMarkerColor(source.safetyStatus);

            return (
              <TouchableOpacity
                key={source.id}
                activeOpacity={0.8}
                onPress={() => setSelectedSourceId(source.id)}
                style={[
                  styles.markerContainer,
                  { left: pos.left, top: pos.top },
                  isSelected && styles.markerContainerSelected,
                ]}
              >
                <View style={[styles.markerPin, { backgroundColor: markerBg }]}>
                  <Icon name="droplet" size={13} color={colors.white} />
                </View>
                <View style={[styles.markerArrow, { borderTopColor: markerBg }]} />

                {isSelected && (
                  <View style={styles.markerNameBadge}>
                    <Text style={styles.markerBadgeText} numberOfLines={1}>
                      {source.name}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Map Controls: Zoom in/out, Re-center GPS */}
        <View style={styles.mapFloatingControls}>
          <TouchableOpacity
            style={styles.mapControlBtn}
            onPress={() => setZoomLevel(prev => Math.min(18, prev + 1))}
          >
            <Text style={styles.controlSign}>+</Text>
          </TouchableOpacity>
          <View style={styles.controlDivider} />
          <TouchableOpacity
            style={styles.mapControlBtn}
            onPress={() => setZoomLevel(prev => Math.max(10, prev - 1))}
          >
            <Text style={styles.controlSign}>−</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mapControlBtn, { marginTop: 10 }]}
            onPress={() => setSelectedSourceId(sources[0].id)}
          >
            <Icon name="compass" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* OSM Attribution Badge */}
        <View style={styles.osmBadge}>
          <Text style={styles.osmText}>© OpenStreetMap • MapLibre</Text>
        </View>
      </View>

      {/* Bottom Compact Source Preview Card */}
      {selectedSource && (
        <View style={styles.bottomSheetPreview}>
          <SourceCard
            source={selectedSource}
            onPress={() => onSelectSource(selectedSource)}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topControlOverlay: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextSelected: {
    color: colors.primary,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  mapCanvas: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#EEF2F6',
  },
  lakeArea: {
    position: 'absolute',
    top: 70,
    left: 40,
    width: 220,
    height: 140,
    borderRadius: 40,
    backgroundColor: '#BAE6FD',
    opacity: 0.8,
    transform: [{ rotate: '-12deg' }],
  },
  streamLine: {
    position: 'absolute',
    top: 170,
    left: 120,
    width: 180,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7DD3FC',
    transform: [{ rotate: '42deg' }],
  },
  roadLine: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  roadLineVertical: {
    position: 'absolute',
    width: 4,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  userLocationMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPulseRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
  },
  userDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  markerContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 5,
  },
  markerContainerSelected: {
    zIndex: 10,
    transform: [{ scale: 1.15 }],
  },
  markerPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  markerNameBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 2,
    ...shadows.subtle,
  },
  markerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mapFloatingControls: {
    position: 'absolute',
    right: 16,
    top: 20,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    overflow: 'hidden',
  },
  mapControlBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlSign: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  controlDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  osmBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  osmText: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  bottomSheetPreview: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 6,
    backgroundColor: colors.background,
  },
});
