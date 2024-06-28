/**
 * SpeedyProgramGroup
 * A semantically correlated group
 * of programs that run on the GPU
 * @abstract
 */
export class SpeedyProgramGroup {
    /**
     * Class constructor
     * @protected
     * @param {SpeedyGPU} gpu
     */
    protected constructor();
    /** @type {SpeedyGPU} GPU-accelerated routines */
    _gpu: SpeedyGPU;
    /** @type {SpeedyProgram[]} the list of all programs that belong to this group */
    _programs: SpeedyProgram[];
    /**
     * Declare a program
     * @protected
     * @param {string} name Program name
     * @param {ShaderDeclarationBuilder} builder Builder of a ShaderDeclaration
     * @param {SpeedyProgramOptions} [options] Program settings
     * @returns {this}
     */
    protected declare(name: string, builder: ShaderDeclarationBuilder, options?: import("./speedy-program").SpeedyProgramOptions | undefined): this;
    /**
     * Neat helpers to be used when declaring programs
     * @returns {SpeedyProgramHelpers}
     */
    get program(): SpeedyProgramHelpers;
    /**
     * Releases all programs from this group
     * @returns {null}
     */
    release(): null;
    /**
     * Spawn a SpeedyProgram
     * @param {ShaderDeclaration} shaderdecl Shader declaration
     * @param {SpeedyProgramOptions} [options] Program settings
     * @returns {SpeedyProgram}
     */
    _createProgram(shaderdecl: ShaderDeclaration, options?: import("./speedy-program").SpeedyProgramOptions | undefined): SpeedyProgram;
}
export type SpeedyProgramOptions = import('./speedy-program').SpeedyProgramOptions;
export type SpeedyProgramHelpers = {
    usesPingpongRendering: () => SpeedyProgramOptions;
    rendersToCanvas: () => SpeedyProgramOptions;
};
import { SpeedyGPU } from "./speedy-gpu";
import { SpeedyProgram } from "./speedy-program";
import { ShaderDeclarationBuilder } from "./shader-declaration";
import { ShaderDeclaration } from "./shader-declaration";
