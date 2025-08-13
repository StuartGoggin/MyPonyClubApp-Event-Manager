import { adminDb } from './firebase-admin';
import { Zone, Club } from './types';

/**
 * Export utilities for zones and clubs data
 */
export class DataExporter {
  /**
   * Get all zones from database
   */
  static async getAllZones(): Promise<Zone[]> {
    const snapshot = await adminDb.collection('zones').get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Zone));
  }

  /**
   * Get all clubs from database
   */
  static async getAllClubs(): Promise<Club[]> {
    const snapshot = await adminDb.collection('clubs').get();
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Club));
  }

  /**
   * Generate timestamped filename
   */
  static generateExportFilename(type: 'zones' | 'clubs' | 'zones-clubs'): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return `pony-club-${type}-export-${timestamp}.json`;
  }

  /**
   * Export zones to JSON
   */
  static async exportZones(): Promise<{
    filename: string;
    data: Zone[];
    count: number;
  }> {
    const zones = await this.getAllZones();
    return {
      filename: this.generateExportFilename('zones'),
      data: zones,
      count: zones.length
    };
  }

  /**
   * Export clubs to JSON
   */
  static async exportClubs(): Promise<{
    filename: string;
    data: Club[];
    count: number;
  }> {
    const clubs = await this.getAllClubs();
    return {
      filename: this.generateExportFilename('clubs'),
      data: clubs,
      count: clubs.length
    };
  }

  /**
   * Export both zones and clubs to JSON
   */
  static async exportZonesAndClubs(): Promise<{
    filename: string;
    data: {
      zones: Zone[];
      clubs: Club[];
      exportDate: string;
      summary: {
        totalZones: number;
        totalClubs: number;
      };
    };
    count: { zones: number; clubs: number };
  }> {
    const [zones, clubs] = await Promise.all([
      this.getAllZones(),
      this.getAllClubs()
    ]);

    return {
      filename: this.generateExportFilename('zones-clubs'),
      data: {
        zones,
        clubs,
        exportDate: new Date().toISOString(),
        summary: {
          totalZones: zones.length,
          totalClubs: clubs.length
        }
      },
      count: {
        zones: zones.length,
        clubs: clubs.length
      }
    };
  }
}

/**
 * Import utilities for zones and clubs data
 */
export class DataImporter {
  /**
   * Import zones from JSON data
   */
  static async importZones(zones: Zone[]): Promise<{
    success: boolean;
    imported: number;
    updated: number;
    errors: string[];
  }> {
    let imported = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const zone of zones) {
      try {
        const zoneRef = adminDb.collection('zones').doc(zone.id);
        const existingZone = await zoneRef.get();

        if (existingZone.exists) {
          await zoneRef.set(zone, { merge: true });
          updated++;
          console.log(`✅ Updated zone: ${zone.name}`);
        } else {
          await zoneRef.set(zone);
          imported++;
          console.log(`🆕 Imported zone: ${zone.name}`);
        }
      } catch (error) {
        const errorMsg = `Failed to import zone ${zone.name}: ${error}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    return {
      success: errors.length === 0,
      imported,
      updated,
      errors
    };
  }

  /**
   * Import clubs from JSON data
   */
  static async importClubs(clubs: Club[]): Promise<{
    success: boolean;
    imported: number;
    updated: number;
    errors: string[];
  }> {
    let imported = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const club of clubs) {
      try {
        const clubRef = adminDb.collection('clubs').doc(club.id);
        const existingClub = await clubRef.get();

        if (existingClub.exists) {
          await clubRef.set(club, { merge: true });
          updated++;
          console.log(`✅ Updated club: ${club.name}`);
        } else {
          await clubRef.set(club);
          imported++;
          console.log(`🆕 Imported club: ${club.name}`);
        }
      } catch (error) {
        const errorMsg = `Failed to import club ${club.name}: ${error}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    return {
      success: errors.length === 0,
      imported,
      updated,
      errors
    };
  }

  /**
   * Import both zones and clubs from combined JSON data
   */
  static async importZonesAndClubs(data: {
    zones: Zone[];
    clubs: Club[];
  }): Promise<{
    success: boolean;
    zones: { imported: number; updated: number; };
    clubs: { imported: number; updated: number; };
    errors: string[];
  }> {
    console.log(`🚀 Starting import: ${data.zones.length} zones, ${data.clubs.length} clubs`);

    // Import zones first
    const zoneResults = await this.importZones(data.zones);
    
    // Then import clubs
    const clubResults = await this.importClubs(data.clubs);

    const allErrors = [...zoneResults.errors, ...clubResults.errors];

    console.log(`🎉 Import completed!`);
    console.log(`  Zones: ${zoneResults.imported} imported, ${zoneResults.updated} updated`);
    console.log(`  Clubs: ${clubResults.imported} imported, ${clubResults.updated} updated`);

    return {
      success: allErrors.length === 0,
      zones: {
        imported: zoneResults.imported,
        updated: zoneResults.updated
      },
      clubs: {
        imported: clubResults.imported,
        updated: clubResults.updated
      },
      errors: allErrors
    };
  }

  /**
   * Validate imported data structure
   */
  static validateImportData(data: any): {
    isValid: boolean;
    errors: string[];
    type: 'zones' | 'clubs' | 'zones-clubs' | 'unknown';
  } {
    const errors: string[] = [];
    let type: 'zones' | 'clubs' | 'zones-clubs' | 'unknown' = 'unknown';

    if (!data || typeof data !== 'object') {
      errors.push('Invalid data format');
      return { isValid: false, errors, type };
    }

    // Check if it's zones-only export
    if (Array.isArray(data) && data.length > 0 && data[0].secretary) {
      type = 'zones';
      for (const item of data) {
        if (!item.id || !item.name || !item.secretary) {
          errors.push(`Invalid zone structure: missing required fields`);
        }
      }
    }
    // Check if it's clubs-only export
    else if (Array.isArray(data) && data.length > 0 && data[0].zoneId) {
      type = 'clubs';
      for (const item of data) {
        if (!item.id || !item.name || !item.zoneId) {
          errors.push(`Invalid club structure: missing required fields`);
        }
      }
    }
    // Check if it's combined zones-clubs export
    else if (data.zones && data.clubs && Array.isArray(data.zones) && Array.isArray(data.clubs)) {
      type = 'zones-clubs';
      
      // Validate zones
      for (const zone of data.zones) {
        if (!zone.id || !zone.name || !zone.secretary) {
          errors.push(`Invalid zone structure: missing required fields`);
        }
      }
      
      // Validate clubs
      for (const club of data.clubs) {
        if (!club.id || !club.name || !club.zoneId) {
          errors.push(`Invalid club structure: missing required fields`);
        }
      }
    } else {
      errors.push('Unrecognized data format. Expected zones array, clubs array, or combined zones-clubs object.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      type
    };
  }
}
