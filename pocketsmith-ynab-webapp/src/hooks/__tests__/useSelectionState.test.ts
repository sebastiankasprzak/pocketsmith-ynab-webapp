import { renderHook, act } from '@testing-library/react';
import { useSelectionState } from '../useSelectionState';

describe('useSelectionState', () => {
  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useSelectionState<string>());
    
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.selectedItems.size).toBe(0);
    expect(result.current.isSelected('item1')).toBe(false);
  });

  it('should toggle selection correctly', () => {
    const { result } = renderHook(() => useSelectionState<string>());
    
    act(() => {
      result.current.toggleSelection('item1');
    });
    
    expect(result.current.isSelected('item1')).toBe(true);
    expect(result.current.selectedCount).toBe(1);
    
    act(() => {
      result.current.toggleSelection('item1');
    });
    
    expect(result.current.isSelected('item1')).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it('should select all items', () => {
    const { result } = renderHook(() => useSelectionState<string>());
    const items = ['item1', 'item2', 'item3'];
    
    act(() => {
      result.current.selectAll(items);
    });
    
    expect(result.current.selectedCount).toBe(3);
    expect(result.current.isAllSelected(items)).toBe(true);
    items.forEach(item => {
      expect(result.current.isSelected(item)).toBe(true);
    });
  });

  it('should clear selection', () => {
    const { result } = renderHook(() => useSelectionState<string>());
    const items = ['item1', 'item2'];
    
    act(() => {
      result.current.selectAll(items);
    });
    
    expect(result.current.selectedCount).toBe(2);
    
    act(() => {
      result.current.clearSelection();
    });
    
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected(items)).toBe(false);
  });

  it('should detect partial selection', () => {
    const { result } = renderHook(() => useSelectionState<string>());
    const items = ['item1', 'item2', 'item3'];
    
    act(() => {
      result.current.toggleSelection('item1');
    });
    
    expect(result.current.isSomeSelected(items)).toBe(true);
    expect(result.current.isAllSelected(items)).toBe(false);
  });
});