import { NextRequest, NextResponse } from 'next/server';
import { getAllZones, getAllClubs } from '@/lib/server-data';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Starting data export process...');

    // Fetch zones and clubs data
    console.log('📍 Fetching zones...');
    const zones = await getAllZones();
    console.log(`✅ Retrieved ${zones.length} zones`);

    console.log('🏇 Fetching clubs...');
    const clubs = await getAllClubs();
    console.log(`✅ Retrieved ${clubs.length} clubs`);

    // Create export data structure
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        exportedBy: 'Pony Club Event Manager',
        version: '1.0',
        totalZones: zones.length,
        totalClubs: clubs.length,
        description: 'Complete export of zones and clubs data from Pony Club Event Manager database'
      },
      zones: zones,
      clubs: clubs,
      summary: {
        zonesSummary: zones.map(zone => ({
          id: zone.id,
          name: zone.name,
          clubCount: clubs.filter(club => club.zoneId === zone.id).length
        })),
        clubsByZone: zones.reduce((acc, zone) => {
          acc[zone.name] = clubs.filter(club => club.zoneId === zone.id);
          return acc;
        }, {} as Record<string, any[]>)
      }
    };

    console.log('✅ Data export completed successfully');

    // Return the data as JSON
    return NextResponse.json({
      success: true,
      data: exportData,
      filename: `pony-club-data-export-${new Date().toISOString().split('T')[0]}.json`
    });

  } catch (error) {
    console.error('❌ Error exporting data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to export data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
