const config = require('../../config');
const axios = require('axios');

class CollisionService {
  constructor() {
    this.apiKey = config.collisionApiKey;
    this.baseUrl = 'https://services2.arcgis.com/L81TiOwAPO1ZvU9b/arcgis/rest/services/Traffic_Crashes/FeatureServer/0/query';
    this.timeout = 30000;
    this.boundsPadding = 0.01; // ~1km padding
  }

  analyzeCrashSeverity(sev){
    if(sev.indexOf("(A)") != -1) return 3;
    if(sev.indexOf("(B)") != -1) return 2;
    if(sev.indexOf("(C)") != -1) return 1;
    return 0;
  }

  safetyRating(feature){
    let injuryRating = this.analyzeCrashSeverity(feature.attributes.Crash_Severity);
    let bicycleInvolved = feature.attributes.Bicycle_Involved === 'Yes' ? 3 : 0;
    let alcoholInvolved = feature.attributes.Alcohol_Involved === 'Yes' ? 2 : 0;
    let phoneInvolved = feature.attributes.Cell_Phone_Involved === 'Yes' ? 1 : 0;
    let aggressiveDriverInvolved = feature.attributes.Aggressive_Driver_Involved === 'Yes' ? 1 : 0;
    return injuryRating + bicycleInvolved + alcoholInvolved + phoneInvolved + aggressiveDriverInvolved;
  }

  getLastYearDateFilter() {
    let oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo = oneYearAgo.toISOString();
    oneYearAgo = oneYearAgo.substring(0,oneYearAgo.indexOf("T"));

    // ArcGIS uses milliseconds since epoch for date queries
    //const timestamp = oneYearAgo.getTime();

    return `Crash_Date_and_Time >= '${oneYearAgo}'`;
  }

  addPaddingToBounds(bounds) {
    const parts = bounds.split(',').map(Number);

    if (parts.length !== 4 || parts.some(n => !Number.isFinite(n))) {
      throw new Error('Invalid bounds format. Expected four numeric values: "swLng,swLat,neLng,neLat"');
    }

    const [swLng, swLat, neLng, neLat] = parts;

    return {
      xmin: swLng - this.boundsPadding,
      ymin: swLat - this.boundsPadding,
      xmax: neLng + this.boundsPadding,
      ymax: neLat + this.boundsPadding,
    };
  }

  async getCollisions(bounds, includeAllDates = false) {
    console.log(`Getting collision data for bounds: ${bounds}`);

    if (!bounds) {
      throw new Error('Bounds parameter is required');
    }

    const geometry = this.addPaddingToBounds(bounds);
    const dateFilter = includeAllDates ? '1=1' : this.getLastYearDateFilter();


    const whereClause = `${dateFilter} AND Latitude >= ${geometry.ymin} AND Latitude <= ${geometry.ymax} AND Longitude >= ${geometry.xmin} AND Longitude <= ${geometry.xmax}`;

    const params = {
      where: whereClause,
      outFields: '*',
      returnGeometry: 'false',
      f: 'json',
    };

    console.log('ArcGIS Query params:', params);
    console.log('Full URL:', this.baseUrl);

    try {
      const response = await axios.get(this.baseUrl, {
        params,
        timeout: this.timeout,
      });

      console.log('ArcGIS Response status:', response.status);

      if (!response.data || response.data.error) {
        console.error('ArcGIS Error details:', response.data?.error);
        throw new Error(response.data?.error?.message || 'ArcGIS API returned an error');
      }

      const features = response.data.features || [];

      const collisions = features.map(feature => ({
        id: feature.attributes.ObjectID || feature.attributes.Crash_ID,
        crashId: feature.attributes.Crash_ID,
        location: {
          lat: feature.attributes.Latitude,
          lng: feature.attributes.Longitude,
        },
        date: feature.attributes.Crash_Date_and_Time
          ? new Date(feature.attributes.Crash_Date_and_Time).toISOString()
          : null,
        severity: feature.attributes.Crash_Severity,
        injuryRating: this.analyzeCrashSeverity(feature.attributes.Crash_Severity),
        type: feature.attributes.Crash_Type,
        bicycleInvolved: feature.attributes.Bicycle_Involved === 'Yes',
        alcoholInvolved: feature.attributes.Alcohol_Involved === 'Yes',
        phoneInvolved: feature.attributes.Cell_Phone_Involved === 'Yes',
        aggressiveDriverInvolved: feature.attributes.Aggressive_Driver_Involved === 'Yes',
        safetyRating: this.safetyRating(feature),
        location_description: feature.attributes.Crash_Location,
        distance: null,
        attributes: feature.attributes,
      }));

      return {
        collisions,
        count: collisions.length,
        message: 'Successfully retrieved collision data',
      };
    } catch (error) {
      console.error('Error fetching collision data from ArcGIS:', error.message);
      throw new Error(`Failed to fetch collision data: ${error.message}`);
    }
  }

  async getCollisionsByRoute(routeGeometry) {
    // Placeholder implementation
    // TODO: Implement collision data filtering by route
    console.log('Getting collisions along route');

    return {
      collisions: [],
      count: 0,
      message: 'Placeholder response - Implement collision data API integration',
    };
  }
}

module.exports = new CollisionService();
