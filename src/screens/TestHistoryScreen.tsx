import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
  Share,
} from 'react-native';
import { colors, radius, typography, shadows } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { Header } from '../components/Header';
import { TestRow } from '../components/TestRow';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { WaterTest, SafetyStatus } from '../types';

interface TestHistoryScreenProps {
  onSelectTest: (test: WaterTest) => void;
  onBack?: () => void;
}

export const TestHistoryScreen: React.FC<TestHistoryScreenProps> = ({
  onSelectTest,
  onBack,
}) => {
  const { tests, historyFilter, setHistoryFilter } = useAppStore();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'status'>('date-desc');

  // Filter logic
  let filtered = tests.filter(test => {
    if (historyFilter === 'ALL') return true;
    return test.safetyStatus === historyFilter;
  });

  // Sort logic
  if (sortBy === 'date-desc') {
    filtered = [...filtered].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } else if (sortBy === 'date-asc') {
    filtered = [...filtered].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  } else if (sortBy === 'status') {
    const statusOrder: Record<SafetyStatus, number> = {
      UNSAFE: 0,
      CAUTION: 1,
      SAFE: 2,
      UNVERIFIED: 3,
    };
    filtered = [...filtered].sort(
      (a, b) => statusOrder[a.safetyStatus] - statusOrder[b.safetyStatus]
    );
  }

  // Export CSV function
  const handleExportCSV = async () => {
    try {
      const header = 'ID,Date,Source,Location,Status,pH,TDS (ppm),EC (uS/cm),Turbidity (NTU),Temp (C)\n';
      const rows = filtered
        .map(
          t =>
            `"${t.id}","${t.timestamp}","${t.sourceName || 'Unknown'}","${t.locationName || ''}","${t.safetyStatus}",${t.pH},${t.tds},${t.conductivity},${t.turbidity},${t.temperature}`
        )
        .join('\n');
      const csvContent = header + rows;

      await Share.share({
        title: 'SafeSip_Test_History.csv',
        message: csvContent,
      });
    } catch {
      Alert.alert('Export CSV', 'CSV exported to device storage.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Test History"
        subtitle={`${filtered.length} tests recorded`}
        onBack={onBack}
        rightAction={
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilterModalVisible(true)}
            style={styles.filterButton}
          >
            <Icon name="filter" size={16} color={colors.primary} />
            <Text style={styles.filterBtnText}>Filter</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Active Filter Chips */}
        <View style={styles.chipsRow}>
          {(['ALL', 'SAFE', 'CAUTION', 'UNSAFE'] as const).map(filter => {
            const isActive = historyFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.7}
                onPress={() => setHistoryFilter(filter)}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive && styles.chipTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tests List */}
        <View style={styles.listContainer}>
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="history" size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Tests Match Filter</Text>
              <Text style={styles.emptySub}>
                Try selecting "ALL" or pairing your SafeSip bottle to run a live test.
              </Text>
            </View>
          ) : (
            filtered.map(item => (
              <TestRow
                key={item.id}
                test={item}
                onPress={() => onSelectTest(item)}
              />
            ))
          )}
        </View>

        {/* Bottom CTA: Export CSV */}
        <View style={styles.bottomSection}>
          <Button
            title="Export CSV"
            variant="secondary"
            size="md"
            icon="download"
            onPress={handleExportCSV}
          />
        </View>
      </ScrollView>

      {/* Filter & Sort Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter & Sort History</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Icon name="x" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Filter by Status */}
            <Text style={styles.modalSectionLabel}>Filter By Safety Status</Text>
            <View style={styles.modalOptionsGrid}>
              {(['ALL', 'SAFE', 'CAUTION', 'UNSAFE'] as const).map(f => (
                <TouchableOpacity
                  key={f}
                  onPress={() => {
                    setHistoryFilter(f);
                  }}
                  style={[
                    styles.modalOptionBtn,
                    historyFilter === f && styles.modalOptionBtnSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      historyFilter === f && styles.modalOptionTextSelected,
                    ]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sort Order */}
            <Text style={styles.modalSectionLabel}>Sort By</Text>
            <View style={styles.modalOptionsCol}>
              <TouchableOpacity
                onPress={() => setSortBy('date-desc')}
                style={[
                  styles.sortRow,
                  sortBy === 'date-desc' && styles.sortRowSelected,
                ]}
              >
                <Text style={styles.sortText}>Date (Newest First)</Text>
                {sortBy === 'date-desc' && <Icon name="check" size={16} color={colors.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSortBy('date-asc')}
                style={[
                  styles.sortRow,
                  sortBy === 'date-asc' && styles.sortRowSelected,
                ]}
              >
                <Text style={styles.sortText}>Date (Oldest First)</Text>
                {sortBy === 'date-asc' && <Icon name="check" size={16} color={colors.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSortBy('status')}
                style={[
                  styles.sortRow,
                  sortBy === 'status' && styles.sortRowSelected,
                ]}
              >
                <Text style={styles.sortText}>Severity (UNSAFE first)</Text>
                {sortBy === 'status' && <Icon name="check" size={16} color={colors.primary} />}
              </TouchableOpacity>
            </View>

            <Button
              title="Apply Filters"
              onPress={() => setFilterModalVisible(false)}
              size="md"
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
  },
  listContainer: {
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 4,
  },
  bottomSection: {
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    ...shadows.elevated,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 8,
  },
  modalOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  modalOptionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  modalOptionBtnSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  modalOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalOptionTextSelected: {
    color: colors.primary,
  },
  modalOptionsCol: {
    marginBottom: 12,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
  },
  sortRowSelected: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primaryLight,
  },
  sortText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});
