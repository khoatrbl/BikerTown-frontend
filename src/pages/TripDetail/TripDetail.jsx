import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import RadarMap from "../../components/RadarMap/RadarMap";
import axios from "axios";

const TripDetail = () => {
  const { trip_id } = useParams();
  const [trip, setTrip] = useState(null);

  useEffect(() => {
    // Fetch trip details from your API
    const fetchTripDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/trips/${trip_id}`
        );
        console.log("Trip details:", response.data);
        setTrip(response.data);
      } catch (error) {
        console.error("Error fetching trip details:", error);
      }
    };

    fetchTripDetails();
  }, [trip_id]);

  if (!trip) return <div>Loading...</div>;

  return (
    <div>
      <h2>Trip Details</h2>

      {/* Add more details as needed */}

      <RadarMap></RadarMap>
    </div>
  );
};

export default TripDetail;
