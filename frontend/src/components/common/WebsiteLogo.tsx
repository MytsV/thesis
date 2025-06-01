import { Table2 } from "lucide-react";
import React from "react";

export interface WebsiteLogoProps {
  onLogoClick: () => void;
}

export default function WebsiteLogo(props: WebsiteLogoProps) {
  return (
    <Table2
      className="h-7 w-7 text-primary cursor-pointer"
      onClick={props.onLogoClick}
    />
  );
}
