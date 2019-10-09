import { resolve } from 'path';
import { existsSync } from 'fs';

export default function (kibana) {

  return new kibana.Plugin({
    require: ['elasticsearch'],
    name: 'transform_vis',
    publicDir: resolve(__dirname, 'public'),
    uiExports: {
      visTypes: [
        'plugins/transform_vis/transform_vis'
      ],
      injectDefaultVars: (server, options) => ({
          transformVisOptions: options
      }),
      styleSheetPaths: [resolve(__dirname, 'public/index.scss'), resolve(__dirname, 'public/index.css')].find(p => existsSync(p)),
    },
    config: (Joi) => Joi.object({
        enabled: Joi.boolean().default(true),
        allow_unsafe: Joi.boolean().default(false)
      }).default(),
  })
}
