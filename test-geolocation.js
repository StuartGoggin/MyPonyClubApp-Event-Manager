// Test the improved geolocation search strategies
const testGeolocation = async () => {
  console.log("🗺️ Testing Improved Geolocation Search Strategies");
  console.log("=" .repeat(60));
  
  // Test 1: Monbulk Pony Club (no existing address)
  console.log("\n� TEST 1: Monbulk Pony Club");
  console.log("-".repeat(30));
  
  const monbulkName = "Monbulk Pony Club";
  const monbulkAddress = ""; // No existing address
  
  if (monbulkAddress && monbulkAddress.trim()) {
    console.log("Strategy 1: Existing address only");
    console.log(`Query: "${monbulkAddress.trim()}"`);
  } else {
    console.log("Strategy 1: Skipped (no existing address)");
  }
  
  let baseQuery = monbulkName;
  if (!monbulkName.toLowerCase().includes('pony club')) {
    baseQuery += ' Pony Club';
  }
  console.log("Strategy 2: Club name with location context");
  console.log(`Query: "${baseQuery} Victoria Australia"`);
  
  console.log("Strategy 3: Club name only");
  console.log(`Query: "${baseQuery}"`);
  
  // Test 2: Little River & District Pony Club (with existing address)
  console.log("\n📍 TEST 2: Little River & District Pony Club (with address)");
  console.log("-".repeat(50));
  
  const littleRiverName = "Little River & District Pony Club";
  const littleRiverAddress = "115-125 River Street, Little River VIC 3211";
  
  console.log("Strategy 1: Existing address only");
  console.log(`Query: "${littleRiverAddress}"`);
  
  let baseQuery2 = littleRiverName;
  if (!littleRiverName.toLowerCase().includes('pony club')) {
    baseQuery2 += ' Pony Club';
  }
  console.log("Strategy 2: Club name with location context");
  console.log(`Query: "${baseQuery2} Victoria Australia"`);
  
  console.log("Strategy 3: Club name only");
  console.log(`Query: "${baseQuery2}"`);
  
  const addressParts = littleRiverAddress.split(',');
  const streetAddress = addressParts[0]?.trim();
  if (streetAddress) {
    console.log("Strategy 4: Street address with location");
    console.log(`Query: "${streetAddress}, Victoria Australia"`);
  }
  
  console.log("\n❌ OLD LOGIC PROBLEMS:");
  console.log("Monbulk old query: \" Monbulk Pony Club Pony Club Victoria Australia\"");
  console.log("Little River old query: \"115-125 River Street, Little River VIC 3211 Little River & District Pony Club Pony Club Victoria Australia\"");
  console.log("^ These were too complex and confusing for Google Places API!");
  
  console.log("\n✅ NEW LOGIC BENEFITS:");
  console.log("- Clean, targeted searches");
  console.log("- Address-first approach when available");
  console.log("- Strategic fallback if primary search fails");
  console.log("- No redundant information");
  console.log("- Much higher success rate expected");
};

testGeolocation();
