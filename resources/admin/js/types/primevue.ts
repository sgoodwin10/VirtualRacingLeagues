/**
 * PrimeVue Event Type Definitions
 *
 * This file contains TypeScript interfaces for PrimeVue component events,
 * providing type safety and better developer experience when working with
 * PrimeVue components.
 *
 * @see https://primevue.org/
 */

/**
 * DataTable pagination event
 *
 * Emitted when the user changes pages in a DataTable component
 *
 * @example
 * ```typescript
 * const onPage = (event: DataTablePageEvent): void => {
 *   currentPage.value = event.page + 1; // PrimeVue uses 0-based index
 *   rowsPerPage.value = event.rows;
 *   loadData();
 * };
 * ```
 */
export interface DataTablePageEvent {
  /**
   * Index of the new page (0-based)
   */
  page: number;

  /**
   * Index of the first row on the page
   */
  first: number;

  /**
   * Number of rows per page
   */
  rows: number;

  /**
   * Total number of pages
   */
  pageCount: number;
}

/**
 * DataTable sort event
 *
 * Emitted when the user sorts a column in a DataTable
 *
 * @example
 * ```typescript
 * const onSort = (event: DataTableSortEvent): void => {
 *   sortField.value = event.sortField;
 *   sortOrder.value = event.sortOrder;
 *   loadData();
 * };
 * ```
 */
export interface DataTableSortEvent {
  /**
   * Field name to sort by
   */
  sortField: string;

  /**
   * Sort order: 1 for ascending, -1 for descending, 0 for no sort
   */
  sortOrder: 1 | -1 | 0;

  /**
   * Multi-sort metadata (when multiple columns are sorted)
   */
  multiSortMeta?: Array<{
    field: string;
    order: 1 | -1;
  }>;
}

/**
 * DataTable filter event
 *
 * Emitted when filters are applied in a DataTable
 *
 * @example
 * ```typescript
 * const onFilter = (event: DataTableFilterEvent): void => {
 *   filters.value = event.filters;
 *   loadData();
 * };
 * ```
 */
export interface DataTableFilterEvent<T = unknown> {
  /**
   * Object containing filter configurations for each field
   */
  filters: Record<string, DataTableFilterMeta>;

  /**
   * Array of filtered data
   */
  filteredValue: T[];
}

/**
 * Filter metadata for a single field
 */
export interface DataTableFilterMeta {
  /**
   * Filter value
   */
  value: unknown;

  /**
   * Match mode (e.g., 'contains', 'equals', 'startsWith')
   */
  matchMode: string;
}

/**
 * DataTable row click event
 *
 * Emitted when a row is clicked in a DataTable
 *
 * @example
 * ```typescript
 * const onRowClick = (event: DataTableRowClickEvent<User>): void => {
 *   console.log('Clicked user:', event.data);
 * };
 * ```
 */
export interface DataTableRowClickEvent<T = unknown> {
  /**
   * Original browser event
   */
  originalEvent: MouseEvent;

  /**
   * Row data
   */
  data: T;

  /**
   * Row index
   */
  index: number;
}

/**
 * DataTable row select event
 *
 * Emitted when one or more rows are selected
 *
 * @example
 * ```typescript
 * const onRowSelect = (event: DataTableRowSelectEvent<User>): void => {
 *   console.log('Selected user:', event.data);
 * };
 * ```
 */
export interface DataTableRowSelectEvent<T = unknown> {
  /**
   * Original browser event
   */
  originalEvent: Event;

  /**
   * Selected row data
   */
  data: T;

  /**
   * Row index
   */
  index: number;

  /**
   * Type of selection
   */
  type: 'row' | 'checkbox' | 'radiobutton';
}

/**
 * DataTable row unselect event
 *
 * Emitted when one or more rows are unselected
 */
export interface DataTableRowUnselectEvent<T = unknown> {
  /**
   * Original browser event
   */
  originalEvent: Event;

  /**
   * Unselected row data
   */
  data: T;

  /**
   * Row index
   */
  index: number;

  /**
   * Type of selection
   */
  type: 'row' | 'checkbox' | 'radiobutton';
}

/**
 * Dropdown change event
 *
 * Emitted when the value of a Dropdown/Select component changes
 *
 * @example
 * ```typescript
 * const onChange = (event: DropdownChangeEvent<string>): void => {
 *   console.log('New value:', event.value);
 * };
 * ```
 */
export interface DropdownChangeEvent<T = unknown> {
  /**
   * Original browser event
   */
  originalEvent: Event;

  /**
   * Selected value
   */
  value: T;
}

/**
 * Calendar change event
 *
 * Emitted when a date is selected in a Calendar component
 *
 * @example
 * ```typescript
 * const onChange = (event: CalendarChangeEvent): void => {
 *   console.log('Selected date:', event.value);
 * };
 * ```
 */
export interface CalendarChangeEvent {
  /**
   * Original browser event
   */
  originalEvent: Event;

  /**
   * Selected date(s) - can be single date, array of dates, or date range
   */
  value: Date | Date[] | null;
}

