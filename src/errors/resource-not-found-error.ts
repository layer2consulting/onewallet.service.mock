import AppError from '@highoutput/error';
interface Meta {
  [key: string]: any;
}
export default class ResourceNotFoundError extends AppError<Meta> {
  constructor(meta?: Meta) {
    super('RESOURCE_NOT_FOUND', '', meta || {});
  }
}