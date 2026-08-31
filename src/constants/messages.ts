export const MESSAGES = {
  AUTH: {
    SIGNUP_SUCCESS: 'Account created successfully.',
    LOGIN_SUCCESS: 'Login successful.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
    UNAUTHORIZED: 'Authentication required. Please log in.',
    TOKEN_EXPIRED: 'Session expired. Please log in again.',
    FORBIDDEN: 'Access denied. You do not have permission for this resource.',
  },
  QUOTES: {
    FETCH_SUCCESS: 'Quotes retrieved successfully.',
    FETCH_ONE_SUCCESS: 'Quote retrieved successfully.',
    CREATE_SUCCESS: 'Quote created successfully.',
    UPDATE_SUCCESS: 'Quote updated successfully.',
    DELETE_SUCCESS: 'Quote deleted successfully.',
    NOT_FOUND: 'Quote not found.',
    LIKE_SUCCESS: 'Quote like status updated.',
    TAGS_FETCH_SUCCESS: 'Tags retrieved successfully.',
  },
  SERVER: {
    INTERNAL_ERROR: 'Internal server error occurred.',
    VALIDATION_ERROR: 'Validation error in request payload.',
    NOT_FOUND: 'Requested endpoint does not exist.',
    HEALTH_OK: 'Service is healthy.',
  },
} as const;
