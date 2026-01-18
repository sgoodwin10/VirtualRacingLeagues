/**
 * Skeleton component types
 */
export type SkeletonType = 'text' | 'title' | 'avatar' | 'card' | 'custom';

export type SkeletonSize = 'sm' | 'md' | 'lg' | 'xl';

export type SkeletonShape = 'circle' | 'square';

/**
 * Spinner component types
 */
export type SpinnerSize = 'sm' | 'default' | 'lg';

/**
 * Loading overlay types
 */
export interface LoadingState {
  visible: boolean;
  message?: string;
}

/**
 * Skeleton card layout types
 */
export type SkeletonCardLayout = 'horizontal' | 'vertical';
