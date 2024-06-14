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
 * pipeline-portspec.js
 * Specification (requirements) of a port of a node of a pipeline
 */

import { SpeedyPipelineMessage, SpeedyPipelineMessageType } from './pipeline-message';
import { Utils } from '../../utils/utils';

/**
 * A message constraint is a message validation predicate
 * @typedef {function(SpeedyPipelineMessage): boolean} SpeedyPipelineMessageConstraint
 */

/**
 * A validation predicate that validates all messages
 * @type {SpeedyPipelineMessageConstraint}
 */
const always = message => true;

/**
 * Specification (requirements) of a port of a node of a pipeline
 */
export class SpeedyPipelinePortSpec
{
    /**
     * Constructor
     * @param {SpeedyPipelineMessageType} expectedMessageType expected message type
     * @param {SpeedyPipelineMessageConstraint} [messageConstraint] message validation function
     */
    constructor(expectedMessageType, messageConstraint = always)
    {
        /** @type {SpeedyPipelineMessageType} expected message type */
        this._expectedMessageType = expectedMessageType;

        /** @type {SpeedyPipelineMessageConstraint} message validation function */
        this._isValidMessage = (typeof messageConstraint === 'function') ? messageConstraint : always;


        // expect a valid type
        Utils.assert(this._expectedMessageType != SpeedyPipelineMessageType.Nothing);
    }

    /**
     * Checks if two specs have the same expected type
     * @param {SpeedyPipelinePortSpec} spec
     * @returns {boolean}
     */
    isCompatibleWith(spec)
    {
        return this._expectedMessageType == spec._expectedMessageType;
    }

    /**
     * Is the given message accepted by a port that abides by this specification?
     * @param {SpeedyPipelineMessage} message
     * @returns {boolean}
     */
    accepts(message)
    {
        return message.hasType(this._expectedMessageType) && this._isValidMessage(message);
    }

    /**
     * Convert to string
     * @returns {string}
     */
    toString()
    {
        const type = Object.keys(SpeedyPipelineMessageType).find(
            type => SpeedyPipelineMessageType[type] === this._expectedMessageType
        );

        return `Port expects ${type} satisfying ${this._isValidMessage}`;
    }

    /**
     * Expected message type
     * @returns {SpeedyPipelineMessageType}
     */
    get expectedMessageType()
    {
        return this._expectedMessageType;
    }
}