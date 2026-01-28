const config = require('../../config');
const axios = require('axios');

class MapboxService {
  constructor() {
    this.apiKey = config.mapboxApiKey;
    this.baseUrl = 'https://api.mapbox.com';
    this.timeout = 10000;
  }


  async getDirections(origin, destination, profile = 'cycling') {
    // Placeholder implementation
    // TODO: Implement actual Mapbox API call
    console.log(`Getting ${profile} directions from ${origin} to ${destination}`);
    const urlSuffix = `/directions/v5/mapbox/cycling/${origin};${destination}?access_token=${this.apiKey}`
    console.log(this.baseUrl + urlSuffix);

    try {
      const response = await axios.get(this.baseUrl + urlSuffix, {
        timeout: this.timeout,
      });

      console.log('MapBox Response status:', response.status);

      if (!response.data || response.data.error) {
        console.error('MapBox Error details:', response.data?.error);
        throw new Error(response.data?.error?.message || 'MapBox API returned an error');
      }

      return response.data
    } catch (error) {
      console.error('Error fetching collision data from MapBox:', error.message);
      throw new Error(`Failed to fetch route data: ${error.message}`);
    }
  }

  async getAlternativeRoutes(origin, destination, profile = 'cycling') {
    // Placeholder implementation
    // TODO: Implement actual Mapbox API call with alternatives
    console.log(
      `Getting alternative ${profile} routes from ${origin} to ${destination}`
    );

    return {
      routes: [
        {
          name: 'Route 1',
          distance: 5000,
          duration: 1200,
          geometry: [],
        },
        {
          name: 'Route 2',
          distance: 5200,
          duration: 1150,
          geometry: [],
        },
      ],
      message: 'Placeholder response - Implement Mapbox API integration',
    };
  }
}

module.exports = new MapboxService();
