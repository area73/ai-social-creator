// Fix for missing types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

import { useEffect } from "react";

const ConfiguratorLoader = () => {
  useEffect(() => {
    import("@area73/ai-web-key-configurator");
  }, []);
  return <ai-web-key-configurator />;
};

export default ConfiguratorLoader;
