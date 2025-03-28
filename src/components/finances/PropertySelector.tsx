import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSelectedProperty } from '@/hooks/useSelectedProperty';

interface Property {
  id: string;
  address: string;
}

export function PropertySelector() {
  const { propertyId, setPropertyId } = useSelectedProperty();

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return <div>Loading properties...</div>;
  }

  if (!properties?.length) {
    return <div>No properties found</div>;
  }

  return (
    <Select
      value={propertyId || undefined}
      onValueChange={setPropertyId}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a property" />
      </SelectTrigger>
      <SelectContent>
        {properties.map((property) => (
          <SelectItem key={property.id} value={property.id}>
            {property.address}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 