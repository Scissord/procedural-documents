export type BaseSuccess<Payload = {}> = {
  code: 'OK';
} & Payload;

export type BaseError = {
  code: string;
  error: string;
  message: string;
};

export type IBaseResponse<T> = BaseSuccess<T> | BaseError;
