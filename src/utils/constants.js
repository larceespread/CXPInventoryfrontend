// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    UPDATE_DETAILS: '/auth/updatedetails',
    UPDATE_PASSWORD: '/auth/updatepassword',
    LOGOUT: '/auth/logout'
  },
  PRODUCTS: {
    BASE: '/products',
    LOW_STOCK: '/products/low-stock',
    OUT_OF_STOCK: '/products/out-of-stock',
    NON_SELLABLE_SUMMARY: '/products/non-sellable/summary',
    STORAGE: (location) => `/products/storage/${location}`,
    BARCODE: (barcode) => `/products/search/barcode/${barcode}`,
    VALUATION: '/products/valuation',
    RESTOCK: (id) => `/products/${id}/restock',
    BULK_UPDATE: '/products/bulk/update',
    INIT_NON_SELLABLE: '/products/init-non-sellable'
  },
  CATEGORIES: {
    BASE: '/categories',
    NON_SELLABLE_DEFAULTS: '/categories/non-sellable/defaults',
    PRODUCTS: (id) => `/categories/${id}/products`
  },
  BRANDS: {
    BASE: '/brands',
    PRODUCTS: (id) => `/brands/${id}/products'
  },
  SALES: {
    BASE: '/sales',
    TODAY: '/sales/today',
    RANGE: '/sales/range',
    SYNC: '/sales/sync',
    INVOICE: (id) => `/sales/${id}/invoice`
  },
  USERS: {
    BASE: '/users',
    SALES_STATS: (id) => `/users/${id}/sales-stats`,
    PASSWORD: (id) => `/users/${id}/password`
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
    REPORTS: {
      SALES: '/dashboard/reports/sales',
      INVENTORY: '/dashboard/reports/inventory',
      NON_SELLABLE: '/dashboard/reports/non-sellable',
      USER_ACTIVITY: '/dashboard/reports/user-activity'
    }
  }
}

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier'
}

// User Role Labels
export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.MANAGER]: 'Manager',
  [USER_ROLES.CASHIER]: 'Cashier'
}

// Product Types
export const PRODUCT_TYPES = {
  SELLABLE: 'sellable',
  MERCHANDISE: 'merchandise',
  EQUIPMENT: 'equipment',
  COLLATERAL: 'collateral'
}

// Product Type Labels
export const PRODUCT_TYPE_LABELS = {
  [PRODUCT_TYPES.SELLABLE]: 'Sellable',
  [PRODUCT_TYPES.MERCHANDISE]: 'Merchandise',
  [PRODUCT_TYPES.EQUIPMENT]: 'Equipment',
  [PRODUCT_TYPES.COLLATERAL]: 'Collateral'
}

// Product Type Colors (for UI)
export const PRODUCT_TYPE_COLORS = {
  [PRODUCT_TYPES.SELLABLE]: 'green',
  [PRODUCT_TYPES.MERCHANDISE]: 'purple',
  [PRODUCT_TYPES.EQUIPMENT]: 'blue',
  [PRODUCT_TYPES.COLLATERAL]: 'yellow'
}

// Storage Locations
export const STORAGE_LOCATIONS = {
  BALAGTAS: 'BALAGTAS',
  MARILAO: 'MARILAO'
}

// Storage Location Labels
export const STORAGE_LOCATION_LABELS = {
  [STORAGE_LOCATIONS.BALAGTAS]: 'Balagtas Warehouse',
  [STORAGE_LOCATIONS.MARILAO]: 'Marilao Warehouse'
}

// Category Types
export const CATEGORY_TYPES = {
  SELLABLE: 'sellable',
  MERCHANDISE: 'merchandise',
  EQUIPMENT: 'equipment',
  COLLATERAL: 'collateral',
  ALL: 'all'
}

// Category Type Labels
export const CATEGORY_TYPE_LABELS = {
  [CATEGORY_TYPES.SELLABLE]: 'Sellable Items',
  [CATEGORY_TYPES.MERCHANDISE]: 'Merchandise',
  [CATEGORY_TYPES.EQUIPMENT]: 'Equipment',
  [CATEGORY_TYPES.COLLATERAL]: 'Collateral',
  [CATEGORY_TYPES.ALL]: 'All Types'
}

// Default Non-Sellable Categories (from your backend)
export const DEFAULT_NON_SELLABLE_CATEGORIES = [
  { 
    name: 'MERCH', 
    description: 'Merchandise items - caps, shirts, bags, stickers', 
    categoryType: CATEGORY_TYPES.MERCHANDISE 
  },
  { 
    name: 'EQUIPMENT', 
    description: 'Equipment items - speakers, generators, appliances', 
    categoryType: CATEGORY_TYPES.EQUIPMENT 
  },
  { 
    name: 'COLLATERALS', 
    description: 'Collateral items - tents, chairs, flags, racks, balloons', 
    categoryType: CATEGORY_TYPES.COLLATERAL 
  }
]

// Brand Types
export const BRAND_TYPES = {
  PRODUCT: 'product',
  MERCHANDISE: 'merchandise',
  EQUIPMENT: 'equipment',
  ALL: 'all'
}

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE_MONEY: 'mobile_money',
  MIXED: 'mixed'
}

