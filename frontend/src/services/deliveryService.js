// services/deliveryService.js

// Warehouse location (Thoothukudi Harbour)
const WAREHOUSE_COORDINATES = {
  lat: 8.7642,
  lng: 78.1348,
  name: "Thoothukudi Harbour"
};

// Your final pricing table
const DELIVERY_ZONES = [
  {
    name: "Local",
    maxDistance: 20,
    pricing: [
      { maxWeight: 10, price: 0 },      // FREE up to 10kg
      { maxWeight: 25, price: 50 },      // 10-25kg: ₹50
      { maxWeight: Infinity, price: 100 } // 25kg+: ₹100
    ]
  },
  {
    name: "Nearby",
    maxDistance: 100,
    pricing: [
      { maxWeight: 10, price: 100 },
      { maxWeight: 25, price: 200 },
      { maxWeight: Infinity, price: 300 }
    ]
  },
  {
    name: "Regional",
    maxDistance: 300,
    pricing: [
      { maxWeight: 10, price: 350 },
      { maxWeight: 25, price: 550 },
      { maxWeight: Infinity, price: 750 }
    ]
  },
  {
    name: "Distant",
    maxDistance: 600,
    pricing: [
      { maxWeight: 10, price: 700 },
      { maxWeight: 25, price: 900 },
      { maxWeight: Infinity, price: 1100 }
    ]
  },
  {
    name: "Long Distance",
    maxDistance: Infinity,
    pricing: [
      { maxWeight: 10, price: 900 },
      { maxWeight: 25, price: 1200 },
      { maxWeight: Infinity, price: { base: 1200, perKg: 15 } } // Base ₹1200 + ₹15/kg above 25kg
    ]
  }
];

// Tamil Nadu city coordinates (expanded)
const CITY_COORDINATES = {
  // Thoothukudi District (Local)
  "thoothukudi": { lat: 8.7642, lng: 78.1348 },
  "tiruchendur": { lat: 8.4972, lng: 78.1262 },
  "srivaikuntam": { lat: 8.6296, lng: 77.9138 },
  "kayalpattinam": { lat: 8.5714, lng: 78.1194 },
  "korkai": { lat: 8.6500, lng: 78.0500 },
  
  // Nearby Districts (20-100km)
  "tirunelveli": { lat: 8.7139, lng: 77.7567 },
  "palayamkottai": { lat: 8.7167, lng: 77.7333 },
  "kovilpatti": { lat: 9.1745, lng: 77.8706 },
  "ettayapuram": { lat: 9.1500, lng: 77.9833 },
  "sankarankovil": { lat: 9.1667, lng: 77.5500 },
  "tenkasi": { lat: 8.9602, lng: 77.3153 },
  "kadayanallur": { lat: 9.0833, lng: 77.3500 },
  "sengottai": { lat: 8.9667, lng: 77.2500 },
  "ambasamudram": { lat: 8.7000, lng: 77.4667 },
  "nanguneri": { lat: 8.4833, lng: 77.6667 },
  "valliyoor": { lat: 8.3667, lng: 77.6167 },
  "kanyakumari": { lat: 8.0883, lng: 77.5385 },
  "nagercoil": { lat: 8.1863, lng: 77.4255 },
  "marthandam": { lat: 8.3000, lng: 77.2167 },
  "kuzhithurai": { lat: 8.3167, lng: 77.1833 },
  "colachel": { lat: 8.1667, lng: 77.2500 },
  
  // Regional (100-300km)
  "madurai": { lat: 9.9252, lng: 78.1198 },
  "ramanathapuram": { lat: 9.3750, lng: 78.8300 },
  "paramakudi": { lat: 9.5500, lng: 78.6000 },
  "sivagangai": { lat: 9.8500, lng: 78.4833 },
  "virudhunagar": { lat: 9.5850, lng: 77.9570 },
  "sivakasi": { lat: 9.4470, lng: 77.8000 },
  "rajapalayam": { lat: 9.4200, lng: 77.5560 },
  "srivilliputhur": { lat: 9.5129, lng: 77.6338 },
  "dindigul": { lat: 10.3670, lng: 77.9800 },
  "palani": { lat: 10.4500, lng: 77.5167 },
  "kodaikanal": { lat: 10.2333, lng: 77.4833 },
  "theni": { lat: 9.9333, lng: 77.4833 },
  "bodinayakanur": { lat: 9.9667, lng: 77.3500 },
  "periyakulam": { lat: 10.1167, lng: 77.5500 },
  
  // Distant (300-600km)
  "chennai": { lat: 13.0827, lng: 80.2707 },
  "coimbatore": { lat: 11.0168, lng: 76.9558 },
  "trichy": { lat: 10.7905, lng: 78.7047 },
  "salem": { lat: 11.6643, lng: 78.1460 },
  "erode": { lat: 11.3410, lng: 77.7170 },
  "tiruppur": { lat: 11.1085, lng: 77.3411 },
  "karur": { lat: 10.9600, lng: 78.0800 },
  "namakkal": { lat: 11.2167, lng: 78.1667 },
  "dharmapuri": { lat: 12.1333, lng: 78.1667 },
  "krishnagiri": { lat: 12.5333, lng: 78.2167 },
  "vellore": { lat: 12.9165, lng: 79.1325 },
  "ranipet": { lat: 12.9333, lng: 79.3333 },
  "arcot": { lat: 12.9000, lng: 79.3333 },
  "kanchipuram": { lat: 12.8342, lng: 79.7036 },
  "chengalpattu": { lat: 12.7000, lng: 79.9833 },
  
  // Long Distance (600km+)
  "pondicherry": { lat: 11.9139, lng: 79.8145 },
  "cuddalore": { lat: 11.7500, lng: 79.7500 },
  "chidambaram": { lat: 11.4000, lng: 79.7000 },
  "mayiladuthurai": { lat: 11.1000, lng: 79.6500 },
  "kumbakonam": { lat: 10.9667, lng: 79.3833 },
  "thanjavur": { lat: 10.8000, lng: 79.1500 },
  "nagapattinam": { lat: 10.7667, lng: 79.8333 },
  "karaikal": { lat: 10.9167, lng: 79.8333 }
};

