"use client";

import { useState, useEffect, useRef } from "react";
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
}

export interface SearchResultResident {
  id: string;
  name: string;
  property: string;
  unit: string;
  type: "resident";
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

// Sample data - replace with actual data fetching logic
const sampleProperties: SearchResultProperty[] = [
  {
    id: "123-main",
    name: "123 Main Street",
    address: "Manchester, M1 1AA",
    type: "property",
  },
  {
    id: "456-park",
    name: "456 Park Avenue",
    address: "Liverpool, L1 1AA",
    type: "property",
  },
  {
    id: "789-ocean",
    name: "789 Ocean Drive",
    address: "Brighton, BN1 1AA",
    type: "property",
  },
  {
    id: "321-victoria",
    name: "321 Victoria Road",
    address: "Edinburgh, EH1 1AA",
    type: "property",
  },
  {
    id: "654-royal",
    name: "654 Royal Crescent",
    address: "Bath, BA1 1AA",
    type: "property",
  },
  {
    id: "987-kings",
    name: "987 Kings Road",
    address: "London, SW3 1AA",
    type: "property",
  },
];

const sampleResidents: SearchResultResident[] = [
  {
    id: "1",
    name: "Leslie Abbott",
    property: "123 Main Street",
    unit: "Room 101",
    type: "resident",
  },
  {
    id: "2",
    name: "Hector Adams",
    property: "123 Main Street",
    unit: "Room 102",
    type: "resident",
  },
  {
    id: "3",
    name: "Blake Alexander",
    property: "123 Main Street",
    unit: "Room 103",
    type: "resident",
  },
  {
    id: "4",
    name: "Molly Wilson",
    property: "456 Park Avenue",
    unit: "Room 101",
    type: "resident",
  },
  {
    id: "5",
    name: "John Smith",
    property: "456 Park Avenue",
    unit: "Room 102",
    type: "resident",
  },
  {
    id: "6",
    name: "Emma Thompson",
    property: "789 Ocean Drive",
    unit: "Room 101",
    type: "resident",
  },
];

const samplePages: SearchResultPage[] = [
  { id: "dashboard", name: "Dashboard", path: "/dashboard", type: "page" },
  { id: "properties", name: "Properties", path: "/properties", type: "page" },
  { id: "residents", name: "Residents", path: "/residents", type: "page" },
  { id: "issues", name: "Issues", path: "/issues", type: "page" },
  { id: "financial", name: "Financial", path: "/financial", type: "page" },
  { id: "calendar", name: "Calendar", path: "/calendar", type: "page" },
  { id: "suppliers", name: "Suppliers", path: "/suppliers", type: "page" },
  {
    id: "integrations",
    name: "Integrations",
    path: "/integrations",
    type: "page",
  },
];

export function SearchAutocomplete({
  searchValue = "",
  onSearchChange,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter results based on search query
  useEffect(() => {
    if (!searchValue) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const query = searchValue.toLowerCase();

    // Filter properties
    const filteredProperties = sampleProperties.filter(
      (property) =>
        property.name.toLowerCase().includes(query) ||
        property.address.toLowerCase().includes(query),
    );

    // Filter residents
    const filteredResidents = sampleResidents.filter(
      (resident) =>
        resident.name.toLowerCase().includes(query) ||
        resident.property.toLowerCase().includes(query) ||
        resident.unit.toLowerCase().includes(query),
    );

    // Filter pages
    const filteredPages = samplePages.filter((page) =>
      page.name.toLowerCase().includes(query),
    );

    // Combine results
    const allResults = [
      ...filteredProperties,
      ...filteredResidents,
      ...filteredPages,
    ];

    setResults(allResults);
    setIsOpen(allResults.length > 0);
  }, [searchValue]);

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

  return (
    <div className="relative w-full flex-1 flex items-center" ref={wrapperRef}>
      <div className="relative w-full flex items-center h-16">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-0 h-5 w-5 text-gray-400 ml-3"
          aria-hidden="true"
        />
        <input id="search-field"
          className="block h-full w-full border-0 py-0 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
          placeholder="Search..."
          type="search"
          name="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsOpen(results.length > 0)}
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 top-16 z-10 w-full rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
          {results.length === 0 ? (
            <div className="py-2 px-4 text-sm text-gray-500">
              No results found
            </div>
          ) : (
            <ul className="max-h-60 overflow-auto py-1 text-base">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}
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

                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {result.name}
                      </p>
                      {result.type === "property" && (
                        <p className="text-xs text-gray-500">
                          {result.address}
                        </p>
                      )}
                      {result.type === "resident" && (
                        <p className="text-xs text-gray-500">
                          {result.property} - {result.unit}
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
