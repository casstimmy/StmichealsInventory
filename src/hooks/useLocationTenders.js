/**
 * useLocationTenders Hook
 * 
 * Fetches tenders assigned to a specific location
 * from the inventory management system
 * 
 * @param {string} locationId - The location ID to fetch tenders for
 * @returns {object} { tenders, loading, error }
 */

import { useState, useEffect } from 'react';

export function useLocationTenders(locationId) {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!locationId) {
      setTenders([]);
      setLoading(false);
      setError('No location ID provided');
      return;
    }

    const fetchLocationTenders = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`📍 Fetching tenders for location: ${locationId}`);

        // Fetch location-specific tenders from inventory API
        const response = await fetch(
          `http://localhost:3000/api/setup/location-items?locationId=${locationId}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch tenders: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch location data');
        }

        // Extract tenders array from response
        const locationTenders = data.location?.tenders || [];

        console.log(`✅ Fetched ${locationTenders.length} tenders for location`);
        console.log('📋 Raw tender data:', locationTenders);

        // Normalize tender data - convert MongoDB objects to component-friendly format
        const normalizedTenders = locationTenders.map((tender) => {
          // Handle both object and string formats
          const tenderObj = typeof tender === 'string' ? { _id: tender } : tender;

          return {
            id: tenderObj._id || tenderObj.id,
            name: tenderObj.name || 'Unknown Tender',
            description: tenderObj.description || '',
            classification: tenderObj.classification || 'Other',
            buttonColor: tenderObj.buttonColor || '#A3E635',
            tillOrder: tenderObj.tillOrder || 0,
          };
        });

        // Sort by till order
        normalizedTenders.sort((a, b) => a.tillOrder - b.tillOrder);

        console.log('🔄 Normalized tender data:', normalizedTenders);

        setTenders(normalizedTenders);
      } catch (err) {
        console.error('❌ Error fetching tenders:', err);
        setError(err.message || 'Failed to load tenders');
        setTenders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocationTenders();
  }, [locationId]);

  return {
    tenders,
    loading,
    error,
  };
}

/**
 * Example usage in a component:
 * 
 * import { useLocationTenders } from '../../../src/hooks/useLocationTenders';
 * 
 * function MyComponent() {
 *   const { tenders, loading, error } = useLocationTenders('locationId123');
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   
 *   return (
 *     <div>
 *       {tenders.map(tender => (
 *         <button key={tender.id}>{tender.name}</button>
 *       ))}
 *     </div>
 *   );
 * }
 */
