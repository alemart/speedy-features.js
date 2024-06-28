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
 * score-findmax.glsl
 * Scan an entire corners image and find the maximum score
 */

@include "float16.glsl"

uniform sampler2D corners;
uniform int iterationNumber; // 0, 1, 2, 3...

//
// Output format: (after M passes)
// output.rb = max_score (of all corners)
//
// When iterationNumber is zero, it is assumed that
// corners.rb is that of the corner image
//
// This algorithm takes M = ceil(log2 n) passes to run, where
// n = max(imageWidth, imageHeight)
//
void main()
{
    ivec2 thread = threadLocation();
    ivec2 bounds = outputSize();

    int jump = (1 << iterationNumber);
    int clusterLength = jump << 1;
    int clusterMask = clusterLength - 1;
    ivec2 clusterPos = ivec2(thread >> (1 + iterationNumber)) << (1 + iterationNumber);

    ivec2 next1 = clusterPos + ((thread - clusterPos + ivec2(jump, 0)) & clusterMask);
    ivec2 next2 = clusterPos + ((thread - clusterPos + ivec2(0, jump)) & clusterMask);
    ivec2 next3 = clusterPos + ((thread - clusterPos + ivec2(jump, jump)) & clusterMask);

    vec4 p0 = threadPixel(corners); //texelFetch(corners, thread, 0);
    vec4 p1 = texelFetch(corners, next1 % bounds, 0);
    vec4 p2 = texelFetch(corners, next2 % bounds, 0);
    vec4 p3 = texelFetch(corners, next3 % bounds, 0);

    float s0 = decodeFloat16(p0.rb);
    float s1 = decodeFloat16(p1.rb);
    float s2 = decodeFloat16(p2.rb);
    float s3 = decodeFloat16(p3.rb);

    bool b0 = s0 >= s1 && s0 >= s2 && s0 >= s3;
    bool b1 = s1 >= s0 && s1 >= s2 && s1 >= s3;
    bool b2 = s2 >= s0 && s2 >= s1 && s2 >= s3;
    //bool b3 = s3 >= s0 && s3 >= s1 && s3 >= s2;

    // color.rb := pi.rb, where i is such that si >= sj for all j
    color = vec4(0.0f);
    color.rb = b0 ? p0.rb : (
        b1 ? p1.rb : (
            b2 ? p2.rb : p3.rb
        )
    );
}