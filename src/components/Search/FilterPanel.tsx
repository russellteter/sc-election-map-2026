'use client';

import { useState, useRef, useEffect } from 'react';

export interface FilterState {
  party: string[];
  hasCandidate: 'all' | 'yes' | 'no';
  contested: 'all' | 'yes' | 'no';
  opportunity: string[];
  showRepublicanData: boolean;
  republicanDataMode: 'none' | 'incumbents' | 'challengers' | 'all';
}

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  className?: string;
  variant?: 'dropdown' | 'horizontal';
}

export const defaultFilters: FilterState = {
  party: [],
  hasCandidate: 'all',
  contested: 'all',
  opportunity: [],
  showRepublicanData: false,
  republicanDataMode: 'none',
};

// Dropdown component for filter groups
function FilterDropdown({
  label,
  value,
  options,
  onChange,
  multiSelect = false,
  selectedValues = [],
}: {
  label: string;
  value?: string;
  options: { value: string; label: string; color?: string }[];
  onChange: (value: string) => void;
  multiSelect?: boolean;
  selectedValues?: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = multiSelect
    ? selectedValues.length > 0
      ? `${selectedValues.length} selected`
      : 'All'
    : options.find((o) => o.value === value)?.label || 'All';

  const hasSelection = multiSelect ? selectedValues.length > 0 : value && value !== 'all';

  return (
    <div className="filter-group" ref={dropdownRef}>
      <label className="filter-group-label">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`filter-select ${hasSelection ? 'filter-select-active' : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="truncate">{displayValue}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="filter-dropdown" role="listbox">
            {options.map((option) => {
              const isSelected = multiSelect
                ? selectedValues.includes(option.value)
                : value === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    if (!multiSelect) setIsOpen(false);
                  }}
                  className={`filter-dropdown-item ${isSelected ? 'filter-dropdown-item-selected' : ''}`}
                  style={option.color ? { '--item-color': option.color } as React.CSSProperties : undefined}
                >
                  {multiSelect && (
                    <span className={`filter-checkbox ${isSelected ? 'filter-checkbox-checked' : ''}`}>
                      {isSelected && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                  )}
                  {option.color && (
                    <span
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FilterPanel({
  filters,
  onFilterChange,
  className = '',
  variant = 'horizontal',
}: FilterPanelProps) {
  const [showMore, setShowMore] = useState(false);

  const partyOptions = [
    { value: 'Democratic', label: 'Democrats', color: '#4739E7' },
    { value: 'Republican', label: 'Republicans', color: '#DC2626' },
    { value: 'unknown', label: 'Unknown Party', color: '#D97706' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Districts' },
    { value: 'yes', label: 'Has Candidates' },
    { value: 'no', label: 'No Candidates' },
  ];

  const raceOptions = [
    { value: 'all', label: 'All Races' },
    { value: 'yes', label: 'Contested' },
    { value: 'no', label: 'Uncontested' },
  ];

  const opportunityOptions = [
    { value: 'HIGH_OPPORTUNITY', label: 'High Opportunity', color: '#059669' },
    { value: 'EMERGING', label: 'Emerging', color: '#0891B2' },
    { value: 'needsCandidate', label: 'Needs Candidate', color: '#F59E0B' },
    { value: 'DEFENSIVE', label: 'Defensive', color: '#3676eb' },
  ];

  const toggleParty = (party: string) => {
    const newParties = filters.party.includes(party)
      ? filters.party.filter((p) => p !== party)
      : [...filters.party, party];
    onFilterChange({ ...filters, party: newParties });
  };

  const toggleOpportunity = (opportunity: string) => {
    const newOpportunities = filters.opportunity.includes(opportunity)
      ? filters.opportunity.filter((o) => o !== opportunity)
      : [...filters.opportunity, opportunity];
    onFilterChange({ ...filters, opportunity: newOpportunities });
  };

  const activeFilterCount =
    filters.party.length +
    (filters.hasCandidate !== 'all' ? 1 : 0) +
    (filters.contested !== 'all' ? 1 : 0) +
    filters.opportunity.length +
    (filters.showRepublicanData ? 1 : 0);

  const clearFilters = () => {
    onFilterChange(defaultFilters);
  };

  // Horizontal variant - Class Dashboard style
  if (variant === 'horizontal') {
    return (
      <div className={`filter-bar ${className}`}>
        <span className="filter-bar-label">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          FILTERS
        </span>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="filter-reset"
            aria-label="Reset all filters"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset All
          </button>
        )}

        <div className="filter-bar-divider" />

        {/* Party Filter */}
        <FilterDropdown
          label="PARTY"
          options={partyOptions}
          multiSelect
          selectedValues={filters.party}
          onChange={toggleParty}
        />

        {/* Status Filter */}
        <FilterDropdown
          label="STATUS"
          value={filters.hasCandidate}
          options={statusOptions}
          onChange={(value) => onFilterChange({ ...filters, hasCandidate: value as 'all' | 'yes' | 'no' })}
        />

        {/* Opportunity Filter */}
        <FilterDropdown
          label="OPPORTUNITY"
          options={opportunityOptions}
          multiSelect
          selectedValues={filters.opportunity}
          onChange={toggleOpportunity}
        />

        {/* More button for additional filters */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className={`filter-more ${showMore ? 'filter-more-active' : ''}`}
            aria-expanded={showMore}
          >
            More
            <svg
              className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showMore && (
            <div className="filter-more-panel">
              {/* Race Type */}
              <div className="filter-more-section">
                <div className="filter-more-label">Race Type</div>
                <div className="flex flex-wrap gap-2">
                  {raceOptions.map((option) => {
                    const isSelected = filters.contested === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onFilterChange({ ...filters, contested: option.value as 'all' | 'yes' | 'no' })}
                        className={`filter-chip ${isSelected ? 'filter-chip-selected' : ''}`}
                        aria-pressed={isSelected}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Republican Data Toggle */}
              <div className="filter-more-section">
                <div className="filter-more-label">Opposition Data</div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={filters.showRepublicanData}
                    onClick={() => {
                      const newShowRepublican = !filters.showRepublicanData;
                      onFilterChange({
                        ...filters,
                        showRepublicanData: newShowRepublican,
                        republicanDataMode: newShowRepublican ? 'all' : 'none',
                      });
                    }}
                    className="filter-toggle"
                    style={{
                      background: filters.showRepublicanData ? '#DC2626' : '#E2E8F0',
                    }}
                  >
                    <span
                      className="filter-toggle-knob"
                      style={{
                        transform: filters.showRepublicanData ? 'translateX(20px)' : 'translateX(2px)',
                      }}
                    />
                  </button>
                  <span className="text-sm" style={{ color: filters.showRepublicanData ? '#DC2626' : '#64748B' }}>
                    Show Republican Data
                  </span>
                </label>

                {filters.showRepublicanData && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      { value: 'incumbents', label: 'Incumbents' },
                      { value: 'challengers', label: 'Challengers' },
                      { value: 'all', label: 'All' },
                    ].map((option) => {
                      const isSelected = filters.republicanDataMode === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => onFilterChange({ ...filters, republicanDataMode: option.value as 'incumbents' | 'challengers' | 'all' })}
                          className={`filter-chip ${isSelected ? 'filter-chip-selected-red' : ''}`}
                          aria-pressed={isSelected}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Original dropdown variant (for backwards compatibility)
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium"
        style={{
          background: isExpanded ? 'var(--class-purple, #4739E7)' : 'var(--card-bg, #FFFFFF)',
          borderColor: 'var(--class-purple-light, #DAD7FA)',
          color: isExpanded ? 'white' : 'var(--text-color, #0A1849)',
        }}
        aria-expanded={isExpanded}
        aria-controls="filter-panel"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span
            className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full"
            style={{
              background: isExpanded ? 'white' : 'var(--class-purple, #4739E7)',
              color: isExpanded ? 'var(--class-purple, #4739E7)' : 'white',
            }}
          >
            {activeFilterCount}
          </span>
        )}
        <svg className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div
          id="filter-panel"
          className="mt-2 p-4 rounded-lg border"
          style={{
            background: 'var(--card-bg, #FFFFFF)',
            borderColor: 'var(--class-purple-light, #DAD7FA)',
          }}
        >
          {/* Original dropdown content... simplified for brevity */}
          <p className="text-sm text-gray-500">Use horizontal variant for better UX</p>
        </div>
      )}
    </div>
  );
}
