import { Client as EsApiClient } from 'elasticsearch';
import { Filter } from 'src/plugins/data/common/es_query/filters';
import { DslQuery } from 'src/plugins/data/common/es_query/es_query/es_query_dsl';
import { TimeRange } from 'src/plugins/data/public';
import { timefilter } from 'ui/timefilter';

export interface Arguments {
  multiquerydsl: string;
  meta: string;
  formula: string;
}

export type TransformVisParamsNames = 'multiquerydsl' | 'meta' | 'formula';

export interface TransformVisParams {
  multiquerydsl: Arguments['multiquerydsl'];
  meta: Arguments['meta'];
  formula: Arguments['formula'];
}

export interface TransformVisData {
  transform: string;
  meta?: Record<string, any>;
  es?: EsApiClient;
  context?: {
    bool: {
      must: DslQuery[];
      filter: Filter[];
      should: never[];
      must_not: Filter[];
    };
  };
  timefilter?: typeof timefilter;
  timeRange?: TimeRange | null;
  buildEsQuery?: Function;
}
