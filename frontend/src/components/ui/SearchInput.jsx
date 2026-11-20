import { Search, X } from 'lucide-react';
import './SearchInput.css';

/** Search box with an icon and a clear (x) button. Debounce it in the page with useDebounce. */
export default function SearchInput({ value, onChange, placeholder = 'Search…', label = 'Search', className = '' }) {
  return (
    <div className={`search-input ${className}`}>
      <Search size={16} className="search-icon" aria-hidden="true" />
      <input
        type="search"
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
      />
      {value && (
        <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="Clear search">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
