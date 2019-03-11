import './transform_vis.less';

import { VisFactoryProvider } from 'ui/vis/vis_factory';
import { VisTypesRegistryProvider } from 'ui/registry/vis_types';
import { createRequestHandler } from './request_handler';

import { TransformVisWrapper } from './vis_controller';

import optionsTemplate from './options_template.html';
import 'plugins/transform_vis/editor_controller';
  
function TransformVisProvider(Private, es, indexPatterns, $sanitize) {
  const VisFactory = Private(VisFactoryProvider);
  
  return VisFactory.createReactVisualization({
    name: 'transform',
    title: 'Transform',
    description: 'Transfom query results to custom HTML using template language',
    icon: 'merge',

    visConfig: {
      component: TransformVisWrapper,
      defaults: {
        meta: `({
  count_hits: function() {
    return this.response.hits.total;
  }
})`,
          querydsl: `{
  "query": {
    "bool": {
      "must": [
        "_DASHBOARD_CONTEXT_"
      ]
    }
  }
}`,
        formula: '<hr>{{response.hits.total}} total hits<hr>'
      },
    },

    editorConfig: {
      optionsTemplate: optionsTemplate
    },

    requestHandler: createRequestHandler(Private, es, indexPatterns, $sanitize),
    responseHandler: 'none',
    options: {
      showIndexSelection: false
    }
  });
}

VisTypesRegistryProvider.register(TransformVisProvider);
export default TransformVisProvider;