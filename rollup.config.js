import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import css from 'rollup-plugin-css-porter';
import cpy from 'rollup-plugin-cpy';
import copy from 'rollup-plugin-copy-assets';
import hash from 'rollup-plugin-hash';
import { terser } from 'rollup-plugin-terser';
import svelte from 'rollup-plugin-svelte';
import pkg from './package.json';

export default [
    {
        input: 'src/main.js',
        output: { 
            file: pkg.main,            
            format: 'iife',
            sourcemap: true,
            globals: {
                leaflet: 'L',
                moment: 'moment'
            },            
        },   
        external: ['leaflet', 'leaflet-geomixer', 'moment'], 
        plugins: [
            svelte(),
            resolve({jsnext: true, main: true, module: false, browser: false}),
            commonjs(),
            css({dest: 'dist/scanex-edda.css', minified: true}),
            copy({
                assets: [
                    './src/assets'
                ]
            }),
            cpy({
                files: [
                    'src/version/*',                                        
                    'src/fonts/*.woff',
                    'node_modules/scanex-auth/dist/*.png',
                    'node_modules/scanex-color-picker/dist/*.png',
                    'node_modules/scanex-datagrid/dist/*.png',
                    'node_modules/scanex-float-panel/dist/*.png',
                    'node_modules/scanex-search-input/dist/*.png',
                    'node_modules/leaflet-iconlayers/dist/*.png',
                ],
                dest: 'dist',                
            }),
            /*hash({
                dest: 'dist/scanex-edda.[hash].min.js',
                replace: true,                
            }),*/
            babel()
            // terser(),
        ],
    },
    {
        input: 'src/permalink.js',
        output: {
            file: 'dist/permalink.min.js',
            format: 'iife',
            sourcemap: true,
        },
        external: ['leaflet', 'leaflet-geomixer', 'moment'],
        plugins: [
            resolve({jsnext: true, main: true, module: false, browser: false}),
            commonjs(),  
            css({dest: 'dist/permalink.css', minified: true}), 
            /*hash({
                dest: 'dist/permalink.[hash].min.js',
                replace: true,                
            }),*/
            babel(),         
        ],
    }   
]; 