# AI Social Creator

[![Build Status](https://img.shields.io/github/actions/workflow/status/area73/ai-social-creator/ci.yml?branch=master)](https://github.com/area73/ai-social-creator/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.0.1-blue)](package.json)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [AI Chat](#ai-chat)
- [LinkedIn Integration](#linkedin-integration)
- [Contributing](#contributing)
- [Code of Conduct](#code-of-conduct)
- [License](#license)
- [Contact](#contact)
- [Changelog](#changelog)
- [Related Projects](#related-projects)
- [FAQ](#faq)

---

## Project Overview

**AI Social Creator** is a modern web application for managing and publishing social media posts with the help of AI. It features a modular configuration system, an interactive AI chat for content generation, and seamless LinkedIn integration for direct publishing. Built with Astro, React, and TypeScript, it prioritizes performance, usability, and extensibility.

---

## Features

- **Configuration Section**: Securely manage API keys and environment variables using a custom web component ([@area73/ai-web-key-configurator](https://github.com/area73/ai-web-key-configurator)).
- **AI Chat**: Interact with multiple AI models (OpenAI GPT-3.5, GPT-4, etc.) to generate and refine post content.
- **LinkedIn Integration**: Connect your LinkedIn account and publish posts directly from the app.
- **Local Storage**: All sensitive configuration is stored locally in your browser for privacy.
- **Responsive UI**: Clean, accessible, and mobile-friendly interface.
- **Test Coverage**: Includes unit and integration tests for reliability.

---

## Screenshots

<!-- Add screenshots or GIFs here -->

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/) (or npm/yarn)

### Steps

```bash
# Clone the repository
git clone https://github.com/area73/ai-social-creator.git
cd ai-social-creator

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

---

## Usage

1. **Configure API Keys**: Go to the Configuration section and enter your OpenAI and LinkedIn credentials. These are stored in your browser's localStorage.
2. **Chat with AI**: Use the AI Chat section to generate or refine post content using different AI models.
3. **Connect LinkedIn**: In the LinkedIn section, connect your account and publish posts directly.

---

## Configuration

This project uses the [@area73/ai-web-key-configurator](https://github.com/area73/ai-web-key-configurator) web component for managing environment variables and API keys.

### About the Web Component

- **Purpose**: Provides a simple, reusable interface for configuring environment variables in the browser.
- **How it works**: Renders a `<key-configurator>` element with multiple `<key-pair>` children, each containing a `<key-name>` and an editable `<key-value>`. The `id` attribute is used as the localStorage namespace.
- **Example Usage:**
  ```html
  <key-configurator id="ai-social-creator-config">
    <key-pair>
      <key-name>OPENAI_API_KEY</key-name>
      <key-value></key-value>
    </key-pair>
    <key-pair>
      <key-name>LINKEDIN_TOKEN</key-name>
      <key-value></key-value>
    </key-pair>
    <key-pair>
      <key-name>LINKEDIN_CLIENT_ID</key-name>
      <key-value></key-value>
    </key-pair>
    <key-pair>
      <key-name>LINKEDIN_CLIENT_SECRET</key-name>
      <key-value></key-value>
    </key-pair>
  </key-configurator>
  ```
- **Local Storage**: All values are saved in the browser's localStorage under the given `id`.
- **Documentation**: See [@area73/ai-web-key-configurator](https://github.com/area73/ai-web-key-configurator)

---

## AI Chat

- **Multiple Models**: Select from available OpenAI models (e.g., GPT-3.5, GPT-4).
- **Conversation UI**: Chat with the AI to generate, edit, or brainstorm post content.
- **API Key Required**: You must configure your OpenAI API key in the Configuration section.

---

## LinkedIn Integration

- **OAuth Connection**: Securely connect your LinkedIn account using OAuth.
- **Post Publishing**: Write and publish posts directly to your LinkedIn feed.
- **Scopes Required**: Your LinkedIn app must have the following scopes enabled:
  - `w_member_social` (for posting)
  - `openid` (for authentication)
  - `email` (for profile access)
- **Local Storage**: LinkedIn tokens and credentials are stored locally in your browser.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please ensure your code follows the project's style and includes appropriate tests.

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Please be respectful and inclusive in all interactions.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contact

For support, questions, or feedback, please open an issue on [GitHub Issues](https://github.com/area73/ai-social-creator/issues) or contact the maintainer at [area73](https://github.com/area73).

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes and updates.

---

## Related Projects

- [@area73/ai-web-key-configurator](https://github.com/area73/ai-web-key-configurator) – Web component for environment variable configuration

---

## FAQ

**Q: Where are my API keys and tokens stored?**
A: All sensitive data is stored locally in your browser's localStorage and never sent to any server.

**Q: What AI models are supported?**
A: The app supports OpenAI models such as GPT-3.5, GPT-4, and others as configured in the code.

**Q: How do I connect my LinkedIn account?**
A: Go to the LinkedIn section, enter your credentials in Configuration, and follow the OAuth flow to connect.

**Q: Can I contribute my own integrations?**
A: Yes! Please see the Contributing section above.

---

## Acknowledgements

- [Astro](https://astro.build/)
- [React](https://react.dev/)
- [OpenAI](https://openai.com/)
- [LinkedIn API](https://docs.microsoft.com/en-us/linkedin/)
