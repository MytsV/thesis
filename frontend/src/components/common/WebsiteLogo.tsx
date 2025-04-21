import { Cat } from "lucide-react";
import React from "react";

export interface WebsiteLogoProps {
  onLogoClick: () => void;
}

export default function WebsiteLogo(props: WebsiteLogoProps) {
  return (
    <Cat
      className="h-7 w-7 text-primary cursor-pointer"
      onClick={props.onLogoClick}
    />
  );
}
