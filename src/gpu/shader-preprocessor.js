/*
 * speedy-vision.js
 * GPU-accelerated Computer Vision for JavaScript
 * Copyright 2020-2024 Alexandre Martins <alemartf(at)gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * shader-preprocessor.js
 * Custom preprocessor for shaders
 */

import { SpeedyGL } from './speedy-gl';
import { Utils } from '../utils/utils';
import { PixelComponent } from '../utils/types';
import { FileNotFoundError, ParseError } from '../utils/errors';

/** @typedef {Object<string,number>} ShaderPreprocessorTemplateOfConstants */
/** @typedef {import('./shader-declaration').ShaderDeclarationPreprocessorConstants} ShaderPreprocessorConstants */

// Import numeric globals
const globals = require('../utils/globals');
const numericGlobals = /** @type {ShaderPreprocessorTemplateOfConstants} */ (
    Object.keys(globals).filter(key => typeof globals[key] == 'number').reduce(
        (obj, key) => ((obj[key] = globals[key]), obj),
        {}
    )
);

/** @type {ShaderPreprocessorTemplateOfConstants} Constants available to all shaders */
const basicConstants = Object.freeze({
    // numeric globals
    ...numericGlobals,

    // fragment shader
    'FS_USE_CUSTOM_PRECISION': 0, // use default precision settings
    'FS_OUTPUT_TYPE': 0, // normalized RGBA

    // colors
    'PIXELCOMPONENT_RED': PixelComponent.RED,
    'PIXELCOMPONENT_GREEN': PixelComponent.GREEN,
    'PIXELCOMPONENT_BLUE': PixelComponent.BLUE,
    'PIXELCOMPONENT_ALPHA': PixelComponent.ALPHA,
});

/** @type {function(string,string):ShaderPreprocessorTemplateOfConstants} Platform-related constants available to all shaders */
const platformConstants = (platform, glRenderer) => Object.freeze({
    'APPLE': /(Mac|iOS|iPhone|iPad|iPod)/i.test(platform) | 0, // "MacIntel", "macOS", "iOS", "iPhone", "iPad"...
    'APPLE_GPU': /Apple/.test(glRenderer) | 0, // the renderer is always "Apple GPU" on Safari and on Epiphany at the time of this writing; on Chrome, it may be "Apple M1" for example...
    'INTEL_GRAPHICS': /Intel.*Graphics/.test(glRenderer) | 0, // Intel[(R)] ... [HD] Graphics xyz ...
});

