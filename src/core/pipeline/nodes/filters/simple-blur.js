/*
 * speedy-vision.js
 * GPU-accelerated Computer Vision for JavaScript
 * Copyright 2021 Alexandre Martins <alemartf(at)gmail.com>
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
 * simple-blur.js
 * Simple Blur (Box Filter)
 */

import { SpeedyPipelineNode } from '../../pipeline-node';
import { SpeedyPipelineMessageType, SpeedyPipelineMessageWithImage } from '../../pipeline-message';
import { InputPort, OutputPort } from '../../pipeline-portbuilder';
import { SpeedyGPU } from '../../../../gpu/speedy-gpu';
import { SpeedyTexture } from '../../../../gpu/speedy-texture';
import { SpeedySize } from '../../../math/speedy-size';
import { Utils } from '../../../../utils/utils';
import { ImageFormat } from '../../../../utils/types';
import { NotSupportedError, NotImplementedError } from '../../../../utils/errors';
import { SpeedyPromise } from '../../../../utils/speedy-promise';

/**
 * Simple Blur (Box Filter)
 */
export class SpeedyPipelineNodeSimpleBlur extends SpeedyPipelineNode
{
    /**
     * Constructor
     * @param {string} [name] name of the node
     */
    constructor(name = undefined)
    {
        super(name, [
            InputPort().expects(SpeedyPipelineMessageType.Image),
            OutputPort().expects(SpeedyPipelineMessageType.Image),
        ]);

        /** @type {SpeedySize} size of the kernel (assumed to be square) */
        this._kernelSize = new SpeedySize(5,5);
    }

    /**
     * Size of the kernel
     * @returns {SpeedySize}
     */
    get kernelSize()
    {
        return this._kernelSize;
    }

    /**
     * Size of the kernel
     * @param {SpeedySize} kernelSize
     */
    set kernelSize(kernelSize)
    {
        Utils.assert(kernelSize instanceof SpeedySize);

        const ksize = kernelSize.width;
        if(!(ksize == 3 || ksize == 5 || ksize == 7))
            throw new NotSupportedError(`Supported kernel sizes: 3x3, 5x5, 7x7`);
        else if(kernelSize.width != kernelSize.height)
            throw new NotSupportedError(`Use a square kernel`);

        this._kernelSize = kernelSize;
    }

    /**
     * Run the specific task of this node
     * @param {SpeedyGPU} gpu
     * @returns {void|SpeedyPromise<void>}
     */
    _run(gpu)
    {
        const { image, format } = this.input().read();
        const { width, height } = image;
        const ksize = this._kernelSize.width;
        const tex = gpu.texturePool.allocate();

        if(ksize == 3) {
            (gpu.programs.filters._box3x
                .useTexture(tex)
                .setOutputSize(width, height)
            )(image);

            (gpu.programs.filters._box3y
                .useTexture(this._outputTexture)
                .setOutputSize(width, height)
            )(tex);
        }
        else if(ksize == 5) {
            (gpu.programs.filters._box5x
                .useTexture(tex)
                .setOutputSize(width, height)
            )(image);

            (gpu.programs.filters._box5y
                .useTexture(this._outputTexture)
                .setOutputSize(width, height)
            )(tex);
        }
        else if(ksize == 7) {
            (gpu.programs.filters._box7x
                .useTexture(tex)
                .setOutputSize(width, height)
            )(image);

            (gpu.programs.filters._box7y
                .useTexture(this._outputTexture)
                .setOutputSize(width, height)
            )(tex);
        }
        else
            throw new NotSupportedError();

        gpu.texturePool.free(tex);
        this.output().swrite(this._outputTexture, format);
    }
}