import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
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
  const {
    sources,
    selectedSourceId,
    setSelectedSourceId,
    loadUserSources,
    subscribeToRealtimeSources,
  } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | SafetyStatus>('ALL');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  const webViewRef = useRef<WebView>(null);
  const slideAnim = useRef(new Animated.Value(200)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadUserSources();
    const unsubscribe = subscribeToRealtimeSources();
    return () => {
      unsubscribe();
    };
  }, [loadUserSources, subscribeToRealtimeSources]);

  // Pulse animation for heatmap toggle indicator
  useEffect(() => {
    if (showHeatmap) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [showHeatmap, pulseAnim]);

  const filteredSources = useMemo(() => {
    return sources.filter(source => {
      const matchesFilter = selectedFilter === 'ALL' || source.safetyStatus === selectedFilter;
      const matchesSearch =
        (source.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (source.locationName || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [sources, selectedFilter, searchQuery]);

  const selectedSource = useMemo(() => {
    return sources.find(s => s.id === selectedSourceId) || null;
  }, [sources, selectedSourceId]);

  // Animate bottom card when selection changes
  useEffect(() => {
    if (selectedSource) {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 260,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedSource, slideAnim]);

  // Sync state changes into the Leaflet WebView
  useEffect(() => {
    if (mapLoaded && webViewRef.current) {
      const script = `
        if (window.updateMapData) {
          window.updateMapData(
            ${JSON.stringify(filteredSources)},
            ${JSON.stringify(showHeatmap)},
            ${JSON.stringify(selectedSourceId)}
          );
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [filteredSources, showHeatmap, selectedSourceId, mapLoaded]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_SOURCE') {
        setSelectedSourceId(data.id);
      } else if (data.type === 'DESELECT') {
        setSelectedSourceId(null);
      } else if (data.type === 'MAP_READY') {
        setMapLoaded(true);
      }
    } catch {
      // ignore parse errors
    }
  };

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

  // Default coordinates: if user has sources, center around first source; else a global default
  const defaultCenter = useMemo(() => {
    if (sources.length > 0) {
      return { lat: sources[0].latitude, lng: sources[0].longitude };
    }
    return { lat: 37.7749, lng: -122.4194 };
  }, [sources]);

  // Generate Leaflet HTML with Heatmap support
  const mapHtml = useMemo(() => {
    const serializedSources = JSON.stringify(filteredSources);
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #0F172A; }
    .custom-pin {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
    }
    .pin-bubble {
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #FFFFFF;
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      transition: transform 0.2s ease;
    }
    .pin-bubble.selected {
      transform: rotate(-45deg) scale(1.25);
      box-shadow: 0 0 16px rgba(14, 165, 233, 0.9);
      border-color: #38BDF8;
    }
    .pin-dot {
      width: 10px;
      height: 10px;
      background: #FFFFFF;
      border-radius: 50%;
      transform: rotate(45deg);
    }
    .pin-label {
      background: rgba(15, 23, 42, 0.85);
      color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
      white-space: nowrap;
      margin-top: 4px;
      border: 1px solid rgba(255,255,255,0.15);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .leaflet-control-attribution { display: none !important; }
    .pulse-ring {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(14, 165, 233, 0.4);
      position: absolute;
      top: -4px;
      left: -4px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.9; }
      70% { transform: scale(1.9); opacity: 0; }
      100% { transform: scale(0.9); opacity: 0; }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
  <script>
    var map;
    var markersLayer = L.layerGroup();
    var heatLayer = null;
    var allSources = ${serializedSources};
    var isHeatmapOn = ${showHeatmap ? 'true' : 'false'};
    var currentSelectedId = ${JSON.stringify(selectedSourceId)};

    function initMap() {
      map = L.map('map', {
        zoomControl: false,
        attributionControl: false
      }).setView([${defaultCenter.lat}, ${defaultCenter.lng}], 13);

      // Clean, modern high-res tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      markersLayer.addTo(map);

      map.on('click', function(e) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DESELECT' }));
        }
      });

      renderData();

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      }
    }

    function getStatusColor(status) {
      if (status === 'SAFE') return '#10B981';
      if (status === 'CAUTION') return '#F59E0B';
      if (status === 'UNSAFE') return '#EF4444';
      return '#94A3B8';
    }

    function getHeatIntensity(source) {
      // Unsafe water sources get highest contamination heat signature (red hot spot)
      if (source.safetyStatus === 'UNSAFE') return 1.0;
      if (source.safetyStatus === 'CAUTION') return 0.6;
      if (source.safetyStatus === 'SAFE') return 0.2;
      return 0.1;
    }

    function renderData() {
      markersLayer.clearLayers();
      if (heatLayer) {
        map.removeLayer(heatLayer);
        heatLayer = null;
      }

      // 1. Render Heatmap Layer if active
      if (isHeatmapOn && allSources.length > 0) {
        var heatPoints = allSources.map(function(s) {
          return [s.latitude, s.longitude, getHeatIntensity(s)];
        });

        heatLayer = L.heatLayer(heatPoints, {
          radius: 35,
          blur: 20,
          maxZoom: 17,
          max: 1.0,
          gradient: {
            0.1: '#10B981', // Safe = Green
            0.4: '#F59E0B', // Caution = Amber
            0.8: '#EF4444', // Unsafe = Red
            1.0: '#991B1B'  // Critical = Dark Red
          }
        }).addTo(map);
      }

      // 2. Render Interactive Water Source Markers
      allSources.forEach(function(s) {
        var color = getStatusColor(s.safetyStatus);
        var isSelected = (s.id === currentSelectedId);

        var iconHtml = '<div class="custom-pin">' +
          '<div class="pin-bubble ' + (isSelected ? 'selected' : '') + '" style="background: ' + color + ';">' +
            '<div class="pin-dot"></div>' +
          '</div>' +
          (isSelected ? '<div class="pin-label">' + (s.name || 'Source') + '</div>' : '') +
        '</div>';

        var icon = L.divIcon({
          className: '',
          html: iconHtml,
          iconSize: [32, 42],
          iconAnchor: [16, 32]
        });

        var marker = L.marker([s.latitude, s.longitude], { icon: icon });
        marker.on('click', function(e) {
          L.DomEvent.stopPropagation(e);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_SOURCE', id: s.id }));
          }
          map.panTo([s.latitude, s.longitude], { animate: true, duration: 0.6 });
        });

        markersLayer.addLayer(marker);
      });
    }

    window.updateMapData = function(newSources, heatmapEnabled, selectedId) {
      allSources = newSources || [];
      isHeatmapOn = heatmapEnabled;
      currentSelectedId = selectedId;
      renderData();
    };

    window.zoomIn = function() { map.zoomIn(); };
    window.zoomOut = function() { map.zoomOut(); };
    window.recenterMap = function() {
      if (allSources.length > 0) {
        var bounds = L.latLngBounds(allSources.map(function(s) { return [s.latitude, s.longitude]; }));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else {
        map.setView([${defaultCenter.lat}, ${defaultCenter.lng}], 13);
      }
    };

    document.addEventListener('DOMContentLoaded', initMap);
  </script>
</body>
</html>
    `;
  }, [defaultCenter, filteredSources, selectedSourceId, showHeatmap]);

  const handleZoomIn = () => {
    webViewRef.current?.injectJavaScript('window.zoomIn && window.zoomIn(); true;');
  };

  const handleZoomOut = () => {
    webViewRef.current?.injectJavaScript('window.zoomOut && window.zoomOut(); true;');
  };

  const handleRecenter = () => {
    webViewRef.current?.injectJavaScript('window.recenterMap && window.recenterMap(); true;');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Search & Filter Bar */}
      <View style={styles.topControlOverlay}>
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Search water sources, wells, springs…"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="x" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <Icon name="filter" size={16} color={colors.textMuted} />
          )}
        </View>

        {/* Filter Chips & Heatmap Mode Switcher */}
        <View style={styles.filterRow}>
          <View style={styles.chipsContainer}>
            {(['ALL', 'SAFE', 'CAUTION', 'UNSAFE'] as const).map(filter => {
              const isSelected = selectedFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  activeOpacity={0.7}
                  onPress={() => setSelectedFilter(filter)}
                  style={[styles.filterChip, isSelected && styles.filterChipSelected]}
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

          {/* Heatmap Toggle Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowHeatmap(prev => !prev)}
            style={[styles.heatmapToggleBtn, showHeatmap && styles.heatmapToggleBtnActive]}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Icon
                name="activity"
                size={14}
                color={showHeatmap ? colors.white : colors.textSecondary}
              />
            </Animated.View>
            <Text
              style={[
                styles.heatmapToggleText,
                showHeatmap && styles.heatmapToggleTextActive,
              ]}
            >
              Heatmap
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive Map View */}
      <View style={styles.mapContainer}>
        {React.createElement(WebView as any, {
          ref: webViewRef,
          originWhitelist: ['*'],
          source: { html: mapHtml },
          style: styles.webView,
          javaScriptEnabled: true,
          domStorageEnabled: true,
          onMessage: handleMessage,
          startInLoadingState: true,
          renderLoading: () => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading Interactive Water Quality Map…</Text>
            </View>
          ),
        })}

        {/* Heatmap Legend Bar (Visible when Heatmap is ON) */}
        {showHeatmap && (
          <View style={styles.heatmapLegend}>
            <Text style={styles.legendTitle}>Contamination Heatmap</Text>
            <View style={styles.legendGradientBar}>
              <View style={[styles.gradientSegment, { backgroundColor: '#10B981' }]} />
              <View style={[styles.gradientSegment, { backgroundColor: '#F59E0B' }]} />
              <View style={[styles.gradientSegment, { backgroundColor: '#EF4444' }]} />
            </View>
            <View style={styles.legendLabels}>
              <Text style={styles.legendLabelText}>Safe</Text>
              <Text style={styles.legendLabelText}>Caution</Text>
              <Text style={styles.legendLabelText}>Hazardous</Text>
            </View>
          </View>
        )}

        {/* Floating Zoom & GPS Map Controls */}
        <View style={styles.mapFloatingControls}>
          <TouchableOpacity
            style={styles.mapControlBtn}
            onPress={handleZoomIn}
            activeOpacity={0.7}
          >
            <Text style={styles.controlSign}>+</Text>
          </TouchableOpacity>
          <View style={styles.controlDivider} />
          <TouchableOpacity
            style={styles.mapControlBtn}
            onPress={handleZoomOut}
            activeOpacity={0.7}
          >
            <Text style={styles.controlSign}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mapControlBtn, { marginTop: 10 }]}
            onPress={handleRecenter}
            activeOpacity={0.7}
          >
            <Icon name="compass" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Empty State Banner if no sources in area */}
        {filteredSources.length === 0 && (
          <View style={styles.emptyMapBanner}>
            <Icon name="info" size={16} color={colors.primary} />
            <Text style={styles.emptyMapText}>
              No water test points recorded yet. Pair your HC-05 bottle and test to plot the first location!
            </Text>
          </View>
        )}
      </View>

      {/* Animated Bottom Preview Card */}
      {selectedSource && (
        <Animated.View
          style={[
            styles.bottomSheetPreview,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.sheetHeaderTitle}>Selected Source</Text>
            <TouchableOpacity
              onPress={() => setSelectedSourceId(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="x" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <SourceCard
            source={selectedSource}
            onPress={() => onSelectSource(selectedSource)}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  topControlOverlay: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    zIndex: 20,
    ...shadows.subtle,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    marginLeft: 8,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  heatmapToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 5,
  },
  heatmapToggleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.subtle,
  },
  heatmapToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  heatmapToggleTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  heatmapLegend: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
    ...shadows.card,
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F8FAFC',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  legendGradientBar: {
    flexDirection: 'row',
    height: 6,
    width: 140,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  gradientSegment: {
    flex: 1,
    height: '100%',
  },
  legendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendLabelText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
  },
  mapFloatingControls: {
    position: 'absolute',
    right: 14,
    top: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 4,
    alignItems: 'center',
    zIndex: 10,
    ...shadows.card,
  },
  mapControlBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlSign: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  controlDivider: {
    height: 1,
    width: 24,
    backgroundColor: colors.borderLight,
  },
  emptyMapBanner: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryLight,
    gap: 10,
    ...shadows.card,
  },
  emptyMapText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bottomSheetPreview: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...shadows.elevated,
    zIndex: 30,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
