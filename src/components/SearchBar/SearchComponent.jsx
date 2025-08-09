"use client";

import { message } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import "./SearchComponent.css"; // Adjust the path as necessary
import { useState, useRef, useEffect } from "react";
import {
  SearchPlaceIndexForSuggestionsCommand,
  GetPlaceCommand,
  SearchPlaceIndexForTextCommand,
} from "@aws-sdk/client-location";

import {
  MapPin,
  Plus,
  Fuel,
  GripVertical,
  X,
  ArrowUpDown,
  Edit3,
  Check,
  XIcon,
} from "lucide-react";

import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";

const SearchComponent = ({
  trip_id,
  onSearchResult,
  onSelectResult,
  onStopChanges,
  routeCoords,
  locationClient,
  start, // null
  destination, // null
  startDate,
  startTime,
  endDate,
  tripLocations, // []
}) => {
  const API_URL = import.meta.env.VITE_BASE_API_URL;
  const placeIndex = "BikerTownPlaceIndex-SGP";

  const [suggestionsToDisplay, setSuggestionsToDisplay] = useState(new Set());
  const [gasStations, setGasStations] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showGasStations, setShowGasStations] = useState(false);
  // const [inputValue, setInputValue] = useState("");
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [activeLocationId, setActiveLocationId] = useState(null);
  // Date and time state
  const [isEditingDateTime, setIsEditingDateTime] = useState(false);
  const [dateTimeData, setDateTimeData] = useState({
    startDate,
    endDate,
    startTime,
  });
  const [tempDateTimeData, setTempDateTimeData] = useState(dateTimeData);
  const lastFetchedRouteHashRef = useRef(null);

  const [locations, setLocations] = useState([
    {
      id: 1,
      text: "",
      location: {
        Label: "",
        Coords: [],
      },
    },

    {
      id: 2,
      text: "",
      location: {
        Label: "",
        Coords: [],
      },
    },
  ]);

  const debounceRef = useRef();

  useEffect(() => {
    if (tripLocations.length > 0) {
      setLocations(
        tripLocations.map((loc) => ({
          ...loc,
          text: loc.location ? loc.location.Label : "",
        }))
      );
    }
  }, [tripLocations]);

  // useEffect(() => {
  //   // Only run if routeCoords is not empty
  //   if (routeCoords && routeCoords.length > 0) {
  //     enableGasStation();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [routeCoords]);

  /**
   * @function haversineDistance
   * @description Calculates the distance between two geographical coordinates
   * using the Haversine formula.
   *
   * @param {[number, number]} coord1 - The first coordinate as [longitude, latitude].
   * @param {[number, number]} coord2 - The second coordinate as [longitude, latitude].
   * @returns {number} Distance in kilometers between two coordinates
   */
  const haversineDistance = (coord1, coord2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;

    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;

    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  /**
   * @function filterCoordsByDistance
   * @description Filters an array of geographical coordinates so that each retained coordinate
   * is at least `minDistanceKm` away from the previously accepted one.
   *
   * @param {Array<[number, number]>} coords - Array of coordinates in [longitude, latitude] format.
   * @param {number} [minDistanceKm=10] - Minimum distance in kilometers between accepted coordinates.
   * @returns {Array<[number, number]>} Filtered list of coordinates meeting the distance condition.
   */
  const filterCoordsByDistance = (coords, minDistanceKm = 10) => {
    if (!coords.length) return [];
    const filtered = [coords[0]];
    let last = coords[0];
    for (let i = 1; i < coords.length; i++) {
      if (haversineDistance(last, coords[i]) >= minDistanceKm) {
        filtered.push(coords[i]);
        last = coords[i];
      }
    }
    return filtered;
  };

  /**
   * @function deduplicateSuggestionsByPlaceId
   * @description Deduplicates suggestions based on each suggestion's PlaceId.
   * @param {Set} suggestion - a Set of suggestions given by the AWS Location Service API.
   * @returns {Set} A Set of unique suggestions, where each suggestion is guaranteed to have a unique PlaceId
   */
  const deduplicateSuggestionsByPlaceId = (suggestions) => {
    const uniquePlacesMap = new Map();

    // Loop through the suggestion list
    suggestions.forEach((suggestion) => {
      if (suggestion && suggestion.PlaceId) {
        // Use PlaceId as the key. If a PlaceId is already in the map,
        // adding it again with a new value will simply overwrite the old one.
        // This effectively keeps only the last encountered object for a given PlaceId.
        uniquePlacesMap.set(suggestion.PlaceId, suggestion);
      }
    });

    // Convert the values of the Map back into a Set if you prefer a Set as the final output.
    // This Set will now contain truly unique objects based on PlaceId.
    return new Set(uniquePlacesMap.values());
  };

  // Filter route coordinates to ensure they are at least 7km apart
  // This is to reduce the number of API calls and improve performance.
  let filteredBiasPoints = [];
  if (routeCoords.length > 0) {
    filteredBiasPoints = filterCoordsByDistance(routeCoords, 7);
  }

  // Handle the Enter key press to trigger a search for places
  /**
   * @async
   * @function handleEnter
   * @description Is triggered when the user presses the Enter key in the search input
   * field. It fetches place details based on the suggestions displayed and passes the results
   * back to the parent component via the `onSearchResult` callback.
   */
  const handleEnter = async () => {
    console.log("Enter pressed");
    setShowSearchResults(true);

    // Clear any existing debounce timeout
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const searchResults = []; // The collection in which we will store the search results

    // Loop through all the suggestions found earlier
    if (suggestionsToDisplay.size > 0) {
      Array.from(suggestionsToDisplay).map((item) => {
        try {
          // For each suggestion, use the PlaceId to find the place details
          // Results will be pushed into searchResults array
          const findPlace = async () => {
            const command = new GetPlaceCommand({
              IndexName: placeIndex,
              PlaceId: item.PlaceId,
            });

            const response = await locationClient.send(command);

            // Place object for storing relevant information about the place
            const place = {
              Label: response.Place.Label,
              Coords: response.Place.Geometry.Point,
            };

            searchResults.push(place); // Adding the place object into the result array
          };

          findPlace();
        } catch (e) {
          alert("Search failed.");
          console.error(e);
        }
      });
    }

    // Timeout for 2 seconds to wait for all the promises to resolve
    // as well as the population of the searchResults array to be done
    setTimeout(() => {
      // After the timeout, create a return object with a Flag and the actual result for further processing
      const returnResults = {
        Flag: "Search",
        Results: searchResults,
      };

      // Callback function to pass the results back to the parent component
      // This will trigger the rendering of markers on the map
      onSearchResult(returnResults);
    }, 2000);
  };

  /**
   * @async
   * @function enableGasStation
   * @description Finds all of the available gas stations along a specific route by using bias points
   *
   */
  const enableGasStation = async () => {
    const searchQuery = "gas station";
    const nextShowGasStationsStatus = !showGasStations;
    const currentRouteHash = hashRoute(filteredBiasPoints);
    const shouldRefetch =
      gasStations.length === 0 ||
      currentRouteHash !== lastFetchedRouteHashRef.current;

    setShowGasStations(nextShowGasStationsStatus);

    if (nextShowGasStationsStatus) {
      if (shouldRefetch) {
        console.log("Enter refetch");

        try {
          let localGasStations = [];
          const seenIds = new Set();

          // 🔥 helper to emit new results as soon as they come in
          const emitStation = (loc) => {
            if (!loc || !loc.Place || !loc.PlaceId) return;
            if (seenIds.has(loc.PlaceId)) return;
            seenIds.add(loc.PlaceId);

            const station = {
              Coords: loc.Place.Geometry.Point,
              Label: loc.Place.Label,
            };
            localGasStations.push(station);

            // Send back what we have so far
            onSearchResult({
              Flag: "Fuel",
              Stations: [...localGasStations],
            });
          };

          if (filteredBiasPoints.length === 0) {
            const command = new SearchPlaceIndexForTextCommand({
              IndexName: placeIndex,
              BiasPosition: [106.698835880632, 10.7925021280592],
              Text: searchQuery,
              FilterCountries: ["VNM"],
            });

            const response = await locationClient.send(command);
            response.Results.forEach(emitStation);
          } else {
            for (const biasPoints of filteredBiasPoints) {
              const [lng, lat] = biasPoints;
              const delta = 0.1;

              const command = new SearchPlaceIndexForTextCommand({
                IndexName: placeIndex,
                Text: searchQuery,
                FilterBBox: [
                  lng - delta,
                  lat - delta,
                  lng + delta,
                  lat + delta,
                ],
                FilterCountries: ["VNM"],
              });

              const response = await locationClient.send(command);
              response.Results.forEach(emitStation);
            }
          }

          if (localGasStations.length === 0) {
            console.log("No gas stations found.");
            onSearchResult(); // send empty
            setShowGasStations(false); // toggle off if none
          }

          // save full result locally for re-use
          setGasStations(localGasStations);
          lastFetchedRouteHashRef.current = currentRouteHash;
        } catch (e) {
          console.error("Gas station search failed:", e);
        }
      } else {
        // 🔥 Already fetched before, return cached data immediately
        onSearchResult({
          Flag: "Fuel",
          Stations: [...gasStations],
        });
      }
    } else {
      onSearchResult(); // toggled off, return empty
    }
  };

  /**
   * @async
   * @function searchSuggestion
   * @description Fetches search suggestions based on the user's input.
   * @param {string} value - The search query entered by the user
   * @returns {Promise<Set<Object>> | undefined} A set of unique place suggestions (if any),
   * or `undefined` if the input is empty or the search fails.
   */
  const searchSuggestion = async (value, onChunkFound) => {
    if (!value) return;

    try {
      const allResults = new Set();

      const handleResults = (results) => {
        results.forEach((r) => {
          if (r?.PlaceId && r?.Text) {
            allResults.add(r);
          }
        });

        const deduped = deduplicateSuggestionsByPlaceId(allResults);
        onChunkFound(deduped);
      };

      if (filteredBiasPoints.length === 0) {
        const command = new SearchPlaceIndexForSuggestionsCommand({
          IndexName: placeIndex,
          BiasPosition: [106.698835880632, 10.7925021280592], // HCMC
          Text: value,
          FilterCountries: "VNM",
          MaxResults: 15,
        });

        const response = await locationClient.send(command);

        handleResults(response.Results);
      } else {
        for (const biasPoints of filteredBiasPoints) {
          if (allResults.size >= 300) {
            return;
          }

          const command = new SearchPlaceIndexForSuggestionsCommand({
            IndexName: placeIndex,
            Text: value,
            BiasPosition: biasPoints, // Use the bias points for better results
            FilterCountries: "VNM",
            MaxResults: 15,
          });

          const response = await locationClient.send(command);
          handleResults(response.Results);
        }
      }
    } catch (err) {
      alert("Search failed.");
      console.error(err);
    }
  };

  /**
   * @async
   * @function handleInputChange
   * @description Handles input changes in the search bar, debouncing the search suggestions.
   * @param {string} e - The event object from the input change
   */
  const handleInputChange = async (e) => {
    console.log("Input changed:", e.target.value);
    const value = e.target.value;
    // setInputValue(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value) {
      setShowSearchResults(false);

      return;
    }

    setSuggestionsToDisplay(new Set());

    debounceRef.current = setTimeout(async () => {
      console.log("Debounce executing!");
      try {
        // const suggestions = await searchSuggestion(value);
        // console.log("suggestions", suggestions);
        // const uniqueSuggestionsSet =
        //   deduplicateSuggestionsByPlaceId(suggestions);

        // setSuggestionsToDisplay(uniqueSuggestionsSet || new Set());
        // console.log("Displaying:", suggestionsToDisplay);

        searchSuggestion(value, (newChunkSet) => {
          setSuggestionsToDisplay(new Set(newChunkSet)); // Update with new results
        });
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    }, 500); // Debounce for 400ms
  };

  /**
   * @async
   * @function handleSelect
   * @description Handles the selection of a location from the search results.
   * @param {object} location - The selected location object from the search results
   * @returns {Promise<void>}
   */
  const handleSelect = async (location) => {
    if (location.Text) {
      try {
        const findPlace = async () => {
          const command = new GetPlaceCommand({
            IndexName: placeIndex,
            PlaceId: location.PlaceId,
          });

          const response = await locationClient.send(command);
          return {
            Label: response.Place.Label,
            Coords: response.Place.Geometry.Point,
          };
        };

        const place = await findPlace();

        const updated = locations.map((loc) =>
          loc.id === activeLocationId
            ? {
                ...loc,
                text: place.Label,
                location: {
                  Label: place.Label,
                  Coords: place.Coords,
                },
              }
            : loc
        );

        console.log("Updated locations:", updated);
        setLocations(updated);
        onStopChanges(updated); // Trigger after setLocations

        setSuggestionsToDisplay(new Set()); // Hide suggestions
        setShowSearchResults(false);

        const resultObject = {
          Flag: "Search",
          Results: place,
        };

        onSelectResult(resultObject);
      } catch (e) {
        alert("Search failed.");
        console.error(e);
      }
    } else {
      const place = {
        Label: location.Label,
        Coords: location.Coords,
      };

      const resultObject = {
        Flag: "Fuel",
        Results: place,
      };

      onSelectResult(resultObject);
    }
  };

  const getIcon = (index, totalLength) => {
    if (index === 0) {
      return <MapPin className="start-icon" />;
    } else if (index === totalLength - 1) {
      return <MapPin className="destination-icon" />;
    } else {
      return <div className="waypoint-icon"></div>;
    }
  };

  const getRowClass = (index, totalLength) => {
    if (index === 0) return "start";
    if (index === totalLength - 1) return "destination";
    return "waypoint";
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Swap the positions of the dragged item and the drop target
    const newLocations = [...locations];
    const temp = newLocations[draggedIndex];
    newLocations[draggedIndex] = newLocations[dropIndex];
    newLocations[dropIndex] = temp;

    // Reassign ids to match new order
    newLocations.forEach((loc, idx) => (loc.id = idx + 1));

    // Update the locations state with the new order
    setLocations(newLocations);

    let validChanges = true;
    newLocations.forEach((loc) => {
      if (loc.location.Label === "") {
        validChanges = false;
      }
    });

    if (validChanges) {
      onStopChanges(newLocations); // Notify parent component about the changes
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleAddStop = () => {
    // Copy locations array
    const newLocations = [...locations];

    // Get the current destination (last element)
    const destination = newLocations[newLocations.length - 1];

    // Assign a new id to the destination (highest id + 1)
    const maxId = Math.max(...newLocations.map((loc) => Number(loc.id)));
    const newDestination = { ...destination, id: maxId + 1 };

    // Create the new stop with the previous destination's id
    const newStop = {
      id: destination.id,
      text: "New stop",
      location: {
        Label: "",
        Coords: [],
      },
    };

    // Replace the destination with the new destination (with incremented id)
    newLocations[newLocations.length - 1] = newDestination;

    // Insert the new stop before the new destination
    newLocations.splice(newLocations.length - 1, 0, newStop);

    setActiveLocationId(newStop.id); // so the next handleSelect updates the right stop
    setLocations(newLocations);
  };

  const handleDeleteLocation = (locationId) => {
    // Don't allow deletion if only 2 locations remain (start and destination)
    if (locations.length <= 2) return;

    const updated = locations.filter((loc) => loc.id !== locationId);

    // Reassign ids to keep them sequential (optional but recommended)
    const reindexed = updated.map((loc, idx) => ({
      ...loc,
      id: idx + 1,
    }));

    setLocations(reindexed);
    onStopChanges(reindexed);
  };

  const handleSave = async () => {
    console.log("Saving time:", dateTimeData);
    console.log("Saving route:", locations);

    const session = await fetchAuthSession();
    const accessToken = session.tokens.accessToken.toString();

    const trip_update = {
      start: locations[0].text,
      destination: locations[locations.length - 1].text,
      start_date: dateTimeData.startDate,
      end_date: dateTimeData.endDate,
      time: dateTimeData.startTime,
      start_coordinates: locations[0].location.Coords,
      destination_coordinates: locations[locations.length - 1].location.Coords,
    };

    let stops_of_trip = [];

    for (const loc of locations) {
      console.log("Loc", loc);
      const stop = {
        id: loc.id,
        stop_name: loc.text,
        stop_coordinates: loc.location.Coords,
      };

      stops_of_trip.push(stop);
    }

    console.log("Stops of trips", stops_of_trip);

    console.log("Stops of trips after popped and pushed", stops_of_trip);

    try {
      const response = await axios.patch(
        `${API_URL}/update-trip/${trip_id}`,
        {
          updated_trip: trip_update,
          stops_of_trip: stops_of_trip,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("Response:", response);

      if (response.status === 200) {
        message.success("Trip saved successfully!");
      }
    } catch (e) {
      console.error(e);
      message.error("Failed to save trip.");
    }
  };

  const handleEditDateTime = () => {
    setTempDateTimeData(dateTimeData);
    setIsEditingDateTime(true);
  };

  const handleSaveDateTime = () => {
    setDateTimeData(tempDateTimeData);
    setIsEditingDateTime(false);

    // if (onUpdateDateTime) {
    //   onUpdateDateTime(tempDateTimeData); // Notify parent
    // }
    console.log("Date and time updated:", tempDateTimeData);
    console.log("Date and time saved:", dateTimeData);
  };

  const handleCancelDateTime = () => {
    setTempDateTimeData(dateTimeData);
    setIsEditingDateTime(false);
  };

  const handleDateTimeChange = (field, value) => {
    setTempDateTimeData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getPlaceholderText = (index, totalLength) => {
    if (index === 0) {
      return "Enter starting location...";
    } else if (index === totalLength - 1) {
      return "Enter destination...";
    } else {
      return "Enter stop location...";
    }
  };

  const hashRoute = (points) => {
    return JSON.stringify(points.map((point) => point.join(","))).toString();
  };

  return (
    <>
      <div className="search-container">
        {/*{console.log("gasStations size: ", gasStations.length)}
        {showGasStations && gasStations.length > 0 && (
          <div
            style={{
              display: "block",
              width: "100%",
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              marginTop: 2,
              zIndex: 10,
              position: "absolute",
              maxHeight: 500,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#5f6368",
                letterSpacing: "0.5px",
                margin: "8px 0 4px 12px",
                fontFamily: "Roboto, Arial, sans-serif",
              }}
            >
              GAS STATIONS NEARBY:
            </div>

            {Array.from(gasStations).map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom:
                    idx !== gasStations.length - 1
                      ? "1px solid #f0f0f0"
                      : "none",
                }}
                onClick={() => handleSelect(item)}
                onMouseDown={(e) => e.preventDefault()} // Prevent input blur
              >
                {console.log(item)}
                <div
                  style={{
                    display: "flex",
                    marginRight: "10px",
                    alignItems: "center",
                    fontSize: "20px",
                  }}
                >
                  <EnvironmentOutlined />
                </div>
                <b>{item.Label}</b>
              </div>
            ))}
          </div>
        )} */}
        <div className="travel-container">
          {/* Header row with date/time info and gas station icon */}
          <div className="header-row">
            <div className="time-header">
              {!isEditingDateTime ? (
                <>
                  <div className="date-time-item">
                    <span className="label">Start Date</span>
                    <span className="value">{dateTimeData.startDate}</span>
                  </div>
                  <div className="date-time-item">
                    <span className="label">End Date</span>
                    <span className="value">{dateTimeData.endDate}</span>
                  </div>
                  <div className="date-time-item">
                    <span className="label">Start Time</span>
                    <span className="value">{dateTimeData.startTime}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="date-time-item">
                    <span className="label">Start Date</span>
                    <input
                      type="date"
                      value={tempDateTimeData.startDate}
                      onChange={(e) =>
                        handleDateTimeChange("startDate", e.target.value)
                      }
                      className="date-time-input"
                    />
                  </div>
                  <div className="date-time-item">
                    <span className="label">End Date</span>
                    <input
                      type="date"
                      value={tempDateTimeData.endDate}
                      onChange={(e) =>
                        handleDateTimeChange("endDate", e.target.value)
                      }
                      className="date-time-input"
                    />
                  </div>
                  <div className="date-time-item">
                    <span className="label">Start Time</span>
                    <input
                      type="time"
                      value={tempDateTimeData.startTime}
                      onChange={(e) =>
                        handleDateTimeChange("startTime", e.target.value)
                      }
                      className="date-time-input"
                    />
                  </div>
                </>
              )}
            </div>
            {!isEditingDateTime && (
              <div className="gas-station-toggle" onClick={enableGasStation}>
                <div className="gas-station-icon">
                  <Fuel
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                      color: "#2563eb",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Destinations */}
          <div className="destinations-container">
            {locations.map((location, index) => (
              <div key={`${location.id}-${index}`} className="destination-item">
                {/* Replacement indicator */}

                {dragOverIndex === index &&
                  draggedIndex !== null &&
                  draggedIndex !== index && (
                    <div className="replacement-indicator">
                      <div className="replacement-badge">
                        <ArrowUpDown
                          style={{ width: "0.75rem", height: "0.75rem" }}
                        />
                        <span>Swap positions</span>
                      </div>
                    </div>
                  )}

                <div
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`destination-row ${getRowClass(index, locations.length)} ${
                    dragOverIndex === index && draggedIndex !== index
                      ? "drag-over"
                      : ""
                  } ${draggedIndex === index ? "dragging" : ""}`}
                >
                  <div className="destination-content">
                    {getIcon(index, locations.length)}
                    <div className="input-container">
                      <div
                        className={`input-field ${location.text.trim() === "" ? "empty" : ""}`}
                      >
                        <input
                          type="text"
                          value={location.text}
                          placeholder={getPlaceholderText(
                            index,
                            locations.length
                          )}
                          onFocus={() => setActiveLocationId(location.id)}
                          onChange={async (e) => {
                            const newText = e.target.value;
                            setLocations((prev) =>
                              prev.map((loc) =>
                                loc.id === location.id
                                  ? { ...loc, text: newText }
                                  : loc
                              )
                            );
                            console.log("location:", locations);

                            await handleInputChange(e);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleEnter();
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="controls-container">
                    <div
                      className={`grip-handle ${draggedIndex === index ? "dragging" : ""}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                    >
                      <GripVertical className="grip-icon" />
                    </div>
                    {/* Show delete button for all waypoints (not start or destination) and if more than 2 locations */}
                    {locations.length > 2 &&
                      index !== 0 &&
                      index !== locations.length - 1 && (
                        <div
                          className="delete-button"
                          onClick={() => handleDeleteLocation(location.id)}
                        >
                          <X className="delete-icon" />
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add stop button */}
            <div className="add-stop-button" onClick={handleAddStop}>
              <div className="add-stop-icon">
                <Plus />
              </div>
              <span className="add-stop-text">Add stop</span>
            </div>
          </div>

          {/* Bottom controls */}
          <div className="bottom-controls">
            {!isEditingDateTime ? (
              <>
                <button
                  className="edit-datetime-button-bottom"
                  onClick={handleEditDateTime}
                >
                  <Edit3 className="edit-icon" />
                  <span>Edit Date & Time</span>
                </button>
                <button className="save-button" onClick={handleSave}>
                  Save
                </button>
              </>
            ) : (
              <div className="edit-actions-bottom">
                <button
                  className="cancel-datetime-button-bottom"
                  onClick={handleCancelDateTime}
                >
                  <XIcon className="action-icon" />
                  <span>Cancel</span>
                </button>
                <button
                  className="save-datetime-button-bottom"
                  onClick={handleSaveDateTime}
                >
                  <Check className="action-icon" />
                  <span>Confirm Changes</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/*Displaying search suggestion*/}
        <div>
          {suggestionsToDisplay &&
            suggestionsToDisplay.size > 0 &&
            !showSearchResults && (
              <div
                style={{
                  display: "block",
                  width: "100%",
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 4,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  marginTop: 2,
                  zIndex: 10,
                  position: "absolute",
                  maxHeight: 318,
                  overflowY: "auto",
                }}
              >
                {Array.from(suggestionsToDisplay).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderBottom:
                        idx !== suggestionsToDisplay.length - 1
                          ? "1px solid #f0f0f0"
                          : "none",
                    }}
                    onClick={() => handleSelect(item)}
                    onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                  >
                    <b>{item.Text}</b>
                  </div>
                ))}
              </div>
            )}
        </div>
        {showSearchResults &&
          suggestionsToDisplay &&
          suggestionsToDisplay.size > 0 && (
            <div
              style={{
                display: "block",
                width: "100%",
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 4,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                marginTop: 2,
                zIndex: 10,
                position: "absolute",
                maxHeight: 500,
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#5f6368",
                  letterSpacing: "0.5px",
                  margin: "8px 0 4px 12px",
                  fontFamily: "Roboto, Arial, sans-serif",
                }}
              >
                SEARCH RESULTS:
              </div>
              {Array.from(suggestionsToDisplay).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderBottom:
                      idx !== suggestionsToDisplay.length - 1
                        ? "1px solid #f0f0f0"
                        : "none",
                  }}
                  onClick={() => handleSelect(item)}
                  onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                >
                  <div
                    style={{
                      display: "flex",
                      marginRight: "10px",
                      alignItems: "center",
                      fontSize: "20px",
                    }}
                  >
                    <EnvironmentOutlined />
                  </div>
                  <b>{item.Text}</b>
                </div>
              ))}
            </div>
          )}

        {showGasStations && gasStations.length > 0 && (
          <div
            style={{
              display: "block",
              width: "100%",
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              marginTop: 2,
              zIndex: 10,
              position: "absolute",
              maxHeight: 500,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#5f6368",
                letterSpacing: "0.5px",
                margin: "8px 0 4px 12px",
                fontFamily: "Roboto, Arial, sans-serif",
              }}
            >
              GAS STATIONS NEARBY:
            </div>

            {Array.from(gasStations).map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom:
                    idx !== gasStations.length - 1
                      ? "1px solid #f0f0f0"
                      : "none",
                }}
                onClick={() => handleSelect(item)}
                onMouseDown={(e) => e.preventDefault()} // Prevent input blur
              >
                <div
                  style={{
                    display: "flex",
                    marginRight: "10px",
                    alignItems: "center",
                    fontSize: "20px",
                  }}
                >
                  <EnvironmentOutlined />
                </div>
                <b>{item.Label}</b>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default SearchComponent;
