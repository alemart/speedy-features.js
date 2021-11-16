/**
 * @typedef {object} SpeedyProgramOptions
 * @property {boolean} [renderToTexture] render results to a texture?
 * @property {boolean} [pingpong] alternate output texture between calls
 */
/** @typedef {number|number[]|boolean|boolean[]|SpeedyTexture} SpeedyProgramUniformValue */
/**
 * A SpeedyProgram is a Function that
 * runs GPU-accelerated GLSL code
 */
export class SpeedyProgram extends Function {
    /**
     * Compile and link GLSL shaders
     * @param {WebGL2RenderingContext} gl
     * @param {string} vertexShaderSource GLSL code of the vertex shader
     * @param {string} fragmentShaderSource GLSL code of the fragment shader
     * @returns {WebGLProgram}
     */
    static _compile(gl: WebGL2RenderingContext, vertexShaderSource: string, fragmentShaderSource: string): WebGLProgram;
    /**
     * Creates a new SpeedyProgram
     * @param {WebGL2RenderingContext} gl WebGL context
     * @param {ShaderDeclaration} shaderdecl Shader declaration
     * @param {SpeedyProgramOptions} [options] user options
     */
    constructor(gl: WebGL2RenderingContext, shaderdecl: ShaderDeclaration, options?: SpeedyProgramOptions);
    /** @type {SpeedyProgram} this function bound to this function! */
    _self: SpeedyProgram;
    /**
     * Initialize the SpeedyProgram
     * @param {WebGL2RenderingContext} gl WebGL context
     * @param {ShaderDeclaration} shaderdecl Shader declaration
     * @param {SpeedyProgramOptions} options user options
     */
    _init(gl: WebGL2RenderingContext, shaderdecl: ShaderDeclaration, options: SpeedyProgramOptions): void;
    /** @type {WebGL2RenderingContext} */
    _gl: WebGL2RenderingContext;
    /** @type {WebGLProgram} vertex shader + fragment shader */
    _program: WebGLProgram;
    /** @type {ProgramGeometry} this is a quad */
    _geometry: ProgramGeometry;
    /** @type {string[]} names of the arguments of the SpeedyProgram */
    _argnames: string[];
    /** @type {boolean[]} tells whether the i-th argument of the SpeedyProgram is an array or not */
    _argIsArray: boolean[];
    /** @type {UBOHelper} UBO helper (lazy instantiation) */
    _ubo: UBOHelper;
    /** @type {boolean} should we render to a texture? If false, we render to the canvas */
    _renderToTexture: boolean;
    /** @type {number} width of the output */
    _width: number;
    /** @type {number} height of the output */
    _height: number;
    /** @type {SpeedyDrawableTexture[]} output texture(s) */
    _texture: SpeedyDrawableTexture[];
    /** @type {number} used for pingpong rendering */
    _textureIndex: number;
    /** @type {Map<string,UniformVariable>} uniform variables */
    _uniform: Map<string, UniformVariable>;
    /**
     * Run the SpeedyProgram
     * @param  {...SpeedyProgramUniformValue} args
     * @returns {SpeedyDrawableTexture}
     */
    _call(...args: SpeedyProgramUniformValue[]): SpeedyDrawableTexture;
    /**
     * Set the output texture(s) and its (their) shape(s)
     * @param {number} width new width, in pixels
     * @param {number} height new height, in pixels
     * @param  {...SpeedyDrawableTexture|null} texture output texture(s)
     * @returns {SpeedyProgram} this
     */
    outputs(width: number, height: number, ...texture: (SpeedyDrawableTexture | null)[]): SpeedyProgram;
    /**
     * Set the size of the output
     * @param {number} width new width, in pixels
     * @param {number} height new height, in pixels
     * @returns {SpeedyProgram} this
     */
    _setOutputSize(width: number, height: number): SpeedyProgram;
    /**
     * Use the provided texture(s) as output
     * @param {...SpeedyDrawableTexture} texture set to null to use the internal texture(s)
     * @returns {SpeedyProgram} this
     */
    _setOutputTexture(...texture: SpeedyDrawableTexture[]): SpeedyProgram;
    /**
     * Clear the internal textures
     * @returns {SpeedyDrawableTexture}
     */
    clear(): SpeedyDrawableTexture;
    /**
     * Set data using a Uniform Buffer Object
     * @param {string} blockName uniform block name
     * @param {ArrayBufferView} data
     */
    setUBO(blockName: string, data: ArrayBufferView): void;
    /**
     * Release the resources associated with this SpeedyProgram
     * @returns {null}
     */
    release(): null;
    /**
     * Helper method for pingpong rendering: alternates
     * the texture index from 0 to 1 and vice-versa
     */
    _pingpong(): void;
}
/**
 * Configure and store the VAO and the VBOs
 */
export type LocationOfAttributes = {
    position: number;
    texCoord: number;
};
/**
 * Configure and store the VAO and the VBOs
 */
