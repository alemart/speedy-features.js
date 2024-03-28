/*
 * speedy-vision.js
 * GPU-accelerated Computer Vision for JavaScript
 * Copyright 2020-2023 Alexandre Martins <alemartf(at)gmail.com>
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
 * image-output.js
 * Gets an image out of a pipeline
 */

import { SpeedyPipelineNode, SpeedyPipelineSinkNode } from '../../pipeline-node';
import { SpeedyPipelineMessageType, SpeedyPipelineMessageWithImage } from '../../pipeline-message';
import { InputPort, OutputPort } from '../../pipeline-portbuilder';
import { SpeedyGPU } from '../../../../gpu/speedy-gpu';
import { SpeedyTexture } from '../../../../gpu/speedy-texture';
import { SpeedyMedia } from '../../../speedy-media';
import { SpeedyImageDataMediaSource, SpeedyMediaSource } from '../../../speedy-media-source';
import { Utils } from '../../../../utils/utils';
import { ImageFormat } from '../../../../utils/types';
import { SpeedyPromise } from '../../../speedy-promise';

/**
 * Gets an image out of a pipeline
 */
export class SpeedyPipelineNodeImageSink extends SpeedyPipelineSinkNode
{
    /**
     * Constructor
     * @param {string} [name] name of the node
     */
    constructor(name = 'image')
    {
        super(name, 0, [
            InputPort().expects(SpeedyPipelineMessageType.Image)
        ]);

        /** @type {ImageBitmap} output bitmap */
        this._bitmap = null;

        /** @type {ImageFormat} output format */
        this._format = ImageFormat.RGBA;
    }

    /**
     * Export data from this node to the user
     * @returns {SpeedyPromise<SpeedyMedia>}
     */
    export()
    {
        Utils.assert(this._bitmap != null);
        return SpeedyMedia.load(this._bitmap, { format: this._format }, false);
    }

    /**
     * Export data from this node to the user
     * @returns {SpeedyPromise<SpeedyMedia>}
     */

    exportImageData()
    {
        Utils.assert(this._bitmap != null);
        const newCanvas = Utils.createCanvas(this._bitmap.width, this._bitmap.height);
        const newContext = newCanvas.getContext('2d');
        newContext.drawImage(this._bitmap, 0, 0);
        let imageData = newContext.getImageData(0, 0, this._bitmap.width, this._bitmap.height);
        return SpeedyMedia.load(imageData);
    }

    /**
     * Run the specific task of this node
     * @param {SpeedyGPU} gpu
     * @returns {void|SpeedyPromise<void>}
     */
    _run(gpu)
    {
        const { image, format } = /** @type {SpeedyPipelineMessageWithImage} */ ( this.input().read() );

        return new SpeedyPromise(resolve => {
            const canvas = gpu.renderToCanvas(image);
            createImageBitmap(canvas, 0, canvas.height - image.height, image.width, image.height).then(bitmap => {
                this._bitmap = bitmap;
                this._format = format;
                resolve();
            });
        });
    }
}