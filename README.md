# 🚀 Yureka UI

Supercharge your Next.js projects with beautiful, production-ready UI components that work seamlessly with or without Tailwind CSS.

## ✨ Features

- **Framework Agnostic** - Works with both Tailwind CSS and CSS Modules
- **TypeScript Ready** - TypeScript support with intelligent types
- **Modular Architecture** - Import only what you need, keep your bundle size small
- **Customizable** - Fully Customizable styling at your hand, feel free to extend components to match your brand
- **easyCLI** - Simple CLI commands to add, update (// TODO), and remove components

## 🔧 Installation

Add Yureka UI to your Next.js project in seconds:

```bash
npx yureka-ui init
```

This will set up the Yureka UI directory structure in your project and detect your existing configuration.

## 📦 Adding Components

Add components as you need them:

```bash
npx yureka-ui add button
```

Or interactively choose from available components:

```bash
npx yureka-ui add
```

## 🗑️ Removing Components

No longer need a component? Easy removal:

```bash
npx yureka-ui remove button
```

## 🧩 Available Components

Yureka UI currently includes these production-ready components:

- **Button** - Flexible button component with multiple variants and states // INITIAL
- **Card** - Versatile container for related content // TODO
- **Input** - Text input field with validation support // TODO
- **Select** - Dropdown select component // TODO
- **Checkbox** - Customizable checkbox input // TODO
- **Toggle** - Switch component for boolean settings // TODO
- **Modal** - Accessible dialog windows // TODO
- **Toast** - Notification system for alerts and messages // TODO

## 📚 Usage Example

```jsx
import { Button, Card } from "@/components/yureka-ui";

export default function MyPage() {
  return (
    <Card>
      <h2>Welcome to Yureka UI</h2>
      <p>Start building beautiful interfaces in minutes.</p>
      <Button variant="primary">Get Started</Button>
    </Card>
  );
}
```

## 🖌️ Styling

Yureka UI automatically detects whether you're using Tailwind CSS and adapts accordingly:

- **With Tailwind**: Components use Tailwind's utility classes
- **Without Tailwind**: Components use CSS Modules with equivalent styling

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
