import chrome from 'ui/chrome';
import { timefilter } from 'ui/timefilter'
import { buildEsQuery, getEsQueryConfig } from '@kbn/es-query';
import { transform } from '@babel/standalone';

const Mustache = require('mustache');

const babelTransform = (code) => transform(code, { presets: ['es2015'], plugins: ['transform-async-to-generator'] }).code;

export function RequestHandlerProvider (es, config) {

  const myRequestHandler = function ({ timeRange, filters, query, visParams, visTitle }) {

    const options = chrome.getInjected('transformVisOptions');

    const display_error = (displayMessage, consoleMessage, error) => {
      if (consoleMessage !== undefined && error !== undefined) {
        console.error(consoleMessage, error);
      }
      return ({ html: `<div style="text-align: center;"><i>${displayMessage}</i></div>` });
    };


    if (!visParams.multiquerydsl) {
      return display_error('Multy Query DSL is empty');
    }

    const esQueryConfigs = getEsQueryConfig(config);
    const context = buildEsQuery(undefined, query, filters, esQueryConfigs);

    let multiquerydsl = {};
    try {
      let multiquerydsltext = visParams.multiquerydsl;
      multiquerydsltext = multiquerydsltext.replace(/"_DASHBOARD_CONTEXT_"/g, JSON.stringify(context));
      multiquerydsltext = multiquerydsltext.replace(/"_TIME_RANGE_\[([^\]]*)\]"/g, `{"range":{"$1":{"gte": "${timeRange.from}", "lte": "${timeRange.to}"}}}`);
      multiquerydsl = JSON.parse(multiquerydsltext);
    } catch (error) {
      return display_error('Error (See Console)', 'MultiqueryDSL Parse Error', error);
    }

    const bindme = {};
    bindme.context = context;
    bindme.timefilter = timefilter;
    bindme.timeRange = timeRange;
    bindme.visTitle = visTitle;
    bindme.buildEsQuery = buildEsQuery;
    bindme.es = es;
    bindme.response = {};

    const fillPrevioudContext = (body, previousContextValue) =>
      Object.keys(body).map(key => {
        if (body[key] === '_PREVIOUS_CONTEXT_') {
          body[key] = previousContextValue;
        } else if (typeof body[key] === 'object') {
          fillPrevioudContext(body[key], previousContextValue);
        }
      });

    const makeQuery = async (query_name) => {
      const body = multiquerydsl[query_name];
      const index = body['index'];
      delete body['index'];
      if (body.previousContextSource !== undefined) {
        const previousContextSource = body.previousContextSource;
        try {
          const response = bindme.response;
          const meta = bindme.meta;
          const previousContextValue = eval(babelTransform(previousContextSource));
          fillPrevioudContext(body, typeof previousContextValue === 'function' ? await previousContextValue() : previousContextValue);
        } catch (error) {
          return display_error('Error (See Console)', 'Previous Context Parse Error', error);
        }
        delete body['previousContextSource'];
      }
      return es.search({
        index: index,
        body: body,
      }).then(function (response) {
        if (query_name === '_single_') {
          bindme.response = Object.assign(bindme.response, response);
        } else {
          bindme.response = Object.assign(bindme.response, { [query_name]: response });
        }
      });
    };

    const evalMeta = () => {
      if (options.allow_unsafe) {
        try {
          const response = bindme.response;
          bindme.meta = eval(babelTransform(visParams.meta));
        } catch (jserr) {
          bindme.jserr = jserr;
          return display_error('Error (See Console)', 'Javascript Compilation Error', jserr);
        }
      }
    };

    const fillTempate = async () => {
      const formula = visParams.formula;
      try {
        const awaitContext = {}
        for (let key of Object.keys(bindme.meta)) {
          awaitContext[key] = (typeof(bindme.meta[key]) === 'function' && key !== 'after_render') ? await bindme.meta[key].bind(bindme)() : bindme.meta[key]
        }
        return ({ html: Mustache.render(formula, { ...bindme, meta: awaitContext }), meta: bindme.meta, es, context });
      } catch (error) {
        return display_error('Error (See Console)', 'Mustache Template Error', error);
      }
    };

    return Promise.all(Object.keys(multiquerydsl).filter(query => multiquerydsl[query].previousContextSource === undefined).map(makeQuery))
      .then(evalMeta)
      .then(_ => Object.keys(multiquerydsl).filter(query => multiquerydsl[query].previousContextSource !== undefined).reduce((acc,curr) => acc.then(_ => makeQuery(curr)), Promise.resolve()))
      .then(evalMeta)
      .then(fillTempate)
      .catch(error => display_error('Error (See Console)', 'Elasticsearch Query Error', error))

  };

  return myRequestHandler;

}