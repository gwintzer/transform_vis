import { VisTypesRegistryProvider } from 'ui/registry/vis_types';
import { VisFactoryProvider } from 'ui/vis/vis_factory';
import { DefaultEditorSize } from 'ui/vis/editor_size';
import { Status } from 'ui/vis/update_status';

import { RequestHandlerProvider } from './request_handler';
import { VisualizationProvider } from './visualisation';

// Editor-specific code
import './editor_controller';
import optionsTemplate from './options_template.html';

VisTypesRegistryProvider.register((Private) => {
  const VisFactory = Private(VisFactoryProvider);
  const requestHandler = Private(RequestHandlerProvider);
  const visualization = Private(VisualizationProvider);

  return VisFactory.createBaseVisualization({
    name: 'transform',
    title: 'Transform',
    description: 'Transfom query results to custom HTML using template language',
    icon: 'editorCodeBlock',
    visConfig: {
      defaults: {
        meta: `({
  count_hits: function() {
    return this.response.logstash_query.hits.total;
  }
})`,
        multiquerydsl: `{
  "logstash_query": {
    "index": "logstash-*",
    "query": {
      "bool": {
        "must": [
          "_DASHBOARD_CONTEXT_",
          "_TIME_RANGE_[@timestamp]"
        ]
      }
    }
  }
}`,
        formula: '<hr>{{response.logstash_query.hits.total}} total hits<hr>',
      },
    },
    editorConfig: {
      optionsTemplate: optionsTemplate,
      enableAutoApply: false,
      defaultSize: DefaultEditorSize.MEDIUM,
    },
    visualization: visualization,
    requiresUpdateStatus: [Status.DATA, Status.RESIZE],
    requestHandler: requestHandler,
    responseHandler: 'none',
    options: {
      showIndexSelection: false,
      showQueryBar: true,
      showFilterBar: true,
    },
  });
});
