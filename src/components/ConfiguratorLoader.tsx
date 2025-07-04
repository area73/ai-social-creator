import React from "react";
import { useEffect } from "react";

const ConfiguratorLoader = () => {
  useEffect(() => {
    import("@area73/ai-web-key-configurator");
  }, []);
  return <div id="ai-web-key-configurator" />;
};

export default ConfiguratorLoader;
