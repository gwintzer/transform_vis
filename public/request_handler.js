import chrome from 'ui/chrome';
import { buildEsQuery } from '@kbn/es-query'

const Mustache = require('mustache');

export const createRequestHandler = function(Private, es, indexPatterns, $sanitize) {
  
    return function({ timeRange, filters, query, queryFilter, searchSource, visParams }) {

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
    
          const esQueryContext = buildEsQuery(
              undefined,
              [query, searchSource.getFields().query],
              [...filters, ...searchSource.getFields().filter.filter(i => !i.meta.disabled)]
          );
          
          if (indexPattern.timeFieldName) {
            const timefilterdsl = {range: {}};
            timefilterdsl.range[indexPattern.timeFieldName] = {gte: timeRange.from, lte: timeRange.to};
            esQueryContext.bool.must.push(timefilterdsl);
          }

          const body = JSON.parse(visParams.querydsl.replace('"_DASHBOARD_CONTEXT_"', JSON.stringify(esQueryContext)));

          es.search({
            index: indexPattern.title,
            body: body
          }, function (error, response) {
    
            if (error) {
              display_error("Error (See Console)");
              console.log("Elasticsearch Query Error", error);
              return
            }

            const formula = visParams.formula;
            const bindme = {};
            bindme.context = esQueryContext;
            bindme.response = response;
            bindme.error = error;
            if (options.allow_unsafe) {
              try {
                bindme.meta = eval(visParams.meta);
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
        
        indexPatterns.get(visParams.indexpattern).then(function (indexPattern) {
          search(indexPattern);
        });
        
      });
  
    };
  };