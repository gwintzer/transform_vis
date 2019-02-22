import { uiModules } from 'ui/modules';

const module = uiModules.get('kibana/transform_vis', ['kibana']);
module.controller('TransformVisEditorController', ($scope, transformVisOptions) => {

  return new (class TransformVisEditorController {
    constructor() {
      $scope.options = transformVisOptions
    }
  })();

});