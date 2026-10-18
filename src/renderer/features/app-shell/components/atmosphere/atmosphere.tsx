import "./atmosphere.css";

export function Atmosphere() {
  return (
    <div className="web-atmosphere">
      <svg viewBox="0 0 1200 800" preserveAspectRatio="none">
        <path
          className="web-line"
          d="M0 720 C180 520 240 700 405 412 S760 280 1200 80"
        />
        <path
          className="web-line"
          d="M80 0 C220 260 395 190 405 412 S780 670 1200 720"
        />
        <path
          className="web-line"
          d="M600 0 C540 180 480 290 405 412 S250 650 170 800"
        />
      </svg>
    </div>
  );
}