// Payment Method Labels
export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Cash',
  [PAYMENT_METHODS.CARD]: 'Card',
  [PAYMENT_METHODS.MOBILE_MONEY]: 'Mobile Money',
  [PAYMENT_METHODS.MIXED]: 'Mixed'
}

// Sale Status
export const SALE_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
}

// Sale Status Labels
export const SALE_STATUS_LABELS = {
  [SALE_STATUS.COMPLETED]: 'Completed',
  [SALE_STATUS.PENDING]: 'Pending',
  [SALE_STATUS.CANCELLED]: 'Cancelled',
  [SALE_STATUS.REFUNDED]: 'Refunded'
}

// Sale Status Colors
export const SALE_STATUS_COLORS = {
  [SALE_STATUS.COMPLETED]: 'green',
  [SALE_STATUS.PENDING]: 'yellow',
  [SALE_STATUS.CANCELLED]: 'red',
  [SALE_STATUS.REFUNDED]: 'gray'
}

// Dashboard Tab IDs (matching your image)
export const DASHBOARD_TABS = {
  TOTAL_ASSETS: 'total',
  AVAILABLE_ASSETS: 'available',
  SHIP_ITEMS: 'ship',
  PENDING_ITEMS: 'pending',
  NOTIFICATIONS: 'notifications'
}

// Dashboard Tab Labels
export const DASHBOARD_TAB_LABELS = {
  [DASHBOARD_TABS.TOTAL_ASSETS]: 'Total Assets',
  [DASHBOARD_TABS.AVAILABLE_ASSETS]: 'Available Assets',
  [DASHBOARD_TABS.SHIP_ITEMS]: 'Ship Items',
  [DASHBOARD_TABS.PENDING_ITEMS]: 'Pending Items',
  [DASHBOARD_TABS.NOTIFICATIONS]: 'Notifications'
}

// Dashboard Tab Icons (matching your Lucide React icons)
export const DASHBOARD_TAB_ICONS = {
  [DASHBOARD_TABS.TOTAL_ASSETS]: 'Package',
  [DASHBOARD_TABS.AVAILABLE_ASSETS]: 'Package',
  [DASHBOARD_TABS.SHIP_ITEMS]: 'Truck',
  [DASHBOARD_TABS.PENDING_ITEMS]: 'Clock',
  [DASHBOARD_TABS.NOTIFICATIONS]: 'Bell'
}

// Dashboard Tab Colors
export const DASHBOARD_TAB_COLORS = {
  [DASHBOARD_TABS.TOTAL_ASSETS]: 'blue',
  [DASHBOARD_TABS.AVAILABLE_ASSETS]: 'green',
  [DASHBOARD_TABS.SHIP_ITEMS]: 'yellow',
  [DASHBOARD_TABS.PENDING_ITEMS]: 'orange',
  [DASHBOARD_TABS.NOTIFICATIONS]: 'red'
}

// Report Periods
export const REPORT_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  CUSTOM: 'custom'
}

// Report Period Labels
export const REPORT_PERIOD_LABELS = {
  [REPORT_PERIODS.DAILY]: 'Daily',
  [REPORT_PERIODS.WEEKLY]: 'Weekly',
  [REPORT_PERIODS.MONTHLY]: 'Monthly',
  [REPORT_PERIODS.YEARLY]: 'Yearly',
  [REPORT_PERIODS.CUSTOM]: 'Custom Range'
}

// Stock Status
export const STOCK_STATUS = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  OVERSTOCK: 'overstock'
}

// Stock Status Labels
export const STOCK_STATUS_LABELS = {
  [STOCK_STATUS.IN_STOCK]: 'In Stock',
  [STOCK_STATUS.LOW_STOCK]: 'Low Stock',
  [STOCK_STATUS.OUT_OF_STOCK]: 'Out of Stock',
  [STOCK_STATUS.OVERSTOCK]: 'Overstock'
}

// Stock Status Colors
export const STOCK_STATUS_COLORS = {
  [STOCK_STATUS.IN_STOCK]: 'green',
  [STOCK_STATUS.LOW_STOCK]: 'yellow',
  [STOCK_STATUS.OUT_OF_STOCK]: 'red',
  [STOCK_STATUS.OVERSTOCK]: 'blue'
}

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy hh:mm a',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: 'yyyy-MM-dd HH:mm:ss',
  FILE_NAME: 'yyyyMMdd_HHmmss',
  INVOICE: 'yyyyMMdd'
}

// Pagination Defaults
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 25,
  MAX_LIMIT: 100
}

// Sort Directions
export const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc'
}

// Sort Direction Labels
export const SORT_DIRECTION_LABELS = {
  [SORT_DIRECTIONS.ASC]: 'Ascending',
  [SORT_DIRECTIONS.DESC]: 'Descending'
}

// Sort Direction Icons
export const SORT_DIRECTION_ICONS = {
  [SORT_DIRECTIONS.ASC]: 'ArrowUp',
  [SORT_DIRECTIONS.DESC]: 'ArrowDown'
}

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500
}

