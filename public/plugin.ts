import { PluginInitializerContext, CoreSetup, CoreStart, Plugin } from 'kibana/public';
import chrome from 'ui/chrome';
import { Plugin as ExpressionsPublicPlugin } from '../../../src/plugins/expressions/public';
import { VisualizationsSetup } from '../../../src/legacy/core_plugins/visualizations/public';

import { createTransformVisDefinition } from './transform_vis';
import { createTransformVisFn } from './transform_fn';

/** @internal */
export interface TransformPluginSetupDependencies {
  expressions: ReturnType<ExpressionsPublicPlugin['setup']>;
  visualizations: VisualizationsSetup;
}

/** @internal */
export class TransformPlugin implements Plugin<void, void> {
  initializerContext: PluginInitializerContext;

  constructor(initializerContext: PluginInitializerContext) {
    this.initializerContext = initializerContext;
  }

  public async setup(
    core: CoreSetup,
    { expressions, visualizations }: TransformPluginSetupDependencies
  ) {
    const $injector = await chrome.dangerouslyGetActiveInjector();
    visualizations.types.createReactVisualization(
      createTransformVisDefinition({ uiSettings: core.uiSettings, es: $injector.get('es') })
    );
    expressions.registerFunction(() =>
      createTransformVisFn({ uiSettings: core.uiSettings, es: $injector.get('es') })
    );
  }

  public async start(core: CoreStart) {}
}
