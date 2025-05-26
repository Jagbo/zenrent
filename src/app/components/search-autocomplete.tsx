"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import {
  BuildingOffice2Icon,
  UserIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";

// Define the interfaces for search result types
export interface SearchResultProperty {
  id: string;
  name: string;
  address: string;
  type: "property";
  property_type?: string;
  bedrooms?: number;
  city?: string;
  postcode?: string;
}

export interface SearchResultResident {
  id: string;
  name: string;
  property: string;
  unit?: string;
  type: "resident";
  email?: string;
  phone?: string;
  property_id?: string;
}

export interface SearchResultPage {
  id: string;
  name: string;
  path: string;
  type: "page";
}

export type SearchResult =
  | SearchResultProperty
  | SearchResultResident
  | SearchResultPage;

// API response interface
interface SearchApiResponse {
  success: boolean;
  results: SearchResult[];
  query: string;
}

export function SearchAutocomplete({
  searchValue = "",
  onSearchChange,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        setIsOpen(false);
        setError(null);
        return;
      }

      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data: SearchApiResponse = await response.json();

        if (data.success) {
          setResults(data.results);
          setIsOpen(data.results.length > 0);
        } else {
          throw new Error('Search request was not successful');
        }
      } catch (err) {
        // Don't show error for aborted requests
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounce search requests
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchValue);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchValue, debouncedSearch]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);

    // Navigate based on result type
    if (result.type === "property") {
      router.push(`/properties/${result.id}`);
    } else if (result.type === "resident") {
      router.push(`/residents/${result.id}`);
    } else if (result.type === "page") {
      router.push(result.path);
    }
  };

  const handleInputFocus = () => {
    if (results.length > 0 && !isLoading) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative w-full flex-1 flex items-center" ref={wrapperRef}>
      <div className="relative w-full flex items-center h-16">
        <MagnifyingGlassIcon 
          className="pointer-events-none absolute left-0 h-5 w-5 text-gray-400 ml-3"
          aria-hidden="true"
        />
        <input 
          id="search-field"
          className="block h-full w-full border-0 py-0 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
          placeholder="Search properties, residents..."
          type="search"
          name="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={handleInputFocus}
        />
      </div>

      {(isOpen || isLoading || error) && (
        <div className="absolute left-0 top-16 z-10 w-full rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
          {isLoading ? (
            <div className="py-2 px-4 text-sm text-gray-500 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
              Searching...
            </div>
          ) : error ? (
            <div className="py-2 px-4 text-sm text-red-500">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="py-2 px-4 text-sm text-gray-500">
              No results found
            </div>
          ) : (
            <ul className="max-h-60 overflow-auto py-1 text-base">
              {results.map((result) => (
                <li 
                  key={`${result.type}-${result.id}`}
                  className="cursor-pointer select-none px-4 py-2 hover:bg-gray-100"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-center">
                    {result.type === "property" && (
                      <BuildingOffice2Icon className="h-5 w-5 text-gray-400 mr-3" />
                    )}
                    {result.type === "resident" && (
                      <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                    )}
                    {result.type === "page" && (
                      <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
                    )}

                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {result.name}
                      </p>
                      {result.type === "property" && (
                        <p className="text-xs text-gray-500">
                          {result.address}
                          {result.property_type && ` • ${result.property_type}`}
                          {result.bedrooms && ` • ${result.bedrooms} bed${result.bedrooms !== 1 ? 's' : ''}`}
                        </p>
                      )}
                      {result.type === "resident" && (
                        <p className="text-xs text-gray-500">
                          {result.property}
                          {result.unit && ` - ${result.unit}`}
                        </p>
                      )}
                      {result.type === "page" && (
                        <p className="text-xs text-gray-500">Page</p>
                      )}
                    </div>

                    <ChevronRightIcon className="ml-auto h-5 w-5 text-gray-400" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
