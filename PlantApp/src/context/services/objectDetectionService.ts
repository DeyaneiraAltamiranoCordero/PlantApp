import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { decode } from 'jpeg-js';
import { Buffer } from 'buffer';

let model: cocoSsd.ObjectDetection | null = null;

/**
 * Carga el modelo COCO-SSD de forma asíncrona.
 */
export const loadModel = async () => {
    if (model) return model;
    
    console.log("Cargando modelo de detección local (COCO-SSD)...");
    await tf.ready();
    model = await cocoSsd.load();
    console.log("Modelo local cargado correctamente.");
    return model;
};

/**
 * Convierte una imagen Base64 en un Tensor de TensorFlow.
 */
const imageToBuffer = (base64: string) => {
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    return Buffer.from(base64Data, 'base64');
};

/**
 * Analiza la imagen para detectar objetos (especialmente plantas).
 */
export const detectObjects = async (base64Image: string) => {
    try {
        if (!model) {
            await loadModel();
        }

        // 1. Decodificar la imagen JPEG
        const buffer = imageToBuffer(base64Image);
        const { width, height, data } = decode(buffer, { useTArray: true });

        // 2. Crear un tensor a partir de los datos de los píxeles
        const uint8Array = new Uint8Array(data);
        const imageTensor = tf.tensor3d(uint8Array, [height, width, 4], 'int32')
            .slice([0, 0, 0], [-1, -1, 3]); // Convertir de RGBA a RGB

        // 3. Ejecutar la detección
        const predictions = await model!.detect(imageTensor as any);
        
        // Liberar memoria del tensor
        imageTensor.dispose();

        // 4. Filtrar resultados (buscamos 'potted plant', 'plant', etc.)
        const plantDetections = predictions.filter(p => 
            p.class === 'potted plant' || p.class === 'plant' || p.class === 'broccoli' // a veces detecta plantas como brócoli
        );

        console.log("Detecciones locales:", predictions.map(p => `${p.class} (${Math.round(p.score * 100)}%)`));

        return {
            hasPlant: plantDetections.length > 0,
            allPredictions: predictions,
            plantBox: plantDetections.length > 0 ? plantDetections[0].bbox : null
        };

    } catch (error) {
        console.error("Error en la detección local:", error);
        return { hasPlant: true, allPredictions: [], error }; // Por seguridad, si falla, asumimos que puede haber una planta
    }
};
