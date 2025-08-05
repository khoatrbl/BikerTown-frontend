import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import LoadingSpinner from "../../components/Loading/HamsterLoading";
import Map from "../../components/Map/Map";
import axios from "axios";
import BikerMap from "../../components/Map/Map";

const TripDetail = () => {
  const { trip_id } = useParams();
  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);

  useEffect(() => {
    // Fetch trip details from your API
    const fetchTripDetails = async () => {
      try {
        const session = await fetchAuthSession();
        const accessToken = session.tokens.accessToken.toString();

        const response = await axios.get(
          `http://localhost:8000/trips/${trip_id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setTrip(response.data.trip);
        setStops(response.data.stops);
      } catch (error) {
        console.error("Error fetching trip details:", error);
      }
    };

    fetchTripDetails();
  }, [trip_id]);

  if (!trip) return <LoadingSpinner />;

  return (
    <div>
      <BikerMap
        trip_id={trip_id}
        start={trip.start_coordinates}
        destination={trip.destination_coordinates}
        startDate={trip.start_date}
        startTime={trip.time}
        endDate={trip.end_date}
        stops={stops}
      />
    </div>
  );
};

export default TripDetail;
