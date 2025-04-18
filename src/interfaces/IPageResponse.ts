import { PageMetaDto } from '../common/dto/page-meta.dto';

export interface IPageResponse {
  data?: any;
  message?: string;
  meta?: PageMetaDto;
}
