import { resolve } from 'path'

export default kibana => new kibana.Plugin({
    require: ['elasticsearch'],
    name: 'transform_vis',
    uiExports: {
      visTypes: [
        'plugins/transform_vis/transform_vis'
      ],
      injectDefaultVars: (server, options) => ({
          transformVisOptions: options
      }),
      styleSheetPaths: resolve(__dirname, 'public/transform_vis.scss'),
    },
    config: (Joi) => Joi.object({
        enabled: Joi.boolean().default(true),
        allow_unsafe: Joi.boolean().default(false)
      }).default(),
  });