/**
 * InputText input event
 *
 * Emitted when the value of an InputText component changes
 *
 * @example
 * ```typescript
 * const onInput = (event: InputTextInputEvent): void => {
 *   console.log('Current value:', event.target.value);
 * };
 * ```
 */
export interface InputTextInputEvent extends Event {
  /**
   * Input element that triggered the event
   */
  target: HTMLInputElement;
}

/**
 * FileUpload select event
 *
 * Emitted when files are selected in a FileUpload component
 *
 * @example
 * ```typescript
 * const onSelect = (event: FileUploadSelectEvent): void => {
 *   console.log('Selected files:', event.files);
 * };
 * ```
 */
export interface FileUploadSelectEvent {
  /**
   * Original browser event
   */
  originalEvent: Event;

  /**
   * Selected files
   */
  files: File[];
}

/**
 * FileUpload upload event
 *
 * Emitted when files are uploaded successfully
 */
export interface FileUploadUploadEvent {
  /**
   * XMLHttpRequest instance
   */
  xhr: XMLHttpRequest;

  /**
   * Uploaded files
   */
  files: File[];
}

/**
 * FileUpload error event
 *
 * Emitted when file upload fails
 */
export interface FileUploadErrorEvent {
  /**
   * XMLHttpRequest instance
   */
  xhr: XMLHttpRequest;

  /**
   * Files that failed to upload
   */
  files: File[];
}

/**
 * FileUpload before upload event
 *
 * Emitted before files are uploaded
 */
export interface FileUploadBeforeUploadEvent {
  /**
   * XMLHttpRequest instance
   */
  xhr: XMLHttpRequest;

  /**
   * FormData object containing files
   */
  formData: FormData;
}

/**
 * FileUpload remove event
 *
 * Emitted when a file is removed
 */
export interface FileUploadRemoveEvent {
  /**
   * Original browser event
   */
  originalEvent: Event;

  /**
   * Removed file
   */
  file: File;
}

/**
 * TabView change event
 *
 * Emitted when the active tab changes
 *
 * @example
 * ```typescript
 * const onChange = (event: TabViewChangeEvent): void => {
 *   console.log('Active tab index:', event.index);
 * };
 * ```
 */
export interface TabViewChangeEvent {
  /**
   * Original browser event
   */
  originalEvent: Event;

  /**
   * Index of the active tab
   */
  index: number;
}

/**
 * Dialog hide event
 *
 * Emitted when a Dialog is closed
 *
 * @example
 * ```typescript
 * const onHide = (event: DialogHideEvent): void => {
 *   console.log('Dialog closed');
 * };
 * ```
 */
export interface DialogHideEvent {
  /**
   * How the dialog was closed
   */
  type: 'close' | 'escape' | 'mask';
}

/**
 * Toast close event
 *
 * Emitted when a toast message is closed
 */
export interface ToastCloseEvent {
  /**
   * Message that was closed
   */
  message: {
    severity: 'success' | 'info' | 'warn' | 'error';
    summary: string;
    detail: string;
    life?: number;
  };
}

/**
 * Checkbox change event
 *
 * Emitted when a Checkbox value changes
 *
 * @example
 * ```typescript
 * const onChange = (event: CheckboxChangeEvent): void => {
 *   console.log('Checked:', event.checked);
 * };
 * ```
 */
export interface CheckboxChangeEvent {
  /**
   * Original browser event
   */
  originalEvent: Event;

  /**
   * Current checked state
   */
  checked: boolean;

  /**
   * Value of the checkbox (if using value attribute)
   */
  value?: unknown;
}

/**
 * Radio button change event
 *
 * Emitted when a RadioButton selection changes
 */
export interface RadioButtonChangeEvent {
  /**
   * Original browser event
   */
  originalEvent: Event;

  /**
   * Selected value
   */
  value: unknown;
}

/**
 * InputSwitch change event
 *
 * Emitted when an InputSwitch is toggled
 *
 * @example
 * ```typescript
 * const onChange = (event: InputSwitchChangeEvent): void => {
 *   console.log('Switch state:', event.value);
 * };
 * ```
 */
export interface InputSwitchChangeEvent {
  /**
   * Original browser event
   */
  originalEvent: Event;

  /**
   * Current value (true/false)
   */
  value: boolean;
}

/**
 * Menu item click event
 *
 * Emitted when a menu item is clicked
 */
export interface MenuItem {
  label?: string;
  icon?: string;
  command?: (event: MenuItemClickEvent) => void;
  url?: string;
  items?: MenuItem[];
  disabled?: boolean;
  visible?: boolean;
  target?: string;
  separator?: boolean;
  [key: string]: unknown;
}

export interface MenuItemClickEvent {
  /**
   * Original browser event
   */
  originalEvent: Event;

  /**
   * Clicked menu item
   */
  item: MenuItem;
}

/**
 * Generic PrimeVue change event
 *
 * Can be used for components where specific event type isn't defined
 *
 * @example
 * ```typescript
 * const onChange = (event: PrimeVueChangeEvent<string>): void => {
 *   console.log('New value:', event.value);
 * };
 * ```
 */
export interface PrimeVueChangeEvent<T = unknown> {
  /**
   * Original browser event
   */
  originalEvent?: Event;

  /**
   * New value
   */
  value: T;
}
