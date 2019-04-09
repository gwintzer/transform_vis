import { VisTypesRegistryProvider } from 'ui/registry/vis_types';
import { VisFactoryProvider } from 'ui/vis/vis_factory';
import { DefaultEditorSize } from 'ui/vis/editor_size';
import { Status } from 'ui/vis/update_status';
import React, { Component } from 'react';
import { TransformVisWrapper } from './transform_vis_controller';
import TransformVisEditor from './transform_vis_editor_visualization';
import { RequestHandlerProvider } from './request_handler';

VisTypesRegistryProvider.register(TransformVisProvider);

function TransformVisProvider(Private) {
  const VisFactory = Private(VisFactoryProvider);
  const requestHandler = Private(RequestHandlerProvider);

  return VisFactory.createReactVisualization({
    name: 'transform',
    title: 'Transform',
    description: 'Transfom query results to custom HTML using template language',
    icon: 'editorCodeBlock',
    visConfig: {
      component: TransformVisWrapper,
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
    editor: 'default',
    editorConfig: {
      enableAutoApply: false,
      defaultSize: DefaultEditorSize.LARGE,
      optionsTemplate: TransformVisEditor,
    },
    requiresUpdateStatus: [Status.DATA, Status.RESIZE],
    requestHandler: requestHandler,
    responseHandler: 'none',
    options: {
      showIndexSelection: false,
      showQueryBar: true,
      showFilterBar: true,
    },
  });
}

export default TransformVisProvider