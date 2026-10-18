import { Title } from "@/components/title/title";
import "./about-window.css";

interface AboutWindowProps {
  applicationName: string;
  applicationVersion: string;
  copyright: string;
  website: string;
}

export function AboutWindow({
  applicationName,
  applicationVersion,
  copyright,
  website,
}: AboutWindowProps) {
  return (
    <main className="about-window">
      <img
        className="about-window__icon"
        src="./app-icon.png"
        alt=""
      />
      <section
        className="about-window__content"
        aria-labelledby="application-name"
      >
        <Title
          className="about-window__name"
          id="application-name"
          level={1}
        >
          {applicationName}
        </Title>
        <p className="about-window__version">Version {applicationVersion}</p>
        <p className="about-window__copyright">{copyright}</p>
        <a className="about-window__button" href={website}>
          GitHub Repository
        </a>
      </section>
    </main>
  );
}