// Regular Expressions
const commentsRegex = [ /\/\*(.|\s)*?\*\//g , /\/\/.*$/gm ];
const includeRegex = /^\s*@\s*include\s+"(.*?)"/gm;
const constantRegex = /@(\w+)@/g;
const unrollRegex = [
    /@\s*unroll\s+?for\s*\(\s*(int|)\s*(?<counter>\w+)\s*=\s*(-?\d+|\w+)\s*;\s*\k<counter>\s*(<=?)\s*(-?\d+|\w+)\s*;\s*\k<counter>\s*\+\+()\s*\)\s*\{\s*([\s\S]+?)\s*\}/g,
    /@\s*unroll\s+?for\s*\(\s*(int|)\s*(?<counter>\w+)\s*=\s*(-?\d+|\w+)\s*;\s*\k<counter>\s*(<=?)\s*(-?\d+|\w+)\s*;\s*\k<counter>\s*\+=\s*(-?\d+)\s*\)\s*\{\s*([\s\S]+?)\s*\}/g,
];

/**
 * Custom preprocessor for the shaders
 */
export class ShaderPreprocessor
{
    /**
     * Runs the preprocessor and generates GLSL code
     * @param {ShaderPreprocessorConstants} defines user-provided preprocessor constants for this shader
     * @param {string} infix annotated GLSL code
     * @param {string} [prefix]
     * @param {string} [suffix]
     * @returns {string} preprocessed GLSL code
     */
    static generateGLSL(defines, infix, prefix = null, suffix = null)
    {
        //
        // The preprocessor will remove comments from GLSL code,
        // include requested GLSL files and import global constants
        // defined for all shaders (see above)
        //
        const errors = []; // compile-time errors
        const constants = generateConstants(defines);
        const annotatedGLSL = generateUnprocessedGLSL(defines, infix, prefix, suffix);

        return unrollLoops(
            annotatedGLSL
                .replace(commentsRegex[0], '')
                .replace(commentsRegex[1], '')
                .replace(constantRegex, (_, name) => String(
                    // Replace preprocessor @CONSTANTS@ by their numeric values
                    constants.has(name) ? Number(constants.get(name)) : (
                        errors.push(`Undefined constant ${name}`), 0
                    )
                ))
                .replace(includeRegex, (_, filename) =>
                    // Included files may include other files.
                    // XXX no cycle detection!
                    ShaderPreprocessor.generateGLSL(defines, readfileSync(filename))
                ),
            defines
        ) + errors.map(msg => `\n#error ${msg}\n`).join('');
    }
}

/**
 * Generate GLSL code based on the input arguments
 * @param {ShaderPreprocessorConstants} defines
 * @param {string} infix
 * @param {string} [prefix]
 * @param {string} [suffix]
 * @returns {string} GLSL code
 */
function generateUnprocessedGLSL(defines, infix, prefix = null, suffix = null)
{
    const parts = [];

    if(prefix !== null)
        parts.push(prefix);

    for(const [key, value] of defines)
        parts.push(`#define ${key} ${Number(value)}`);

    parts.push(infix);

    if(suffix !== null)
        parts.push(suffix);

    return parts.join('\n');
}

/**
 * Generate pre-processor constants. Constants provided by the
 * user have higher priority than globally available constants.
 * @param {ShaderPreprocessorConstants} defines user-provided
 * @returns {ShaderPreprocessorConstants}
 */
function generateConstants(defines)
{
    Utils.assert(SpeedyGL.isInitialized());

    const myConstants = /** @type {ShaderPreprocessorConstants} */ ( new Map() );
    const globalConstants = Object.assign(Object.create(null),
        basicConstants,
        platformConstants(Utils.platformString(), SpeedyGL.instance.renderer)
    );

    // globally available constants have lower priority
    for(const key in globalConstants) {
        //if(Object.prototype.hasOwnProperty.call(globalConstants, key))
            myConstants.set(key, globalConstants[key]);
    }

    // user-defined constants have higher priority
    for(const [key, value] of defines)
        myConstants.set(key, value);

    // done!
    return myConstants;
}

 /**
 * Reads a shader from the shaders/include/ folder
 * @param {string} filename
 * @returns {string}
 */
function readfileSync(filename)
{
    if(String(filename).match(/^[a-zA-Z0-9_-]+\.glsl$/))
        return require('./shaders/include/' + filename);

    throw new FileNotFoundError(`Shader preprocessor: can't read file "${filename}"`);
}

/**
 * Unroll for loops in our own preprocessor
 * @param {string} code
 * @param {ShaderPreprocessorConstants} defines
 * @returns {string}
 */
function unrollLoops(code, defines)
{
    //
    // Currently, only integer for loops with positive step values
    // can be unrolled. (TODO: negative step values?)
    //
    // The current implementation does not support curly braces
    // inside unrolled loops. You may define macros to get around
    // this, but do you actually need to unroll such loops?
    //
    // Loops that don't fit the supported pattern will crash
    // the preprocessor if you try to unroll them.
    //
    const fn = unroll.bind(defines); // CRAZY!
    const n = unrollRegex.length;

    for(let i = 0; i < n; i++)
        code = code.replace(unrollRegex[i], fn);

    return code;
}

/**
 * Unroll a loop pattern (regexp)
 * @param {string} match the matched for loop
 * @param {string} type
 * @param {string} counter
 * @param {string} start
 * @param {string} cmp
 * @param {string} end
 * @param {string} step
 * @param {string} loopcode
 * @returns {string} unrolled loop
 */
function unroll(match, type, counter, start, cmp, end, step, loopcode)
{
    const defines = /** @type {ShaderPreprocessorConstants} */ ( this );

    // check if the loop limits are numeric constants or #defined numbers from the outside
    const hasStart = Number.isFinite(+start) || defines.has(start);
    const hasEnd = Number.isFinite(+end) || defines.has(end);
    if(!hasStart || !hasEnd) {
        if(defines.size > 0)
            throw new ParseError(`Can't unroll loop: unknown limits (start=${start}, end=${end}). Code:\n\n${match}`);
        else
            return match; // don't unroll now, because defines is empty - maybe we'll succeed in the next pass
    }

    // parse and validate limits & step
    let istart = defines.has(start) ? defines.get(start) : parseInt(start);
    let iend = defines.has(end) ? defines.get(end) : parseInt(end);
    let istep = (step.length == 0) ? 1 : parseInt(step);
    Utils.assert(istart <= iend && istep > 0);

    /*
    // debug
    console.log(`Encontrei "${match}"`);
    console.log(`type="${type}"`);
    console.log(`counter="${counter}"`);
    console.log(`start="${start}"`);
    console.log(`cmp="${cmp}"`);
    console.log(`end="${end}"`);
    console.log(`step="${step}"`);
    console.log(`loopcode="${loopcode}"`)
    console.log('Defines:', defines);
    */

    // continue statements are not supported inside unrolled loops
    // and will generate a compiler error. Using break is ok.
    const hasBreak = (loopcode.match(/\bbreak\s*;/) !== null);

    // create a new scope
    let unrolledCode = hasBreak ? 'switch(1) { default:\n' : '{\n';

    // declare counter
    unrolledCode += `${type} ${counter};\n`;

    // unroll loop
    iend += (cmp == '<=') ? 1 : 0;
    for(let i = istart; i < iend; i += istep)
        unrolledCode += `{\n${counter} = ${i};\n${loopcode}\n}\n`;

    // close scope
    unrolledCode += '}\n';
    //console.log('Unrolled code:\n\n' + unrolledCode);

    // done!
    return unrolledCode;
}
