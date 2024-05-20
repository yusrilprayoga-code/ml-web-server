const { Firestore } = require('@google-cloud/firestore');

const predictClassification = require('../services/inferenceService');
const crypto = require('crypto');

const storeData = require('../services/storeData');
 
async function postPredictHandler(request, h) {
  const { image } = request.payload;
  const { model } = request.server.app;
 
  const { confidenceScore, label, suggestion } = await predictClassification(model, image);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
 
  const data = {
    "id": id,
    "result": label,
    "suggestion": suggestion,
    "confidenceScore": confidenceScore,
    "createdAt": createdAt
  }

    await storeData(id, data);

  const response = h.response({
    status: 'success',
    message: confidenceScore > 99 ? 'Model is predicted successfully' : 'Model is predicted successfully',
    data
  })
    response.code(201);
    return response;
}

const getHistoriesHandler = async (request, h) => {
  const db = new Firestore();
  const predictCollection = db.collection('predictions');

  try {
    const snapshot = await predictCollection.get();
    const histories = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        history: {
          result: data.result,
          createdAt: data.createdAt,
          suggestion: data.suggestion,
          id: data.id 
        }
      };
    });

    const response = h.response({
      status: 'success',
      data: histories 
    });
    response.code(200);
    return response;
  } catch (error) {
    const response = h.response({
      status: 'error',
      message: error.message
    });
    response.code(500);
    return response;
  }
};

module.exports = { postPredictHandler, getHistoriesHandler };