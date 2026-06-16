import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface FilterState {
  startDate: string;
  endDate: string;
  store: string;
  file: string;
  flag: string[]; // REGULAR, TOCADORA
  respondentType: string[]; // promotor, neutro, detrator
  sentiment: string[];
  category: string[];
  aiStatus: string[]; // mantida, reclassificada, divergente, inconsistente
}

const initialFilters: FilterState = {
  startDate: '',
  endDate: '',
  store: '',
  file: '',
  flag: [],
  respondentType: [],
  sentiment: [],
  category: [],
  aiStatus: [],
};

interface FilterContextType {
  filters: FilterState;
  isDrawerOpen: boolean;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  updateFilter: (key: keyof FilterState, value: any) => void;
  clearFilters: () => void;
  removeFilterItem: (key: keyof FilterState, itemValue?: string) => void;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  activeFilterCount: number;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const removeFilterItem = (key: keyof FilterState, itemValue?: string) => {
    setFilters((prev) => {
      const current = prev[key];
      if (Array.isArray(current) && itemValue) {
        return {
          ...prev,
          [key]: current.filter((v) => v !== itemValue),
        };
      }
      return {
        ...prev,
        [key]: initialFilters[key],
      };
    });
  };

  const activeFilterCount = Object.keys(filters).reduce((count, key) => {
    const value = filters[key as keyof FilterState];
    if (Array.isArray(value)) {
      return count + value.length;
    }
    return value ? count + 1 : count;
  }, 0);

  return (
    <FilterContext.Provider
      value={{
        filters,
        isDrawerOpen,
        setFilters,
        updateFilter,
        clearFilters,
        removeFilterItem,
        toggleDrawer,
        openDrawer,
        closeDrawer,
        activeFilterCount,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
