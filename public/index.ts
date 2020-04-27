import { PluginInitializerContext } from 'kibana/public';
import { TransformPlugin as Plugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new Plugin(initializerContext);
}
