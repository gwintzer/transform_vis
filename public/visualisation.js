export function VisualizationProvider(Private, transformVisOptions, serviceSettings, $rootScope) {

  return class Visualisation {

    constructor(el, vis) {
      this.vis = vis;
      this.el = el;
      this.container = document.createElement('div');
      this.container.className = 'output-vis';
      this.el.appendChild(this.container);
      this.root = this.container.createShadowRoot();
    }

    render(visData, status) {
      return new Promise(resolve => {
        this.root.innerHTML = visData.html;
        if (typeof visData.after_render === "function") { visData.after_render.bind(this)(); }
        resolve('done rendering');
      });
    }

    destroy() {
      this.el.innerHTML = '';
    }

  };
}
