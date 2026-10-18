import type { LucideIcon } from "lucide-react";
import "./marker-graphic.css";

interface MarkerGraphicProps {
  style: "pin" | "circle" | "square" | "star" | "triangle";
  color: string;
  Icon: LucideIcon;
}

export function MarkerGraphic({ style, color, Icon }: MarkerGraphicProps) {
  const centeredIcon = (
    <Icon
      className="map-marker-symbol"
      x={-10}
      y={-10}
      width={20}
      height={20}
      strokeWidth={2.25}
    />
  );
  if (style === "pin") {
    return (
      <>
        <path
          className="map-marker-body"
          d="M-16 -44 H16 V-12 H8 L0 4 L-8 -12 H-16 Z"
          fill={color}
        />
        <rect className="map-marker-center" x="-14" y="-42" width="28" height="28" />
        <Icon
          className="map-marker-symbol"
          x={-10}
          y={-38}
          width={20}
          height={20}
          strokeWidth={2.25}
        />
      </>
    );
  }
  if (style === "circle") {
    return (
      <>
        <circle className="map-marker-body" r="17" fill={color} />
        <circle r="15" />
        {centeredIcon}
      </>
    );
  }
  if (style === "square") {
    return (
      <>
        <rect className="map-marker-body" x="-18" y="-18" width="36" height="36" fill={color} />
        <rect className="map-marker-center" x="-16" y="-16" width="32" height="32" />
        {centeredIcon}
      </>
    );
  }
  if (style === "star") {
    return (
      <>
        <path
          className="map-marker-body"
          d="M0 -21 L6 -7 L21 -6 L10 4 L13 19 L0 11 L-13 19 L-10 4 L-21 -6 L-6 -7 Z"
          fill={color}
        />
        <path
          className="map-marker-center"
          d="M0 -17 L5 -6 L17 -5 L8 3 L10 15 L0 9 L-10 15 L-8 3 L-17 -5 L-5 -6 Z"
        />
        {centeredIcon}
      </>
    );
  }
  return (
    <>
      <path className="map-marker-body" d="M0 -21 L20 18 L-20 18 Z" fill={color} />
      <path className="map-marker-center" d="M0 -16 L15 14 L-15 14 Z" />
      <Icon
        className="map-marker-symbol"
        x={-8}
        y={-6}
        width={16}
        height={16}
        strokeWidth={2.25}
      />
    </>
  );
}
