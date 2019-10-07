import { resolve } from 'path';

    require: ['elasticsearch'],
    name: 'transform_vis',
    uiExports: {
      visTypes: [
        'plugins/transform_vis/transform_vis'
      ],
      injectDefaultVars: (server, options) => ({
          transformVisOptions: options
      }),
      },
      styleSheetPaths: resolve(__dirname, 'public/index.scss'),
    },
    config: (Joi) => Joi.object({
        enabled: Joi.boolean().default(true),
        allow_unsafe: Joi.boolean().default(false)
      }).default(),
  });
