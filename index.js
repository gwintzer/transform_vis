import { resolve } from 'path';

export default kibana => new kibana.Plugin({
  id: 'transform_vis',
  require: ['elasticsearch'],
  name: 'transform_vis',

  uiExports: {
    visTypes: ['plugins/transform_vis/transform_vis'],
    interpreter: ['plugins/transform_vis/transform_vis_fn'],
    injectDefaultVars: server => ({ transformVisOptions: server.config().get('transform_vis') }),
    styleSheetPaths: resolve(__dirname, 'public/index.scss'),
  },

  config: Joi => Joi.object({
      enabled: Joi.boolean().default(true),
      allow_unsafe: Joi.boolean().default(false)
    }).default(),

});