// Haversine formula to calculate distance between two coordinates (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
};

// Get coordinates from city name
const getCoordinates = (cityName) => {
  const normalizedCity = cityName?.toLowerCase().trim() || "";
  
  // Extract first word (e.g., "Chennai" from "Chennai, Tamil Nadu")
  const firstWord = normalizedCity.split(',')[0].trim();
  
  // Check if we have coordinates for this city
  if (CITY_COORDINATES[firstWord]) {
    return CITY_COORDINATES[firstWord];
  }
  
  // Check partial matches
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    if (firstWord.includes(city) || city.includes(firstWord)) {
      return coords;
    }
  }
  
  // Default to Thoothukudi if not found
  return CITY_COORDINATES["thoothukudi"];
};

// Get delivery zone based on distance
const getDeliveryZone = (distance) => {
  for (const zone of DELIVERY_ZONES) {
    if (distance <= zone.maxDistance) {
      return zone;
    }
  }
  return DELIVERY_ZONES[DELIVERY_ZONES.length - 1]; // Last zone (Long Distance)
};

// Calculate delivery price based on zone and weight
const calculateDeliveryPrice = (zone, weight) => {
  const pricing = zone.pricing;
  
  for (const tier of pricing) {
    if (weight <= tier.maxWeight) {
      // Handle special case for long distance with per kg pricing
      if (typeof tier.price === 'object') {
        const extraKg = Math.max(0, weight - 25);
        return tier.price.base + (extraKg * tier.price.perKg);
      }
      return tier.price;
    }
  }
  
  // Default fallback (should never reach here)
  return 500;
};

// Get zone name based on distance
const getZoneName = (distance) => {
  if (distance <= 20) return "Local";
  if (distance <= 100) return "Nearby";
  if (distance <= 300) return "Regional";
  if (distance <= 600) return "Distant";
  return "Long Distance";
};

// Get estimated delivery days based on distance
const getEstimatedDeliveryDays = (distance) => {
  if (distance <= 20) return "Same day delivery";
  if (distance <= 100) return "1-2 days";
  if (distance <= 300) return "2-3 days";
  if (distance <= 600) return "3-4 days";
  return "4-5 days";
};

