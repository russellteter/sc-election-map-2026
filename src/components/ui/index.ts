/**
 * UI Primitives Index
 *
 * This module exports all UI primitive components for consistent styling
 * across the SC Election Map 2026 dashboard.
 *
 * Usage:
 * import { Button, Badge, Card } from '@/components/ui';
 */

// Button primitive with variants and sizes
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button';

// Badge primitive with status variants and pulse animation
export { Badge, type BadgeProps, type BadgeVariant, type BadgeSize } from './Badge';

// Card primitive with glassmorphic styling
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  type CardProps,
  type CardVariant,
} from './Card';

// Demo Data badge for indicating demo/placeholder data
export { default as DemoBadge, type DemoBadgeProps } from './DemoBadge';
