import { SpecialsProject, CANVAS_PRESETS } from './types';
import { v4 as uuidv4 } from 'uuid';

export const TEMPLATES: Partial<SpecialsProject>[] = [
    {
        name: 'Big Price Promotion',
        canvas_preset: 'landscape_1080',
        design_json: {
            backgroundColor: '#FF0000', // Red background
            nodes: [
                {
                    id: 't1',
                    type: 'text',
                    x: 100,
                    y: 100,
                    text: 'SPECIAL',
                    fontSize: 120,
                    fill: 'white',
                    fontFamily: 'Inter',
                    rotation: 0
                },
                {
                    id: 't2',
                    type: 'text',
                    x: 100,
                    y: 300,
                    text: '$9.99',
                    fontSize: 300,
                    fill: 'white',
                    fontFamily: 'Inter',
                    rotation: 0
                },
                {
                    id: 't3',
                    type: 'text',
                    x: 100,
                    y: 700,
                    text: 'Limited Time Only',
                    fontSize: 60,
                    fill: 'white',
                    fontFamily: 'Inter',
                    rotation: 0
                }
            ]
        }
    },
    {
        name: 'Portrait Notice',
        canvas_preset: 'portrait_1080',
        design_json: {
            backgroundColor: '#000000',
            nodes: [
                {
                    id: 't1',
                    type: 'text',
                    x: 50,
                    y: 200,
                    text: 'TODAY',
                    fontSize: 100,
                    fill: 'white',
                    fontFamily: 'Inter',
                    rotation: 0
                },
                {
                    id: 't2',
                    type: 'text',
                    x: 50,
                    y: 350,
                    text: 'WE ARE',
                    fontSize: 80,
                    fill: 'white',
                    fontFamily: 'Inter',
                    rotation: 0
                },
                {
                    id: 't3',
                    type: 'text',
                    x: 50,
                    y: 500,
                    text: 'OPEN',
                    fontSize: 200,
                    fill: '#FFFF00',
                    fontFamily: 'Inter',
                    rotation: 0
                }
            ]
        }
    }
];