export type BufferOfAttributes = {
    position: WebGLBuffer;
    texCoord: WebGLBuffer;
};
export type UBOStuff = {
    buffer: WebGLBuffer;
    /**
     * "global" binding index
     */
    blockBindingIndex: number;
    /**
     * UBO "location" in the program
     */
    blockIndex: number;
    /**
     * user-data
     */
    data: ArrayBufferView | null;
};
export type SpeedyProgramOptions = {
    /**
     * render results to a texture?
     */
    renderToTexture?: boolean;
    /**
     * alternate output texture between calls
     */
    pingpong?: boolean;
};
export type SpeedyProgramUniformValue = number | number[] | boolean | boolean[] | SpeedyTexture;
import { ShaderDeclaration } from "./shader-declaration";
/**
 * Configure and store the VAO and the VBOs
 * @param {WebGL2RenderingContext} gl
 * @param {LocationOfAttributes} location
 * @returns {ProgramGeometry}
 *
 * @typedef {Object} LocationOfAttributes
 * @property {number} position
 * @property {number} texCoord
 *
 * @typedef {Object} BufferOfAttributes
 * @property {WebGLBuffer} position
 * @property {WebGLBuffer} texCoord
 */
declare function ProgramGeometry(gl: WebGL2RenderingContext, location: LocationOfAttributes): ProgramGeometry;
declare class ProgramGeometry {
    /**
     * Configure and store the VAO and the VBOs
     * @param {WebGL2RenderingContext} gl
     * @param {LocationOfAttributes} location
     * @returns {ProgramGeometry}
     *
     * @typedef {Object} LocationOfAttributes
     * @property {number} position
     * @property {number} texCoord
     *
     * @typedef {Object} BufferOfAttributes
     * @property {WebGLBuffer} position
     * @property {WebGLBuffer} texCoord
     */
    constructor(gl: WebGL2RenderingContext, location: LocationOfAttributes);
    /** @type {WebGLVertexArrayObject} Vertex Array Object */
    vao: WebGLVertexArrayObject;
    /** @type {BufferOfAttributes} Vertex Buffer Objects */
    vbo: BufferOfAttributes;
    /** @type {WebGL2RenderingContext} */
    _gl: WebGL2RenderingContext;
    /**
     * Releases the internal resources
     * @returns {null}
     */
    release(): null;
}
/**
 * @typedef {object} UBOStuff
 * @property {WebGLBuffer} buffer
 * @property {number} blockBindingIndex "global" binding index
 * @property {number} blockIndex UBO "location" in the program
 * @property {ArrayBufferView|null} data user-data
 */
/**
 * A helper class for handling Uniform Buffer Objects (UBOs)
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 */
declare function UBOHelper(gl: WebGL2RenderingContext, program: WebGLProgram): void;
declare class UBOHelper {
    /**
     * @typedef {object} UBOStuff
     * @property {WebGLBuffer} buffer
     * @property {number} blockBindingIndex "global" binding index
     * @property {number} blockIndex UBO "location" in the program
     * @property {ArrayBufferView|null} data user-data
     */
    /**
     * A helper class for handling Uniform Buffer Objects (UBOs)
     * @param {WebGL2RenderingContext} gl
     * @param {WebGLProgram} program
     */
    constructor(gl: WebGL2RenderingContext, program: WebGLProgram);
    /** @type {WebGL2RenderingContext} */
    _gl: WebGL2RenderingContext;
    /** @type {WebGLProgram} */
    _program: WebGLProgram;
    /** @type {number} auto-increment counter */
    _nextIndex: number;
    /** @type {Object<string,UBOStuff>} UBO dictionary indexed by uniform block names */
    _ubo: {
        [x: string]: UBOStuff;
    };
    /**
     * Set Uniform Buffer Object data
     * (the buffer will be uploaded when the program is executed)
     * @param {string} name uniform block name
     * @param {ArrayBufferView} data
     */
    set(name: string, data: ArrayBufferView): void;
    /**
     * Update UBO data
     * Called when we're using the appropriate WebGLProgram
     */
    update(): void;
    /**
     * Release allocated buffers
     * @returns {null}
     */
    release(): null;
}
import { SpeedyDrawableTexture } from "./speedy-texture";
/**
 * Helper class for storing data in GLSL uniform variables
 * @param {string} type
 * @param {WebGLUniformLocation} location
 */
declare function UniformVariable(type: string, location: WebGLUniformLocation): void;
declare class UniformVariable {
    /**
     * Helper class for storing data in GLSL uniform variables
     * @param {string} type
     * @param {WebGLUniformLocation} location
     */
    constructor(type: string, location: WebGLUniformLocation);
    /** @type {string} GLSL data type */
    type: string;
    /** @type {WebGLUniformLocation} uniform location in a WebGL program */
    location: WebGLUniformLocation;
    /** @type {string} setter function */
    setter: string;
    /** @type {number} is the uniform a scalar (0), a vector (1) or a matrix (2)? */
    dim: number;
    /** @type {number} required number of scalars */
    length: number;
    /** @type {SpeedyProgramUniformValue|null} cached value */
    _value: SpeedyProgramUniformValue | null;
    /**
     * Set the value of a uniform variable
     * @param {WebGL2RenderingContext} gl
     * @param {SpeedyProgramUniformValue} value use column-major format for matrices
     * @param {number} [texNo] current texture index
     * @returns {number} new texture index
     */
    setValue(gl: WebGL2RenderingContext, value: SpeedyProgramUniformValue, texNo?: number): number;
}
import { SpeedyTexture } from "./speedy-texture";
export {};
//# sourceMappingURL=speedy-program.d.ts.map