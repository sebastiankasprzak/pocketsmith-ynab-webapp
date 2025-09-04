import { useState, useCallback, useMemo } from 'react';

export interface SelectionState<T> {
  selectedItems: Set<T>;
  isSelected: (item: T) => boolean;
  toggleSelection: (item: T) => void;
  selectAll: (items: T[]) => void;
  clearSelection: () => void;
  selectedCount: number;
  isAllSelected: (items: T[]) => boolean;
  isSomeSelected: (items: T[]) => boolean;
}

/**
 * Hook for managing selection state in lists with bulk operations
 */
export const useSelectionState = <T>(): SelectionState<T> => {
  const [selectedItems, setSelectedItems] = useState<Set<T>>(new Set());

  const isSelected = useCallback((item: T) => {
    return selectedItems.has(item);
  }, [selectedItems]);

  const toggleSelection = useCallback((item: T) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((items: T[]) => {
    setSelectedItems(new Set(items));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const selectedCount = selectedItems.size;

  const isAllSelected = useCallback((items: T[]) => {
    return items.length > 0 && items.every(item => selectedItems.has(item));
  }, [selectedItems]);

  const isSomeSelected = useCallback((items: T[]) => {
    return items.some(item => selectedItems.has(item));
  }, [selectedItems]);

  return useMemo(() => ({
    selectedItems,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    selectedCount,
    isAllSelected,
    isSomeSelected,
  }), [
    selectedItems,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    selectedCount,
    isAllSelected,
    isSomeSelected,
  ]);
};

export default useSelectionState;