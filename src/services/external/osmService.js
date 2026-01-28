const config = require('../../config');
const axios = require('axios');

class OSMService {
  constructor() {
    this.baseUrl = 'https://overpass-api.de/api/interpreter';
    this.timeout = 60000;
  }

  async getBikeLanes(city = "Grand Rapids") {
    console.log(`Getting bike lanes for city: ${city}`);

    const query = `
    [out:json][timeout:50];
    area["name"="${city}"]->.searchArea;
    (
      way["highway"="cycleway"](area.searchArea);
      way["cycleway"](area.searchArea);
      way["cycleway:left"](area.searchArea);
      way["cycleway:right"](area.searchArea);
      way["cycleway:both"](area.searchArea);
    );
    out geom;
    `;

    const queryXML = `
      <osm-script output="json" timeout="50">
        <query into="a" type="area">
          <has-kv k="name" v="${city}"/>
        </query>
        <union>
          <query type="way">
            <has-kv k="highway" v="cycleway"/>
            <area-query from="a"/>
          </query>
          <query type="way">
            <has-kv k="cycleway"/>
            <area-query from="a"/>
          </query>
          <query type="way">
            <has-kv k="cycleway:left"/>
            <area-query from="a"/>
          </query>
          <query type="way">
            <has-kv k="cycleway:right"/>
            <area-query from="a"/>
          </query>
          <query type="way">
            <has-kv k="cycleway:both"/>
            <area-query from="a"/>
          </query>
        </union>
        <print mode="body" geometry="full"/>
      </osm-script>
    `;

    /* Safety Rating Logic
      Manually skimmed the data and compared to personal experience to determine a rating
        3 (safest):
          "bicycle": "designated" && "highway": "cycleway" (or just highway: cycleway)
        2
          "cycleway": "lane"
        1 (least safe)
          "cycleway": "shared_lane"
      Additional parameters to consider: speed
    */
    const safetyRating = (tags) => {
      if(tags.highway && tags.highway === 'cycleway') return 3
      if(tags.cycleway && tags.cycleway === 'lane') return 2;
      if(tags.cycleway && tags.cycleway === 'shared_lane') return 1;
      return 1;
    }
    const getSpeed = (tags) => {
      if(!tags.maxspeed)return null;
      const speed = tags.maxspeed;
      try{
        console.log(speed.substring(0, speed.indexOf(' ')));
        return Number(speed.substring(0, speed.indexOf(' ')));
      }catch(e){
        return null;
      }
    }

    try {
      const response = await axios.post(this.baseUrl, queryXML, {
        timeout: this.timeout,
        headers: { 'Content-Type': 'text/plain' },
      });

      const elements = response.data.elements || [];

      const bikeLanes = elements.map(element => ({
        id: element.id,
        name: element.tags?.name || 'Unnamed bike lane',
        type: element.tags?.highway || element.tags?.cycleway || 'cycleway',
        safetyRating: safetyRating(element.tags),
        geometry: element.geometry || [],
        tags: element.tags,
      }));

      return {
        bikeLanes,
        count: bikeLanes.length,
        message: 'Successfully retrieved bike lanes',
      };
    } catch (error) {
      console.error('Error fetching bike lanes from OSM:', error.message);
      throw new Error(`Failed to fetch bike lanes: ${error.message}`);
    }
  }

  async getBikeParking(location, radius = 1000) {
    console.log(`Getting bike parking near ${location} within ${radius}m`);

    const [lng, lat] = location.split(',').map(Number);

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid location format. Expected "longitude,latitude"');
    }

    const query = `
    [out:json][timeout:50];
    (
      node["amenity"="bicycle_parking"](around:${radius},${lat},${lng});
      way["amenity"="bicycle_parking"](around:${radius},${lat},${lng});
    );
    out body;
    >;
    out skel qt;
    `;

    try {
      const response = await axios.post(this.baseUrl, query, {
        timeout: this.timeout,
        headers: { 'Content-Type': 'text/plain' },
      });

      const elements = response.data.elements || [];

      const parking = elements
        .filter(element => element.type === 'node' || element.type === 'way')
        .map(element => ({
          id: element.id,
          name: element.tags?.name || 'Unnamed bike parking',
          location: {
            lat: element.lat || element.center?.lat,
            lng: element.lon || element.center?.lon,
          },
          capacity: element.tags?.capacity ? parseInt(element.tags.capacity) : null,
          type: element.tags?.bicycle_parking || 'unknown',
          covered: element.tags?.covered,
          tags: element.tags,
        }));

      return {
        parking,
        count: parking.length,
        message: 'Successfully retrieved bike parking',
      };
    } catch (error) {
      console.error('Error fetching bike parking from OSM:', error.message);
      throw new Error(`Failed to fetch bike parking: ${error.message}`);
    }
  }
}

module.exports = new OSMService();
