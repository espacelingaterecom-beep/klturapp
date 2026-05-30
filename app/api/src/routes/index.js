import express from 'express';
import healthCheck from './health-check.js';
import orangeMoney from './orange-money.js';

const router = express.Router();

export default () => {
    router.get('/health', healthCheck);
    router.use('/orange-money', orangeMoney);

    return router;
};
