import { transform } from '@babel/standalone';
import { IUiSettingsClient } from 'kibana/public';
import Mustache from 'mustache';
import { Client as EsApiClient } from 'elasticsearch';
import { timefilter } from 'ui/timefilter';
import chrome from 'ui/chrome';
import { esQuery, TimeRange, esFilters, Query } from '../../../src/plugins/data/public';
import { VisParams } from '../../../src/legacy/core_plugins/visualizations/public/np_ready/public';
import { TransformVisData } from './types';

const babelTransform = (code: string) => {
  return transform(code, {
    presets: ['es2015'],
    plugins: ['transform-async-to-generator'],
  }).code;
};

export function getTransformRequestHandler({
  uiSettings,
  es,
}: {
  uiSettings: IUiSettingsClient;
  es: EsApiClient;
}) {
  return async ({
    timeRange,
    filters,
    query,
    visParams,
  }: {
    timeRange: TimeRange | null;
    filters: esFilters.Filter[] | null;
    query: Query | null;
    visParams: VisParams;
  }): Promise<TransformVisData> => {
    const settings = chrome.getUiSettingsClient();
    const options = chrome.getInjected('transformVisOptions');

    const _timeRange: TimeRange = timeRange || settings.get('timepicker:timeDefaults');
    const _filters = filters || [];
    const _query = query || { language: 'kquery', query: '' };

    const displayError = (displayMessage: string, consoleMessage?: string, error?: Error) => {
      if (consoleMessage !== undefined && error !== undefined) {
        // eslint-disable-next-line no-console
        console.error(consoleMessage, error);
      }
      return { transform: `<div style="text-align: center;"><i>${displayMessage}</i></div>` };
    };

    if (!visParams.multiquerydsl) {
      return displayError('Multy Query DSL is empty');
    }

    const esQueryConfigs = esQuery.getEsQueryConfig(uiSettings);
    const context = esQuery.buildEsQuery(undefined, _query, _filters, esQueryConfigs);

    let multiquerydsl: Record<string, any> = {};
    try {
      let multiquerydsltext = visParams.multiquerydsl;
      multiquerydsltext = multiquerydsltext.replace(
        /"_DASHBOARD_CONTEXT_"/g,
        JSON.stringify(context)
      );
      multiquerydsltext = multiquerydsltext.replace(
        /"_TIME_RANGE_\[([^\]]*)]"/g,
        `{"range":{"$1":{"gte": "${_timeRange.from}", "lte": "${_timeRange.to}"}}}`
      );
      multiquerydsl = JSON.parse(multiquerydsltext);
    } catch (error) {
      return displayError('Error (See Console)', 'MultiqueryDSL Parse Error', error);
    }

    const bindme: Record<string, any> = {};
    bindme.context = context;
    bindme.timefilter = timefilter;
    bindme.timeRange = _timeRange;
    bindme.buildEsQuery = esQuery.buildEsQuery;
    bindme.es = es;
    bindme.response = {};

    const fillPrevioudContext = (body: Record<string, any>, previousContextValue: any) =>
      Object.keys(body).map(key => {
        if (body[key] === '_PREVIOUS_CONTEXT_') {
          body[key] = previousContextValue;
        } else if (typeof body[key] === 'object') {
          fillPrevioudContext(body[key], previousContextValue);
        }
      });

    const makeQuery = async (queryName: string) => {
      const body = multiquerydsl[queryName];
      const index = body.index;
      delete body.index;
      if (body.previousContextSource !== undefined) {
        const previousContextSource = body.previousContextSource;
        try {
          // @ts-ignore
          const response = bindme.response;
          // @ts-ignore
          const meta = bindme.meta;
          // eslint-disable-next-line no-eval
          const previousContextValue = eval(babelTransform(previousContextSource) || '');
          fillPrevioudContext(
            body,
            typeof previousContextValue === 'function'
              ? await previousContextValue()
              : previousContextValue
          );
        } catch (error) {
          return displayError('Error (See Console)', 'Previous Context Parse Error', error);
        }
        delete body.previousContextSource;
      }
      return es
        .search({
          index,
          body,
        })
        .then(function(response) {
          if (queryName === '_single_') {
            bindme.response = Object.assign(bindme.response, response);
          } else {
            bindme.response = Object.assign(bindme.response, { [queryName]: response });
          }
        });
    };

    const evalMeta = () => {
      if (options.allow_unsafe) {
        try {
          // @ts-ignore
          const response = bindme.response;
          // eslint-disable-next-line no-eval
          bindme.meta = eval(babelTransform(visParams.meta) || '');
        } catch (jserr) {
          bindme.jserr = jserr;
          return displayError('Error (See Console)', 'Javascript Compilation Error', jserr);
        }
      }
    };

    const fillTempate = async () => {
      const formula = visParams.formula;
      try {
        const awaitContext: Record<string, any> = {};
        for (const key of Object.keys(bindme.meta)) {
          awaitContext[key] =
            typeof bindme.meta[key] === 'function' && key !== 'after_render'
              ? await bindme.meta[key].bind(bindme)()
              : bindme.meta[key];
        }
        return {
          transform: Mustache.render(formula, { ...bindme, meta: awaitContext }),
          meta: bindme.meta,
          es,
          context,
          timefilter,
          timeRange,
          buildEsQuery: esQuery.buildEsQuery,
        };
      } catch (error) {
        return displayError('Error (See Console)', 'Mustache Template Error', error);
      }
    };

    return Promise.all(
      Object.keys(multiquerydsl)
        .filter(__query => multiquerydsl[__query].previousContextSource === undefined)
        .map(makeQuery)
    )
      .then(evalMeta)
      .then(() =>
        Object.keys(multiquerydsl)
          .filter(__query => multiquerydsl[__query].previousContextSource !== undefined)
          .reduce(
            (acc, curr) =>
              acc.then(() => {
                makeQuery(curr);
              }),
            Promise.resolve()
          )
      )
      .then(evalMeta)
      .then(fillTempate)
      .catch(error => displayError('Error (See Console)', 'Elasticsearch Query Error', error));
  };
}
