import React from "react";
import { render } from "@testing-library/react";
import ConfiguratorLoader from "../ConfiguratorLoader";

describe("ConfiguratorLoader", () => {
  it("renders the configurator div", () => {
    render(<ConfiguratorLoader />);
    expect(
      document.getElementById("ai-web-key-configurator")
    ).toBeInTheDocument();
  });
});