// Main function to calculate delivery charges
export const calculateDeliveryCharges = (deliveryCity, weight = 1) => {
  try {
    // Validate inputs
    if (!deliveryCity || deliveryCity.trim() === "") {
      return {
        success: false,
        message: "Please enter delivery city",
        distance: 0,
        zone: "Unknown",
        price: 0,
        isFreeDelivery: false,
        estimatedDays: "N/A",
        fromWarehouse: WAREHOUSE_COORDINATES.name
      };
    }

    if (weight <= 0) {
      return {
        success: false,
        message: "Weight must be greater than 0",
        distance: 0,
        zone: "Unknown",
        price: 0,
        isFreeDelivery: false,
        estimatedDays: "N/A",
        fromWarehouse: WAREHOUSE_COORDINATES.name
      };
    }

    // Get coordinates
    const destCoords = getCoordinates(deliveryCity);
    
    // Calculate distance
    const distance = calculateDistance(
      WAREHOUSE_COORDINATES.lat, WAREHOUSE_COORDINATES.lng,
      destCoords.lat, destCoords.lng
    );
    
    // Get zone
    const zone = getDeliveryZone(distance);
    
    // Calculate price
    const price = calculateDeliveryPrice(zone, weight);
    
    // Determine if free delivery applies (Local zone with weight <= 10kg)
    const isFreeDelivery = (distance <= 20 && weight <= 10);
    
    return {
      success: true,
      distance,
      zone: zone.name,
      price: isFreeDelivery ? 0 : price,
      originalPrice: price,
      isFreeDelivery,
      estimatedDays: getEstimatedDeliveryDays(distance),
      fromWarehouse: WAREHOUSE_COORDINATES.name,
      deliveryCity: deliveryCity,
      weight: weight
    };
  } catch (error) {
    console.error("Error calculating delivery:", error);
    return {
      success: false,
      message: "Error calculating delivery",
      distance: 0,
      zone: "Unknown",
      price: 100, // Default fallback price
      isFreeDelivery: false,
      estimatedDays: "3-4 days",
      fromWarehouse: WAREHOUSE_COORDINATES.name
    };
  }
};

// Format price with currency
export const formatPrice = (price) => {
  if (price === 0) return "FREE";
  return `₹${price.toLocaleString('en-IN')}`;
};

// Get delivery summary for display
export const getDeliverySummary = (deliveryCity, weight) => {
  const charges = calculateDeliveryCharges(deliveryCity, weight);
  
  if (!charges.success) {
    return {
      ...charges,
      summary: charges.message,
      deliveryTime: "",
      priceDisplay: "N/A"
    };
  }
  
  return {
    ...charges,
    summary: `📍 ${charges.distance} km from ${charges.fromWarehouse} (${charges.zone} Zone)`,
    deliveryTime: `🚚 Estimated: ${charges.estimatedDays}`,
    priceDisplay: charges.isFreeDelivery ? "FREE" : formatPrice(charges.price),
    tooltip: getZoneTooltip(charges.zone, charges.distance)
  };
};

// Get zone tooltip for information
const getZoneTooltip = (zone, distance) => {
  const tooltips = {
    "Local": "Free delivery for orders under 10kg within 20km",
    "Nearby": "Delivery within 1-2 days to nearby districts",
    "Regional": "Delivery within 2-3 days to regional cities",
    "Distant": "Delivery within 3-4 days to distant cities",
    "Long Distance": "Delivery within 4-5 days to long distance locations"
  };
  return tooltips[zone] || "";
};

// Get all zone pricing for reference
export const getZonePricingTable = () => {
  return DELIVERY_ZONES.map(zone => ({
    zone: zone.name,
    maxDistance: zone.maxDistance === Infinity ? "600km+" : `${zone.maxDistance} km`,
    upTo10kg: getPriceForWeight(zone, 10),
    upTo25kg: getPriceForWeight(zone, 25),
    above25kg: getPriceForWeight(zone, 30)
  }));
};

const getPriceForWeight = (zone, weight) => {
  const price = calculateDeliveryPrice(zone, weight);
  return price === 0 ? "FREE" : `₹${price}`;
};