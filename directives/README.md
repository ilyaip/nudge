# Ripple Directive

Material Design-like ripple effect for buttons and interactive elements.

## Usage

The `v-ripple` directive is automatically registered globally and can be used on any element.

### Basic Usage

```vue
<button v-ripple>Click me</button>
```

### With Custom Options

```vue
<button v-ripple="{ color: 'rgba(107, 60, 233, 0.3)', duration: 800 }">
  Click me
</button>
```

## Options

- `color` (string): Color of the ripple effect. Default: `'rgba(255, 255, 255, 0.5)'`
- `duration` (number): Duration of the ripple animation in milliseconds. Default: `600`
- `opacity` (number): Initial opacity of the ripple. Default: `0.5`

## Examples

### Purple Ripple (for primary buttons)
```vue
<button 
  v-ripple="{ color: 'rgba(107, 60, 233, 0.3)' }"
  class="bg-primary text-white"
>
  Save
</button>
```

### Blue Ripple (for secondary buttons)
```vue
<button 
  v-ripple="{ color: 'rgba(37, 99, 235, 0.3)' }"
  class="bg-blue-600 text-white"
>
  Add
</button>
```

### Slower Animation
```vue
<button 
  v-ripple="{ duration: 1000 }"
  class="bg-green-600 text-white"
>
  Complete
</button>
```

## Implementation Details

- The directive automatically adds `position: relative` to the element if needed
- The directive sets `overflow: hidden` to contain the ripple effect
- Ripples are created as absolutely positioned span elements
- Each ripple is automatically removed after the animation completes
- The directive properly cleans up event listeners when the element is unmounted

## Browser Compatibility

Works in all modern browsers that support:
- CSS transforms
- CSS transitions
- requestAnimationFrame

## Applied To

The ripple effect has been applied to the following buttons:
- ✓ "Готово" button (Dashboard - complete reminder)
- ✓ "Добавить" button (Contacts page - add contact)
- ✓ "Добавить контакт" button (Contacts empty state)
- ✓ "Сохранить изменения" button (Contact detail page)
- ✓ "Добавить" button (Add Contact Modal)
