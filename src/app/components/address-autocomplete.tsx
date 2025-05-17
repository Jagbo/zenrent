import React, { useState, useEffect, useRef } from "react";
import { MapPinIcon } from "@heroicons/react/24/outline";

interface AutocompleteResult {
  id: string;
  summaryline: string;
  locationsummary: string;
  type: string;
  count: number;
}

interface AddressDetails {
  addressline1: string;
  addressline2: string;
  addressline3: string;
  addressline4: string;
  organisation: string;
  buildingname: string;
  buildingnumber: string;
  street: string;
  posttown: string;
  county: string;
  postcode: string;
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    addressLine1: string;
    addressLine2: string;
    townCity: string;
    county: string;
    postcode: string;
  }) => void;
  addressLine1: string;
  className?: string;
}

export function AddressAutocomplete({
  onAddressSelect,
  addressLine1,
  className = "",
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(addressLine1);
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pathFilter, setPathFilter] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch address suggestions using autocomplete/find
  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      let url = `https://ws.postcoder.com/pcw/autocomplete/find?apikey=PCWTN-F99E4-UAAV3-CEXH4&country=uk&query=${encodeURIComponent(searchQuery)}`;

      if (pathFilter) {
        url += `&pathfilter=${encodeURIComponent(pathFilter)}`;
      }

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          Accept: "application/json",
        },
      });

      console.log("Postcoder find response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Postcoder find error:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Postcoder find response:", data);

      if (Array.isArray(data)) {
        setSuggestions(data);
        if (data.length === 0) {
          setError("No addresses found");
        }
      } else {
        console.error("Invalid response format:", data);
        setError("Invalid response format from server");
        setSuggestions([]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Error fetching suggestions:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch suggestions",
      );
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch full address details using autocomplete/retrieve
  const fetchAddressDetails = async (id: string) => {
    try {
      const url = `https://ws.postcoder.com/pcw/autocomplete/retrieve?apikey=PCWTN-F99E4-UAAV3-CEXH4&country=uk&query=${encodeURIComponent(query)}&id=${encodeURIComponent(id)}&lines=4`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Postcoder retrieve error:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const addresses = await response.json();
      console.log("Address details:", addresses);

      if (Array.isArray(addresses) && addresses.length > 0) {
        const address = addresses[0];

        onAddressSelect({
          addressLine1: address.addressline1 || "",
          addressLine2: address.addressline2 || "",
          townCity: address.posttown || "",
          county: address.county || "",
          postcode: address.postcode || "",
        });
      } else {
        throw new Error("No address details received");
      }
    } catch (error) {
      console.error("Error fetching address details:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch address details",
      );
    }
  };

  // Handle input change with debounce
  useEffect(() => {
    if (query === addressLine1) return;

    const timeoutId = setTimeout(() => {
      if (query.length >= 3) {
        console.log("Searching for:", query);
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
        setError(null);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, addressLine1]);

  const handleSuggestionClick = (result: AutocompleteResult) => {
    setQuery(result.summaryline);
    setShowSuggestions(false);

    if (result.type === "ADD") {
      // If it's a final address, retrieve the details
      fetchAddressDetails(result.id);
    } else {
      // If it's an intermediate result, update the path filter and search again
      setPathFilter(result.id);
      fetchSuggestions(query);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center">
        <input type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setPathFilter(""); // Reset path filter on new search
          }}
          onFocus={() => {
            if (query.length >= 3) {
              setShowSuggestions(true);
            }
          }}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck="false"
          placeholder="Start typing address or postcode (min. 3 characters)"
          className={`block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#D9E8FF] sm:text-sm/6 ${className}`}
        />
        <MapPinIcon className="absolute right-3 size-5 text-gray-400"
          aria-hidden="true"
        />
      </div>

      {showSuggestions && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200">
          <ul className="max-h-60 overflow-auto rounded-md py-1 text-base sm:text-sm">
            {query.length < 3 ? (
              <li className="px-3 py-2 text-gray-600">
                Please enter at least 3 characters
              </li>
            ) : isLoading ? (
              <li className="px-3 py-2 text-gray-600">Loading...</li>
            ) : error ? (
              <li className="px-3 py-2 text-red-600">{error}</li>
            ) : suggestions.length > 0 ? (
              suggestions.map((result, index) => (
                <li key={index}
                  className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                  onClick={() => handleSuggestionClick(result)}
                >
                  <span>{result.summaryline}</span>
                  {result.count > 1 && (
                    <span className="text-gray-500 ml-1">
                      ({result.count > 100 ? "100+" : result.count} addresses)
                    </span>
                  )}
                  {result.locationsummary && (
                    <span className="text-gray-500 ml-1">
                      {result.locationsummary}
                    </span>
                  )}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-gray-600">No addresses found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
