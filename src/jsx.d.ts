import React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ai-web-key-configurator": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}
