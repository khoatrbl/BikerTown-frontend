import gasStationPng from "./img/gas-station.png"; // Adjust the path if needed

const GasStationIcon = ({ style }) => (
  <span
    className="gas-station-icon"
    style={{
      marginLeft: 12,
      display: "inline-flex",
      alignItems: "center",
      cursor: "pointer",
      transition: "filter 0.2s",
    }}
    tabIndex={0}
    title="Show gas stations"
    onClick={enableGasStation}
  >
    <img
      src={gasStationPng}
      alt="Gas Station"
      style={{ width: 24, height: 24, objectFit: "contain" }}
    />
  </span>
);

export default GasStationIcon;
