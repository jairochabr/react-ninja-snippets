# 🥷 React Ninja Snippets

Extension to increase productivity with fast and efficient snippets, helping you write code faster and more accurately.

![react-ninja](https://github.com/user-attachments/assets/9aabd0f7-e5a8-42fc-9f47-622ae95ea562)

## ✨ Features

### 🚀 React Component Snippets

Generate React components automatically using the file name, with support for multiple component styles:

| Trigger | Description |
|---------|-------------|
| `rfca` | Creates a component with arrow function and separate export default |
| `rfc`  | Creates a component with export function declaration |
| `rfcd` | Creates a component with export default function declaration |
| `rfce` | Creates a component with export const arrow function |


### ⚡ React Hooks Snippets
Quick access to all essential React Hooks with automatic imports:

| Prefix | Hook | Import Handling |
|--------|------|----------------|
| `ust` | useState | Auto-imports |
| `uef` | useEffect | Auto-imports |
| `ucb` | useCallback | Auto-imports |
| `urf` | useRef | Auto-imports |
| `urd` | useReducer | Auto-imports |
| `uct` | useContext | Auto-imports |
| `umo` | useMemo | Auto-imports |
| `uid` | useId | Auto-imports |
| `uts` | useTransition | Auto-imports |


## Example Usage

### Component Generation
Simply type the trigger and press `Tab` or `Enter`:

1. Create a new file: `MyComponent.tsx`
2. Type `rfca` and press `Tab`
3. Result:
```tsx
const MyComponent = () => {
  return (
    
  )
}

export default MyComponent
```

### Hook Usage
The extension automatically adds the required import statement:

1. Type `ust` and press `Tab`
2. Result:
```tsx
import { useState } from 'react';

const [state, setState] = useState()
```

## Features

- 🎯 Smart Component Creation: Uses file name for component naming
- 📦 Automatic Imports: Manages React imports automatically
- 🎨 Multiple Styles: Support for various component patterns
- ⚡ Quick Access: Short, memorable triggers
- 🔄 Modern Hooks: Support for all modern React hooks
- 💡 IntelliSense: Full IntelliSense support with preview


## Component Snippets in Detail

### Arrow Function Component (rfca)
```tsx
const ComponentName = () => {
  return (
    
  )
}

export default ComponentName
```

### Export Function (rfc)
```tsx
export function ComponentName() {
  return (
    
  )
}
```

### Export Default Function (rfcd)
```tsx
export default function ComponentName() {
  return (
    
  )
}
```

### Export Arrow Component (rfce)
```tsx
export const ComponentName = () => {
  return (
    
  )
}
```

Developed with ❤️ and lots of ☕ by [@jairochabr](https://github.com/jairochabr)

[⭐ Rate this extension](https://marketplace.visualstudio.com/items?itemName=jairochabr.react-ninja-snippets&ssr=false#review-details)

[🐛 Report a bug](https://github.com/jairochabr/react-ninja-snippets/issues)

[💡 Suggest Improvements](https://github.com/jairochabr/react-ninja-snippets/issues)

