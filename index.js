import { resolve } from 'path';
import { existsSync } from 'fs';

export default kibana => new kibana.Plugin({
  id: 'transform_vis',
  require: ['elasticsearch'],
  name: 'transform_vis',

  uiExports: {
    visTypes: ['plugins/transform_vis/transform_vis'],
    interpreter: ['plugins/transform_vis/transform_vis_fn'],
    injectDefaultVars: server => ({ transformVisOptions: server.config().get('transform_vis') }),
    styleSheetPaths: [resolve(__dirname, 'public/index.scss'), resolve(__dirname, 'public/index.css')].find(p => existsSync(p)),
  },

  config: Joi => Joi.object({
      enabled: Joi.boolean().default(true),
      allow_unsafe: Joi.boolean().default(false)
    }).default(),

});
