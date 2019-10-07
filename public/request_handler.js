import chrome from 'ui/chrome';
//import { dashboardContextProvider } from 'plugins/kibana/dashboard/dashboard_context'
import { buildEsQuery, getEsQueryConfig } from '@kbn/es-query'
const Mustache = require('mustache');
const Plotly = require('plotly.js');



export const createRequestHandler = function(Private, es, indexPatterns, $sanitize) {

    const myRequestHandler = (vis) => {

      var { uiState, query, filters, timeRange } = vis;



      //const dashboardContext = Private(dashboardContextProvider);
      const options = chrome.getInjected('transformVisOptions');

      return new Promise((resolve, reject) => {

        function display_error(message) {
          resolve({ html: `<div style="text-align: center;"><i>${message}</i></div>`});
        }

        function search(indexPattern){

          // This is part of what should be a wider config validation
          if (indexPattern === undefined || indexPattern.id === undefined) {
            display_error("No Index Pattern");
            return;
          }

          //const context = dashboardContext();
          const esQueryContext = buildEsQuery(
            indexPattern,
            query,
            filters,
            undefined
          );


          if (indexPattern.timeFieldName) {
            const timefilterdsl = {range: {}};
            timefilterdsl.range[indexPattern.timeFieldName] = {gte: timeRange.from, lte: timeRange.to};
            //context.bool.must.push(timefilterdsl);
            esQueryContext.bool.must.push(timefilterdsl);
          }

          //const body = JSON.parse(vis.visParams.querydsl.replace('"_DASHBOARD_CONTEXT_"', JSON.stringify(context)));
          const body = JSON.parse(vis.visParams.querydsl.replace('"_DASHBOARD_CONTEXT_"', JSON.stringify(esQueryContext)));
          //   console.log("searchSource", searchSource);
           console.log("query", query);
           console.log("filters", filters);
           console.log("body", body);

          es.search({
            index: indexPattern.title,
            body: body
          }, function (error, response) {

            if (error) {
              display_error("Error (See Console)");
              console.log("Elasticsearch Query Error", error);
              return
            }
              const formula = vis.visParams.formula;
            const formula = visParams.formula;
            const bindme = {};
              bindme.context = esQueryContext;
            bindme.response = response;
            bindme.error = error;
            if (options.allow_unsafe) {
              try {
                  bindme.meta = eval(vis.visParams.meta);
              } catch (jserr) {
                bindme.jserr = jserr;
                display_error("Error (See Console)");
                console.log("Javascript Compilation Error", jserr);
                return; // Abort!
              }
              if (typeof bindme.meta.before_render === "function") { bindme.meta.before_render(); }
                resolve({
                  html: Mustache.render(formula, bindme),
                after_render: bindme.meta.after_render
              });

            } else {
              resolve({ html: $sanitize(Mustache.render(formula, bindme)) });
            }


          });

        }

        indexPatterns.get(vis.visParams.indexpattern).then(function (indexPattern) {
          search(indexPattern);
        });

      });

    };


  }


