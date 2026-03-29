import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { usePlantCareStyles } from '../../screens/plantCare/PlantCare.style';

type TabKey = string;

export type PlantTabItem<T extends TabKey> = {
  key: T;
  label: string;
  count: number;
};

export type PlantTabsProps<T extends TabKey> = {
  tabs: Array<PlantTabItem<T>>;
  activeTab: T;
  onChange: (next: T) => void;
};

export function PlantTabs<T extends TabKey>({ tabs, activeTab, onChange }: PlantTabsProps<T>) {
  const { styles } = usePlantCareStyles();

  return (
    <View style={styles.tabsContainer}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChange(tab.key)}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
            <Text style={[styles.tabCount, isActive && styles.tabCountActive]}>{tab.count}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
