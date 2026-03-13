# UI Components Documentation

## Available Components

### Form Components
- `Input` - Text input field
- `Textarea` - Multi-line text input
- `Select` - Dropdown selection
- `Checkbox` - Checkbox input
- `RadioGroup` - Radio button group
- `Switch` - Toggle switch
- `Slider` - Range slider
- `Form` - Form wrapper with validation

### Layout Components
- `Card` - Card container
- `Dialog` - Modal dialog
- `Sheet` - Slide-out panel
- `Tabs` - Tabbed interface
- `Accordion` - Collapsible sections
- `Collapsible` - Expandable content
- `Separator` - Visual divider
- `AspectRatio` - Maintain aspect ratio

### Navigation Components
- `Button` - Action button
- `DropdownMenu` - Dropdown menu
- `NavigationMenu` - Navigation menu
- `Breadcrumb` - Breadcrumb navigation
- `Pagination` - Page navigation
- `Tabs` - Tab navigation

### Data Display
- `Table` - Data table
- `Avatar` - User avatar
- `Badge` - Status badge
- `Calendar` - Date picker
- `Chart` - Data visualization
- `Progress` - Progress indicator
- `Skeleton` - Loading placeholder

### Feedback Components
- `Alert` - Alert message
- `AlertDialog` - Confirmation dialog
- `Toast` - Notification toast
- `Tooltip` - Hover tooltip
- `HoverCard` - Hover information card

### Utility Components
- `ScrollArea` - Scrollable container
- `Resizable` - Resizable panels
- `Command` - Command palette
- `ContextMenu` - Right-click menu
- `Popover` - Popup content
- `Drawer` - Slide-out drawer

## Usage Guidelines

1. Import components directly from the ui directory:
```typescript
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
```

2. Use form components with the Form component for validation:
```typescript
import { Form } from "@/components/ui/form"
import { useForm } from "react-hook-form"
```

3. Use layout components for structure:
```typescript
import { Card } from "@/components/ui/card"
import { Tabs } from "@/components/ui/tabs"
```

4. Use feedback components for user interaction:
```typescript
import { Toast } from "@/components/ui/toast"
import { Alert } from "@/components/ui/alert"
```

## Component Dependencies

Most components are built on top of:
- Radix UI primitives
- Tailwind CSS for styling
- React Hook Form for form handling
- Zod for validation

## Best Practices

1. Use semantic HTML elements
2. Maintain consistent spacing using Tailwind classes
3. Implement proper form validation
4. Handle loading and error states
5. Ensure accessibility
6. Use TypeScript for type safety 