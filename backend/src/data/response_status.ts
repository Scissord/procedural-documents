// src/constants/response-codes.ts
export const RESPONSE_STATUS = {
  // SUCCESS
  OK: 200,
  CREATED: 201,
  INVALID_DATA: 400,
  INTERNAL_SERVER: 500,
} as const;

export type ResponseCode =
  (typeof RESPONSE_STATUS)[keyof typeof RESPONSE_STATUS];
