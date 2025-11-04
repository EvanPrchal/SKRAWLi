// Singleton to store and manage canvas dimensions
class CanvasDimensions {
  private static instance: CanvasDimensions;
  private _width: number = 800;  // Default width
  private _height: number = 600; // Default height
  private _dpr: number = 1;      // Device pixel ratio

  private constructor() {}

  static getInstance(): CanvasDimensions {
    if (!CanvasDimensions.instance) {
      CanvasDimensions.instance = new CanvasDimensions();
    }
    return CanvasDimensions.instance;
  }

  updateDimensions(width: number, height: number, dpr: number = window.devicePixelRatio || 1) {
    this._width = width;
    this._height = height;
    this._dpr = dpr;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  get dpr() {
    return this._dpr;
  }
}

export const canvasDimensions = CanvasDimensions.getInstance();