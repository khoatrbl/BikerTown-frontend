import React from "react";
import Radar from "radar-sdk-js";

import "radar-sdk-js/dist/radar.css";
import axios from "axios";

const RADAR_SECRET_KEY = "prj_test_pk_24a569c2922c058226be787dbcd615ed74904d2d";
// For production, use: import.meta.env.VITE_RADAR_SECRET_KEY

const MAP_CENTER = [106.69876506645745, 10.792640340839203]; // [lng, lat] - McDonald Dien Bien Phu
const TEST_VT = [107.14239, 10.40239];
const MAP_ZOOM = 14;

class RadarMap extends React.Component {
  componentDidMount() {
    // const RADAR_SECRET_KEY = import.meta.env.RADAR_MAP_SECRET_KEY;
    const RADAR_SECRET_KEY =
      "prj_test_pk_24a569c2922c058226be787dbcd615ed74904d2d";
    Radar.initialize(RADAR_SECRET_KEY);

    // create a map
    const map = Radar.ui.map({
      container: "map",
      style: "radar-default-v1",
      // 10.792640340839203, 106.69876506645745
      center: MAP_CENTER, // McDonald Dien Bien Phu
      zoom: MAP_ZOOM,
    });

    const uiMarket = Radar.ui
      .marker({
        text: "Test Marker",
        popup: {
          text: "This is a test marker",
        },
      })
      .setLngLat(TEST_VT)
      .addTo(map);

    // add a marker to the map
    Radar.ui.marker({ text: "Meetup Point" }).setLngLat(MAP_CENTER).addTo(map);

    map.fitToMarkers();

    const fetchRoutes = async () => {
      const response = await axios.get(
        "https://api.radar.io/v1/route/directions",
        {
          params: {
            locations: `${MAP_CENTER[1]},${MAP_CENTER[0]}|${TEST_VT[1]},${TEST_VT[0]}`,

            mode: "car",
            units: "metric",
            avoid: "highways",
            alternatives: true,
          },
          headers: {
            Authorization: `${RADAR_SECRET_KEY}`,
          },
        }
      );

      console.log(
        "Response from Radar API:",
        response.data.routes[0].geometry.polyline
      );

      map.on("load", () => {
        const polyline = response.data.routes[0].geometry.polyline;
        const polylineFeature = map.addPolyline(polyline, {
          id: "polyline",
          precision: 6,
          properties: {
            name: "Polyline Feature",
          },
          paint: {
            "line-color": "red",
          },
        });

        // fit the map bounds to the features
        map.fitToFeatures({ padding: 40 });
      });
    };

    fetchRoutes();
  }

  render() {
    return (
      <div
        id="map-container"
        style={{ width: "82%", height: "75%", position: "absolute" }}
      >
        <div
          id="map"
          style={{ height: "100%", position: "absolute", width: "100%" }}
        />
      </div>
    );
  }
}

export default RadarMap;
