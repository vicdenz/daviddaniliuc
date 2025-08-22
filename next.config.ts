import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    sassOptions: {
        silenceDeprecations: ['legacy-js-api'],
    },
	experimental: {
        turbo: {
            rules: {
                '*.{glsl,vs,fs,vert,frag}': {
                    loaders: ['raw-loader', 'glslify-loader'],
                    as: '*.js',
                },
            },
        },
    },

};

export default nextConfig;