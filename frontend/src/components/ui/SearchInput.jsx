import { Search } from 'lucide-react';
export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <label className="search-input">
      <Search size={17} />
      <input aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}
