import { resolve } from 'path';
import { existsSync } from "fs";
import { Legacy } from 'kibana';

import { LegacyPluginApi, LegacyPluginInitializer } from '../../src/legacy/types';

const transformPluginInitializer: LegacyPluginInitializer = ({ Plugin }: LegacyPluginApi) =>
  new Plugin({
    id: 'transform_vis',
    require: ['elasticsearch'],
    publicDir: resolve(__dirname, 'public'),
    uiExports: {
      styleSheetPaths: [resolve(__dirname, 'public/index.scss'), resolve(__dirname, 'public/index.css')].find(p => existsSync(p)),
      hacks: [resolve(__dirname, 'public/legacy')],
      injectDefaultVars: server => ({ transformVisOptions: server.config().get('transform_vis') }),
    },
    init: (server: Legacy.Server) => ({}),
    config(Joi: any) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        allow_unsafe: Joi.boolean().default(false),
      }).default();
    },
  } as Legacy.PluginSpecOptions);

// eslint-disable-next-line import/no-default-export
export default transformPluginInitializer;
