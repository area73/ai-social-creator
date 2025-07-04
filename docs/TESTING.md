# Testing Guide

## Stack de Testing

La aplicación utiliza un stack moderno de testing optimizado para aplicaciones Astro con React:

### Herramientas Principales

- **[Vitest](https://vitest.dev/)** - Test runner rápido con soporte nativo para TypeScript y ESM
- **[@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/)** - Utilities para testing de componentes React
- **[@testing-library/jest-dom](https://github.com/testing-library/jest-dom)** - Matchers adicionales para DOM testing
- **[@testing-library/user-event](https://testing-library.com/docs/user-event/intro/)** - Simulación realista de interacciones de usuario
- **[Happy DOM](https://github.com/capricorn86/happy-dom)** - Entorno DOM ligero y rápido

## Configuración

### Archivos de Configuración

- `vitest.config.ts` - Configuración principal de Vitest
- `src/test/setup.ts` - Setup global para tests
- `tsconfig.json` - Incluye tipos de Vitest y testing-library

### Scripts Disponibles

```bash
# Ejecutar tests en modo watch
pnpm test

# Ejecutar tests una vez
pnpm test:run

# Abrir interfaz visual de tests
pnpm test:ui

# Ejecutar tests con coverage
pnpm test:coverage
```

## Estructura de Tests

```
src/
├── components/
│   ├── __tests__/
│   │   ├── LinkedInConnect.test.tsx
│   │   └── LinkedInPublisher.test.tsx
│   └── ...
├── utils/
│   ├── __tests__/
│   │   └── linkedinClient.test.ts
│   └── ...
└── test/
    ├── setup.ts
    └── vitest-globals.d.ts
```

## Tipos de Tests

### 1. Tests de Componentes React

**Ejemplo: LinkedInConnect.test.tsx**

```typescript
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LinkedInConnect from "../LinkedInConnect";

describe("LinkedInConnect", () => {
  it("renders connect button when no token is present", () => {
    // Mock localStorage
    const mockGetItem = vi.fn().mockReturnValue(null);
    Object.defineProperty(window, "localStorage", {
      value: { getItem: mockGetItem, setItem: vi.fn() },
      writable: true,
    });

    render(<LinkedInConnect />);

    expect(screen.getByText("Conectar con LinkedIn")).toBeInTheDocument();
  });
});
```

### 2. Tests de Utilidades

**Ejemplo: linkedinClient.test.ts**

```typescript
import { describe, it, expect, vi } from "vitest";
import { getLinkedInAuthUrl } from "../linkedinClient";

describe("linkedinClient", () => {
  it("generates correct auth URL", () => {
    const authUrl = getLinkedInAuthUrl({
      clientId: "test-id",
      redirectUri: "http://localhost:3000",
      state: "test-state",
    });

    expect(authUrl).toContain("client_id=test-id");
  });
});
```

## Mocking Strategies

### 1. localStorage Mock

```typescript
const mockGetItem = vi.fn().mockReturnValue(JSON.stringify({ token: "test" }));
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: mockGetItem,
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});
```

### 2. fetch Mock

```typescript
const mockFetch = vi.fn();
global.fetch = mockFetch;

mockFetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({ success: true }),
});
```

### 3. Module Mock

```typescript
vi.mock("../../utils/linkedinClient", () => ({
  getLinkedInAuthUrl: vi.fn().mockReturnValue("https://linkedin.com/oauth"),
  exchangeCodeForToken: vi.fn(),
}));
```

## Mejores Prácticas

### 1. Selectores Semánticos

```typescript
// ✅ Bueno - usa roles y nombres accesibles
screen.getByRole("button", { name: "Publicar en LinkedIn" });
screen.getByRole("heading", { name: "Configuración" });

// ❌ Evitar - selectores frágiles
screen.getByText("Publicar en LinkedIn"); // Puede haber múltiples elementos
```

### 2. Async Testing

```typescript
// ✅ Bueno - espera cambios asincrónicos
await waitFor(() => {
  expect(screen.getByText("Conectado")).toBeInTheDocument();
});

// ✅ Bueno - para elementos que aparecen
await screen.findByText("Mensaje de éxito");
```

### 3. User Interactions

```typescript
import { fireEvent } from "@testing-library/react";

// Simulación de eventos
fireEvent.change(textarea, { target: { value: "Nuevo texto" } });
fireEvent.click(button);
```

### 4. Cleanup

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  // Reset mocks before each test
});
```

## Coverage

Para ver el coverage de tests:

```bash
pnpm test:coverage
```

Esto generará un reporte mostrando:

- Líneas cubiertas
- Funciones cubiertas
- Branches cubiertas
- Statements cubiertas

## Tests Existentes

### Componentes Testeados

1. **LinkedInConnect** (4 tests)

   - Renderizado del botón de conexión
   - Estado conectado
   - Manejo de errores
   - Flujo OAuth

2. **LinkedInPublisher** (6 tests)
   - Mensaje sin token
   - Formulario con token
   - Validación de texto vacío
   - Publicación exitosa
   - Manejo de errores API
   - Contador de caracteres

### Utilidades Testeadas

1. **linkedinClient** (9 tests)
   - Generación de URL de autorización
   - Intercambio de código por token
   - Obtención de perfil
   - Publicación de posts

## Debugging Tests

### Modo Debug

```typescript
// Mostrar el DOM actual
screen.debug();

// Mostrar elemento específico
screen.debug(screen.getByRole("button"));
```

### Logs Útiles

```typescript
// Ver queries disponibles
screen.logTestingPlaygroundURL();

// Console log en tests
console.log("Estado actual:", component.state);
```

## Integración Continua

Los tests se ejecutan automáticamente en:

- Pre-commit hooks (si están configurados)
- Pull requests
- Builds de producción

### Configuración Recomendada

```json
// package.json
{
  "scripts": {
    "test:ci": "vitest run --coverage --reporter=junit",
    "test:watch": "vitest",
    "test:debug": "vitest --inspect-brk"
  }
}
```

### Comandos con pnpm

```bash
# Instalar dependencias
pnpm install

# Ejecutar tests
pnpm test:ci

# Tests en modo watch
pnpm test:watch

# Debug de tests
pnpm test:debug
```

## Troubleshooting

### Errores Comunes

1. **"React is not defined"**

   ```typescript
   // Solución: Importar React en tests
   import React from "react";
   ```

2. **"Multiple elements found"**

   ```typescript
   // Solución: Usar selectores más específicos
   screen.getByRole("button", { name: "Texto exacto" });
   ```

3. **"Element not found"**
   ```typescript
   // Solución: Esperar elementos asincrónicos
   await screen.findByText("Texto");
   ```

## Recursos Adicionales

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Playground](https://testing-playground.com/)
- [Which query should I use?](https://testing-library.com/docs/queries/about/#priority)
