import { useState, useCallback } from 'react';

export const useItemSelection = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const toggleSelectAll = useCallback((items) => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(items.map(item => item.id));
      setSelectAll(true);
    }
  }, [selectAll]);

  const toggleItemSelection = useCallback((itemId) => {
    setSelectedItems(prev => {
      const isSelected = prev.includes(itemId);
      if (isSelected) {
        setSelectAll(false);
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  }, []);

  const isItemSelected = useCallback((itemId) => {
    return selectedItems.includes(itemId);
  }, [selectedItems]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
    setSelectAll(false);
  }, []);

  return {
    selectedItems,
    selectAll,
    toggleSelectAll,
    toggleItemSelection,
    isItemSelected,
    clearSelection
  };
};

export default useItemSelection; 