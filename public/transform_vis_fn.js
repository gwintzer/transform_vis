import { functionsRegistry } from 'plugins/interpreter/registries';
import { get } from 'lodash';
import chrome from 'ui/chrome';
import { RequestHandlerProvider } from './request_handler';

export const transform_vis = () => ({
  name: 'transform_vis',
  type: 'render',
  context: {
    types: [
      'kibana_context',
      'null',
    ],
  },
  args: {
    visConfig: {
      types: ['string'],
      default: '{}',
    },
    visTitle: {
      types: ['string'],
      default: '',
    },
  },
  async fn(context, args) {

    const visConfig = JSON.parse(args.visConfig)
    const $injector = await chrome.dangerouslyGetActiveInjector();
    const Private = $injector.get('Private');
    const transformVisRequestHandler = Private(RequestHandlerProvider);

    const response = await transformVisRequestHandler({
      timeRange: get(context, 'timeRange', null),
      filters: get(context, 'filters', null),
      query: get(context, 'query', null),
      visParams: visConfig,
      visTitle: args.visTitle,
    });

    return {
      type: 'render',
      as: 'visualization',
      value: {
        visData: response,
        visType: 'transform',
        visConfig: visConfig,
      }
    };
  }
});

functionsRegistry.register(transform_vis);
