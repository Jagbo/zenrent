# MTD Integration Guide for Tax Filing Page

This document outlines how to integrate the new Making Tax Digital (MTD) components into the existing tax filing page.

## Integration Steps

1. Import the new MTD components at the top of the tax filing page:

```tsx
import { MTDSection } from './components/MTDSection';
import { getUpcomingObligations, checkMTDCompliance } from '@/lib/taxService';
```

2. Add the following state variables to the TaxFiling component:

```tsx
const [mtdObligations, setMtdObligations] = useState([]);
const [mtdCompliance, setMtdCompliance] = useState(null);
const [mtdLoading, setMtdLoading] = useState(true);
```

3. Add a function to fetch MTD data in the TaxFiling component:

```tsx
// Fetch MTD data
const fetchMTDData = async () => {
  if (!userId) return;
  
  try {
    setMtdLoading(true);
    
    // Fetch obligations and MTD compliance status in parallel
    const [obligationsData, mtdComplianceData] = await Promise.all([
      getUpcomingObligations(userId),
      checkMTDCompliance(userId)
    ]);
    
    setMtdObligations(obligationsData || []);
    setMtdCompliance(mtdComplianceData);
  } catch (error) {
    console.error("Error fetching MTD data:", error);
    // Handle error
  } finally {
    setMtdLoading(false);
  }
};
```

4. Call the fetchMTDData function in the useEffect hook after checking the HMRC connection:

```tsx
useEffect(() => {
  // ... existing code for checking HMRC connection
  
  // After checking HMRC connection, fetch MTD data
  fetchMTDData();
}, [userId]);
```

5. Add the MTDSection component to the page, just before the "Help Section":

```tsx
{/* MTD Section */}
<MTDSection 
  onConnectClick={handleConnectToHmrc}
  isHmrcConnected={isHmrcConnected}
  taxYear={currentTaxYear}
/>

{/* Help Section */}
<div className="bg-white shadow sm:rounded-lg overflow-hidden">
  {/* ... existing help section content */}
</div>
```

## Complete Integration

The full integration involves:

1. Adding the new imports
2. Adding new state variables
3. Adding the fetchMTDData function
4. Updating the useEffect hook
5. Adding the MTDSection component to the UI

This integration ensures that the tax filing page now supports MTD requirements, including:
- Digital record keeping compliance
- Quarterly update scheduling and submission
- MTD status monitoring

The MTD section is designed to work alongside the existing tax filing functionality, enhancing it with MTD-specific features while maintaining the current workflow.
