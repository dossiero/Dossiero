import { Link2 } from "lucide-react";
import "./website-icon.css";

interface WebsiteIconProps {
  src: string;
  href: string;
  label: string;
}

export function WebsiteIcon({ src, href, label }: WebsiteIconProps) {
  return (
    <a
      className="link-icon"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${label}`}
    >
      <Link2 className="link-icon-fallback" size={18} />
      {src && (
        <img
          src={src}
          alt=""
          loading="lazy"
          onLoad={(event) => {
            event.currentTarget.hidden = false;
          }}
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      )}
    </a>
  );
}