// Toast Messages
export const TOAST_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGIN_ERROR: 'Login failed. Please check your credentials.',
  REGISTER_SUCCESS: 'Registration successful!',
  REGISTER_ERROR: 'Registration failed. Please try again.',
  LOGOUT_SUCCESS: 'Logged out successfully',
  CREATE_SUCCESS: 'Item created successfully',
  CREATE_ERROR: 'Failed to create item',
  UPDATE_SUCCESS: 'Item updated successfully',
  UPDATE_ERROR: 'Failed to update item',
  DELETE_SUCCESS: 'Item deleted successfully',
  DELETE_ERROR: 'Failed to delete item',
  RESTOCK_SUCCESS: 'Item restocked successfully',
  RESTOCK_ERROR: 'Failed to restock item',
  SALE_SUCCESS: 'Sale completed successfully',
  SALE_ERROR: 'Failed to complete sale',
  SYNC_SUCCESS: 'Offline sales synced successfully',
  SYNC_ERROR: 'Failed to sync offline sales',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.'
}

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 100,
  PRODUCT_NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  QUANTITY_MIN: 0,
  PRICE_MIN: 0,
  PHONE_REGEX: /^[0-9+\-\s()]{10,15}$/,
  EMAIL_REGEX: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
}

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  OFFLINE_SALES: 'offline_sales',
  LAST_SYNC: 'last_sync'
}

// Theme Options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
}

// Currency
export const CURRENCY = {
  CODE: 'PHP',
  SYMBOL: '₱',
  NAME: 'Philippine Peso'
}

// Units of Measurement
export const UNITS = {
  PIECES: 'pcs',
  BOX: 'box',
  PACK: 'pack',
  SET: 'set',
  METER: 'm',
  KILOGRAM: 'kg',
  LITER: 'L'
}

// Unit Labels
export const UNIT_LABELS = {
  [UNITS.PIECES]: 'Pieces',
  [UNITS.BOX]: 'Box',
  [UNITS.PACK]: 'Pack',
  [UNITS.SET]: 'Set',
  [UNITS.METER]: 'Meter',
  [UNITS.KILOGRAM]: 'Kilogram',
  [UNITS.LITER]: 'Liter'
}

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#3B82F6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
  INFO: '#6366F1',
  PURPLE: '#8B5CF6',
  PINK: '#EC4899',
  GRAY: '#6B7280'
}

// Chart Color Array (for multiple datasets)
export const CHART_COLOR_ARRAY = [
  CHART_COLORS.PRIMARY,
  CHART_COLORS.SUCCESS,
  CHART_COLORS.WARNING,
  CHART_COLORS.DANGER,
  CHART_COLORS.INFO,
  CHART_COLORS.PURPLE,
  CHART_COLORS.PINK,
  CHART_COLORS.GRAY
]

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ACCEPTED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}

// Timeouts
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  TOAST_DURATION: 3000, // 3 seconds
  DEBOUNCE: 300, // 300ms
  AUTO_SAVE: 2000, // 2 seconds
  SESSION_CHECK: 60000 // 1 minute
}

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  PASSWORD_MISMATCH: 'Passwords do not match',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`,
  INVALID_QUANTITY: 'Quantity must be a positive number',
  INVALID_PRICE: 'Price must be a positive number',
  INSUFFICIENT_STOCK: 'Insufficient stock',
  MAX_LENGTH_EXCEEDED: (max) => `Maximum length is ${max} characters`,
  FILE_TOO_LARGE: `File size must be less than ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`,
  INVALID_FILE_TYPE: 'Invalid file type'
}

export default {
  API_ENDPOINTS,
  USER_ROLES,
  USER_ROLE_LABELS,
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABELS,
  PRODUCT_TYPE_COLORS,
  STORAGE_LOCATIONS,
  STORAGE_LOCATION_LABELS,
  CATEGORY_TYPES,
  CATEGORY_TYPE_LABELS,
  DEFAULT_NON_SELLABLE_CATEGORIES,
  BRAND_TYPES,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  SALE_STATUS,
  SALE_STATUS_LABELS,
  SALE_STATUS_COLORS,
  DASHBOARD_TABS,
  DASHBOARD_TAB_LABELS,
  DASHBOARD_TAB_ICONS,
  DASHBOARD_TAB_COLORS,
  REPORT_PERIODS,
  REPORT_PERIOD_LABELS,
  STOCK_STATUS,
  STOCK_STATUS_LABELS,
  STOCK_STATUS_COLORS,
  DATE_FORMATS,
  PAGINATION_DEFAULTS,
  SORT_DIRECTIONS,
  SORT_DIRECTION_LABELS,
  SORT_DIRECTION_ICONS,
  HTTP_STATUS,
  TOAST_MESSAGES,
  VALIDATION_RULES,
  STORAGE_KEYS,
  THEMES,
  CURRENCY,
  UNITS,
  UNIT_LABELS,
  CHART_COLORS,
  CHART_COLOR_ARRAY,
  FILE_UPLOAD,
  TIMEOUTS,
  ERROR_MESSAGES
}