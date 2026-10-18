import type { HTMLAttributes } from "react";

export type TitleLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface TitleProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: TitleLevel;
}
