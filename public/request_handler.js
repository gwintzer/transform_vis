import chrome from 'ui/chrome';
import { dashboardContextProvider } from 'plugins/kibana/dashboard/dashboard_context'
import { singleQueryBackwardCapability } from './backward_capability';
import { transform } from '@babel/standalone';

const Mustache = require('mustache');

const babelTransform = (code) => transform(code, { presets: ['es2015'] }).code;

export const createRequestHandler = function (Private, es, indexPatterns, $sanitize) {

  const myRequestHandler = (vis, state) => {

    var { appState, uiState, query, filters, timeRange, searchSource } = state;

    /* As per https://github.com/elastic/kibana/issues/17722 dashboard_context will go away soon.
      The proper way to read the dashboard context is to use `filters` and `query` from the above
      object, however as of 6.4, these variables are coming up undefined */

    const dashboardContext = Private(dashboardContextProvider);
    const options = chrome.getInjected('transformVisOptions');

    const display_error = (displayMessage, consoleMessage, error) => {
      if (consoleMessage !== undefined && error !== undefined) {
        console.log(consoleMessage, error);
      }
      return ({ html: `<div style="text-align: center;"><i>${displayMessage}</i></div>` });
    };


    return singleQueryBackwardCapability(indexPatterns, vis, false)
      .then(() => {
        if (!vis.params.multiquerydsl) {
          return display_error('Multy Query DSL is empty');
        }

        const context = dashboardContext();

        let multiquerydsl = {};
        try {
          let multiquerydsltext = vis.params.multiquerydsl;
          multiquerydsltext = multiquerydsltext.replace(/"_DASHBOARD_CONTEXT_"/g, JSON.stringify(context));
          multiquerydsltext = multiquerydsltext.replace(/"_TIME_RANGE_\[([^\]]*)\]"/g, `{"range":{"$1":{"gte": "${timeRange.from}", "lte": "${timeRange.to}"}}}`);
          multiquerydsl = JSON.parse(multiquerydsltext);
        } catch (error) {
          return display_error('Error (See Console)', 'MultiqueryDSL Parse Error', error);
        }

        const bindme = {};
        bindme.context = context;
        bindme.response = {};

        const fillPrevioudContext = (body, previousContextValue) =>
          Object.keys(body).map(key => {
            if (body[key] === '_PREVIOUS_CONTEXT_') {
              body[key] = previousContextValue;
            } else if (typeof body[key] === 'object') {
              fillPrevioudContext(body[key], previousContextValue);
            }
          });

        const makeQuery = (query_name) => {
          const body = multiquerydsl[query_name];
          const index = body['index'];
          delete body['index'];
          if (body.previousContextSource !== undefined) {
            const previousContextSource = body.previousContextSource;
            try {
              const response = bindme.response;
              const meta = bindme.meta;
              const previousContextValue = eval(babelTransform(previousContextSource));
              fillPrevioudContext(body, typeof previousContextValue === 'function' ? previousContextValue() : previousContextValue);
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
              bindme.meta = eval(babelTransform(vis.params.meta));
            } catch (jserr) {
              bindme.jserr = jserr;
              return display_error('Error (See Console)', 'Javascript Compilation Error', jserr);
            }
          }
        };

        const fillTempate = () => {
          const formula = vis.params.formula;
          try {
            return ({ html: Mustache.render(formula, bindme), after_render: bindme.meta.after_render });
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
      });

  };

  return myRequestHandler;

};