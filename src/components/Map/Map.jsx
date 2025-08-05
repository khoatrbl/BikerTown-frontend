import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import SearchComponent from "../SearchBar/SearchComponent";

import { fetchAuthSession } from "aws-amplify/auth";

// Import the AWS Location Service client
import {
  LocationClient,
  SearchPlaceIndexForTextCommand,
  SearchPlaceIndexForPositionCommand,
  CalculateRouteCommand,
} from "@aws-sdk/client-location";
import gasStationLocationPng from "../../assets/img/gas-station-location.png"; // Adjust path if needed

const BikerMap = ({
  trip_id,
  start,
  destination,
  startDate,
  startTime,
  endDate,
  stops,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const apiKey =
    "v1.public.eyJqdGkiOiJlNzM0YTViZi1mYzA5LTQ0YzctYTZmOS03MmIzYmJmMTg3OGUifSuASEDweXreTEm3L5_71munQUWgi4KGL51eS0f5ueNpawWUwSNomwgNNhnyBl4qI1VJvxtiOSj4QW5ZbAg_SAVGtMcMoJ2whnDEv1XB_Ttug-yrGSzbo9LS3d_U5kdj79ZhsSl87zPUMBCelLgGnrgK5lCdKNbuxO2H3EWXi2_q4C6qjxo33hrt_yZ0FtT5Zkh8K84SUHSRAEGUQ38jYraMABu2M2RU9_idRdRJVHnHsVgIyhMmxojFX3UPD_YBZnDrkI_u3r6e___ghgM1j91fT2LtG_0AaoL36Zki5o1bSwgGgjz5FlgoBBJ2VFBkzhfwstNDhstKlAFvfDBm9tI.MzRjYzZmZGUtZmY3NC00NDZiLWJiMTktNTc4YjUxYTFlOGZi";
  const awsRegion = "ap-southeast-1"; // e.g., us-east-2, us-east-1, us-west-2, etc.
  const mapName = "BikerTownMap-SGP";
  const placeIndex = "BikerTownPlaceIndex-SGP";
  const routeCalculator = "BikerTownRoutes-SGP";

  const [stopMarkers, setStopMarkers] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [startPlace, setStartPlace] = useState(null);
  const [destinationPlace, setDestinationPlace] = useState(null);
  const [tripLocations, setTripLocations] = useState([]);
  const stopMarkersRef = useRef([]);
  const stopMarkersMapRef = useRef(new Map()); // key = stopId or coords, value = marker

  const startMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const mapBoundsRef = useRef(null);

  const styleUrl = `https://maps.geo.${awsRegion}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor?key=${apiKey}`;

  const colors = [
    "#3887be", // blue
    "#38be7d", // green
    "#be3838", // red
    "#beae38", // yellow
    "#8e38be", // purple
    "#be38b0", // magenta
    "#38bebe", // cyan
  ];

  // Use state to hold the LocationClient instance, making it a dependency
  const [locationClient, setLocationClient] = useState(null);

  // Initialize the LocationClient using useState
  useEffect(() => {
    const initLocationClient = async () => {
      if (!locationClient) {
        // Only initialize if not already set
        try {
          // Fetch session credentials from Amplify
          const { credentials } = await fetchAuthSession(); //

          if (credentials) {
            ///

            const client = new LocationClient({
              region: awsRegion,
              credentials: {
                // Pass the credentials object directly
                accessKeyId: credentials.accessKeyId,
                secretAccessKey: credentials.secretAccessKey,
                sessionToken: credentials.sessionToken,
              },
            });
            setLocationClient(client);
            console.log("LocationClient initialized with Amplify credentials.");
          } else {
            console.error(
              "No Amplify credentials available. Cannot initialize LocationClient."
            );
          }
        } catch (e) {
          console.error(
            "Failed to initialize LocationClient with Amplify credentials:",
            e
          );
        }
      }
    };

    initLocationClient();
  }, [awsRegion]); // Add locationClient to dependencies to avoid re-initialization loop

  useEffect(() => {
    /**
     * @async
     * @function setUpMap
     * @description Initializes and renders the map with start, destination and stops points,
     * and calculates the route using AWS Location Service.
     * @returns
     */
    const setUpMap = async () => {
      // Ensure the LocationClient is initialized before proceeding
      if (!locationClient) {
        console.warn(
          "LocationClient is not initialized yet. Skipping map setup."
        );
        return; // Exit if client is not ready
      }

      // Ensure the map container is available
      if (!mapContainerRef.current) {
        console.error("Map container ref is null. Map cannot be initialized.");
        return;
      }

      console.log("start:", start);
      console.log("destination:", destination);

      /**
       * @async
       * @function getPlaceData
       * @description Fetches data for a given location coordinates using AWS Location Service.
       * @param {Array<[number, number]>} locationCoords - The location coordinates as [lng, lat] to search for place data
       * @returns
       */
      const getPlaceData = async (locationCoords) => {
        try {
          const command = new SearchPlaceIndexForPositionCommand({
            IndexName: placeIndex,
            Position: locationCoords,
            MaxResults: 1, // Only need the first result for coordinates
            FilterCountries: ["VNM"], // Filter to Vietnam
          });

          const response = await locationClient.send(command);

          if (response.Results && response.Results.length > 0) {
            return {
              Coords: response.Results[0].Place.Geometry.Point, // [longitude, latitude]
              Label: response.Results[0].Place.Label,
            };
          }

          console.warn(`No coordinates found for: ${locationCoords}`);
          return null;
        } catch (error) {
          console.error("Error fetching coordinates with AWS SDK:", error);
          return null;
        }
      };
      let startPoint;
      if (start.length > 0) {
        startPoint = await getPlaceData(start); // Fetch coordinates for the start location
        setStartPlace(startPoint); // Store start place for later use
      }

      let destinationPoint;
      if (destination.length > 0) {
        destinationPoint = await getPlaceData(destination); // Fetch coordinates for the destination location
        setDestinationPlace(destinationPoint); // Store destination place for later use
      }

      const stopPointsCollection = [];

      if (stops.length > 0) {
        // fetch coordinates for each stop
        for (const stop of stops) {
          const stopPoint = await getPlaceData(stop);
          console.log("Stop Point:", stopPoint);
          stopPointsCollection.push(stopPoint);
        }

        stopPointsCollection.shift(); // remove first stop (indicating start)
        stopPointsCollection.pop(); // remove last (indicating destination)
      }

      let locations = [];
      if (startPoint) {
        locations.push({ id: 1, location: startPoint });
      }
      console.log("Stop Points Collection:", stopPointsCollection);

      for (let i = 0; i < stopPointsCollection.length; i++) {
        locations.push({ id: i + 2, location: stopPointsCollection[i] });
      }

      if (destinationPoint) {
        locations.push({
          id: stopPointsCollection.length + 2,
          location: destinationPoint,
        });
      }

      if (locations.length > 0) {
        setTripLocations(locations); // Store trip locations for later use
      }

      if (!mapContainerRef.current) {
        console.error("Map container ref is null. Map cannot be initialized.");
        return;
      }

      // Initialize the map when the component mounts
      const map = new maplibregl.Map({
        container: mapContainerRef.current, // container id
        style: styleUrl, // style URL
        center: startPoint ? startPoint.Coords : [106.701755, 10.776652], // starting position [lng, lat] - McDonald's Dakao: [10.79272465328192, 106.69876506645745]
        zoom: 13, // starting zoom
        validateStyle: false, // Disable style validation
        // maxBounds: bounds,
      });

      mapRef.current = map; // Store the map instance in a ref

      if (mapRef.current && startPoint && startPoint.Coords) {
        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
          `<strong>Start:</strong> ${startPoint.Label}`
        );

        // Create a fixed marker for the start point using the found coordinate
        const startMarker = new maplibregl.Marker({ color: "black" }) // Create fixed marker
          .setLngLat(startPoint.Coords) // Set coordinates [long, lat] for marker
          .setPopup(popup)
          .addTo(mapRef.current); // Add marker to the map
        startMarkerRef.current = startMarker; // Save to ref
      }

      if (mapRef.current && destinationPoint && destinationPoint.Coords) {
        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
          `<strong>Destination:</strong> ${destinationPoint.Label}`
        );

        // Create a fixed marker for the destination point using the found coordinate
        const destinationMarker = new maplibregl.Marker({ color: "red" })
          .setLngLat(destinationPoint.Coords) // Create fixed marker
          .setPopup(popup)
          .addTo(mapRef.current); // Add marker to the map
        destinationMarkerRef.current = destinationMarker; // Save to ref
      }

      const newStopMarkers = []; // Array to hold stop markers

      if (stopPointsCollection.length > 0) {
        // Create fixed markers for each stop
        stopPointsCollection.forEach((stop) => {
          const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
            `<strong>Stop:</strong> ${stop.Label}`
          );
          const markerKey = stop.Label + stop.Coords.join(","); // unique key based on label + coords

          if (mapRef.current) {
            const marker = new maplibregl.Marker()
              .setLngLat(stop.Coords)
              .setPopup(popup)
              .addTo(mapRef.current);

            newStopMarkers.push(marker);
            stopMarkersMapRef.current.set(markerKey, marker); // save for later removal
          }
        });

        setStopMarkers(newStopMarkers); // Store stop markers
      }

      if (startPoint && destinationPoint) {
        if (startPoint.Coords && destinationPoint.Coords) {
          const bounds = new maplibregl.LngLatBounds();
          bounds.extend(startPoint.Coords);
          bounds.extend(destinationPoint.Coords);

          // Fit map view to start and destination points
          mapBoundsRef.current = bounds;

          map.fitBounds(bounds, {
            padding: 60, // Padding in pixels
            maxZoom: 17, // Optional: maximum zoom level
            duration: 1000, // Animation duration in ms
          });

          // Calculate the route using AWS Location Service
          const routesRes = await calculateRoute(
            stopPointsCollection,
            startPoint,
            destinationPoint
          );

          drawRoute(map, routesRes); // Draw the route on the map
        }
      }

      // Clean up on unmount
      return () => {
        map.remove();
      };
    };

    setUpMap();
  }, [styleUrl, locationClient]);

  const drawRoute = (map, routesRes) => {
    // Remove ALL existing route layers/sources
    const layers = map.getStyle().layers;
    if (layers) {
      layers.forEach((layer) => {
        if (layer.id.startsWith("route-leg-")) {
          if (map.getLayer(layer.id)) map.removeLayer(layer.id);
        }
      });
    }

    const sources = Object.keys(map.getStyle().sources);
    sources.forEach((sourceId) => {
      if (sourceId.startsWith("route-leg-")) {
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      }
    });

    // Extract legs from the response for route rendering
    if (!routesRes || !routesRes.Legs) {
      console.warn("No route legs found in the response.");
      return;
    }

    const legs = routesRes?.Legs || [];
    const allRouteCoords = [];

    // Loop through each leg and add it to the map
    legs.forEach((leg, i) => {
      const lineString = leg?.Geometry?.LineString;
      if (!lineString) {
        return;
      }

      allRouteCoords.push(...lineString);

      const geojson = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: lineString,
        },
        properties: {},
      };

      mapRef.current.addSource(`route-leg-${i}`, {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: `route-leg-${i}`,
        type: "line",
        source: `route-leg-${i}`,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": colors[i % colors.length],
          "line-width": 7,
          "line-opacity": 1,
        },
      });
    });

    setRouteCoords(allRouteCoords);
  };

  /**
   * @async
   * @function calculateRoute
   * @description Calculates the route using AWS Location Service based on start, destination, and stops.
   * @returns {Promise<Object>} The route response from AWS Location Service
   */
  const calculateRoute = async (
    stopPointsCollection,
    startPoint,
    destinationPoint
  ) => {
    try {
      if (!locationClient) {
        console.error(
          "LocationClient is not initialized for route calculation."
        );
        return null;
      }

      // Prepare waypoints, ensuring they are formatted correctly for the SDK
      // The SDK expects an array of [longitude, latitude] points for Waypoints
      const waypoints = stopPointsCollection.map((stop) => ({
        Position: stop.Coords,
      }));

      const command = new CalculateRouteCommand({
        CalculatorName: routeCalculator, // Your route calculator name
        DeparturePosition: startPoint.Coords,
        DestinationPosition: destinationPoint.Coords,
        WaypointPositions:
          waypoints.length > 0 ? waypoints.map((w) => w.Position) : undefined, // Only include if there are actual stops
        TravelMode: "Motorcycle",
        Avoid: {
          ControlledAccessHighways: true,
        },
        OptimizeRoutingFor: "FastestRoute",
        IncludeLegGeometry: true,
      });

      const response = await locationClient.send(command);

      return response;
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * @function handleSearchResult
   * @description Handles the search result from the SearchComponent, displaying markers on the map.
   * @param {object} result
   */
  const handleSearchResult = (result) => {
    console.log("Received result: ", result);

    removeStopMarkers();

    if (result) {
      // Check for the flag to determine if it's a gas station
      const isGasStation = result.Flag == "Fuel" ? true : false;

      // if it is, render the marker with a gas station icon
      // if not, render the marker with a purple color
      if (isGasStation) {
        const newStopMarkers = result.Stations.map((location) => {
          let markerElement;

          markerElement = document.createElement("div");
          markerElement.className = "gas-station-marker";
          // Set background image using CSS, or an <img> tag inside
          markerElement.style.backgroundImage = `url("${gasStationLocationPng}")`; // Use template literal for URL
          markerElement.style.width = "30px"; // Adjust size as needed
          markerElement.style.height = "30px";
          markerElement.style.backgroundSize = "contain";
          markerElement.style.backgroundRepeat = "no-repeat";
          markerElement.style.backgroundPosition = "center";

          const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
            `<strong>Gas station:</strong> ${location.Label}`
          );

          const marker = new maplibregl.Marker({ element: markerElement })
            .setLngLat(location.Coords)
            .setPopup(popup)
            .addTo(mapRef.current);

          return marker;
        });

        setStopMarkers(newStopMarkers);
        stopMarkersRef.current = newStopMarkers;
      } else {
        const newStopMarkers = result.Results.map((location) => {
          const popup = new maplibregl.Popup({ offset: 25 }).setText(
            location.Label
          );
          const marker = new maplibregl.Marker({ color: "purple" })
            .setLngLat(location.Coords)
            .setPopup(popup)
            .addTo(mapRef.current);
          return marker;
        });
        setStopMarkers(newStopMarkers);
      }
    }

    if (mapBoundsRef.current) {
      // Fit the map to the bounds of the search results
      mapRef.current.fitBounds(mapBoundsRef.current, {
        padding: 60, // Padding in pixels
        maxZoom: 14, // Optional: maximum zoom level
        duration: 1000, // Animation duration in ms
      });
    }
  };

  /**
   * @function handleSelectResult
   * @description Handles the selection of a search result, placing a marker on the map and move to that marker.
   * @param {object} result - The selected result from the search
   */
  const handleSelectResult = (result) => {
    const location = result.Results;
    const resultCoordinates = location.Coords;
    const isGasStation = result.Flag == "Fuel" ? true : false;

    stopMarkers.forEach((marker) => marker.remove());
    setStopMarkers([]);

    const newSearchMarker = [];

    if (isGasStation) {
      mapRef.current.flyTo({
        center: resultCoordinates,
        zoom: 14,
        speed: 1.2,
        essential: true,
      });

      let markerElement;

      markerElement = document.createElement("div");
      markerElement.className = "gas-station-marker";
      // Set background image using CSS, or an <img> tag inside
      markerElement.style.backgroundImage = `url("${gasStationLocationPng}")`; // Use template literal for URL
      markerElement.style.width = "30px"; // Adjust size as needed
      markerElement.style.height = "30px";
      markerElement.style.backgroundSize = "contain";
      markerElement.style.backgroundRepeat = "no-repeat";
      markerElement.style.backgroundPosition = "center";

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
        `<strong>Gas station:</strong> ${location.Label}`
      );

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat(resultCoordinates)
        .setPopup(popup)
        .addTo(mapRef.current);

      newSearchMarker.push(marker);
    } else {
      mapRef.current.flyTo({
        center: resultCoordinates,
        zoom: 14,
        speed: 1.2,
        essential: true,
      });
      // const marker = new maplibregl.Marker()
      //   .setLngLat(resultCoordinates)
      //   .setPopup(popup)
      //   .addTo(mapRef.current);

      // newSearchMarker.push(marker);
    }

    setStopMarkers(newSearchMarker);
  };

  const handleStopChanges = async (result) => {
    console.log("Received stop changes: ", result);

    const newTripLocations = result;

    removeStopMarkers();

    try {
      // Update the stops with the new result
      if (Array.isArray(newTripLocations) && newTripLocations.length > 0) {
        const updatedStops = newTripLocations.map((stop) => ({
          Coords: stop.location.Coords,
          Label: stop.location.Label,
        }));

        updatedStops.shift(); // Remove the first stop (start point)
        updatedStops.pop(); // Remove the last stop (destination point)

        // Create and store new markers
        const newMarkers = updatedStops.map((stop) => {
          const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
            `<strong>Stop:</strong> ${stop.Label}`
          );

          const marker = new maplibregl.Marker()
            .setLngLat(stop.Coords)
            .setPopup(popup)
            .addTo(mapRef.current);

          return marker;
        });

        updateFixedMarkers(
          newTripLocations[0].location,
          newTripLocations[newTripLocations.length - 1].location
        );

        setStopMarkers(newMarkers);
        stopMarkersRef.current = newMarkers;

        // Update the trip locations with the new stops
        setTripLocations(newTripLocations);

        if (
          newTripLocations[0].location.Coords.length > 0 &&
          newTripLocations[newTripLocations.length - 1].location.Coords.length >
            0
        ) {
          console.log("Entered this route function");
          // Recalculate the route with the updated stops
          const routesRes = await calculateRoute(
            updatedStops,
            newTripLocations[0].location, // Start point
            newTripLocations[newTripLocations.length - 1].location // Destination point
          );
          if (routesRes) {
            drawRoute(mapRef.current, routesRes); // Draw the updated route on the map
          } else {
            console.error("Failed to recalculate route with updated stops.");
          }
        } else {
          console.log("passed");
        }
      } else {
        console.warn("Result not ready or contains invalid stops:", result);
      }
    } catch (error) {
      console.error("Error updating stops:", error);
    }
  };

  const removeStopMarkers = () => {
    stopMarkersRef.current.forEach((marker) => marker.remove());
    stopMarkersRef.current = [];
  };

  const updateFixedMarkers = (startLocation, destinationLocation) => {
    // Remove old markers
    if (startMarkerRef.current) {
      startMarkerRef.current.remove();
      startMarkerRef.current = null;
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    if (startLocation.Coords.length > 0) {
      // Add new start marker
      const startPopup = new maplibregl.Popup({ offset: 25 }).setHTML(
        `<strong>Start:</strong> ${startLocation.Label}`
      );
      const newStartMarker = new maplibregl.Marker({ color: "black" })
        .setLngLat(startLocation.Coords)
        .setPopup(startPopup)
        .addTo(mapRef.current);
      startMarkerRef.current = newStartMarker;
    }

    if (destinationLocation.Coords.length > 0) {
      // Add new destination marker
      const destPopup = new maplibregl.Popup({ offset: 25 }).setHTML(
        `<strong>Destination:</strong> ${destinationLocation.Label}`
      );
      const newDestMarker = new maplibregl.Marker({ color: "red" })
        .setLngLat(destinationLocation.Coords)
        .setPopup(destPopup)
        .addTo(mapRef.current);
      destinationMarkerRef.current = newDestMarker;
    }
  };

  return (
    <div>
      <div style={{ position: "relative" }}>
        <div
          className="search-container"
          style={{
            position: "absolute",
            transition: "left 0.2s",
            zIndex: 1000,
          }}
        >
          <SearchComponent
            trip_id={trip_id}
            onSearchResult={handleSearchResult}
            onSelectResult={handleSelectResult}
            onStopChanges={handleStopChanges}
            routeCoords={routeCoords}
            locationClient={locationClient}
            start={startPlace} // null
            destination={destinationPlace} // null
            startDate={startDate}
            startTime={startTime}
            endDate={endDate}
            tripLocations={tripLocations} // []
          />
        </div>

        <div
          ref={mapContainerRef}
          style={{ width: "100%", height: "700px", borderRadius: "8px" }}
          id="map"
        ></div>
      </div>
    </div>
  );
};

export default BikerMap;
