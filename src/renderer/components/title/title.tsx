import { cn } from "@/lib/class-names";
import "./title.css";
import type { TitleLevel, TitleProps } from "./title.types";

const headingTags: Record<TitleLevel, `h${TitleLevel}`> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
};

export function Title({
  level = 2,
  className,
  ...props
}: TitleProps) {
  const Heading = headingTags[level];

  return (
    <Heading
      {...props}
      className={cn("ui-title", className)}
    />
  );
}
