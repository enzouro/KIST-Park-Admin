import express from 'express';

import {
  createProcurement, deleteProcurement, getAllProcurements, getProcurementDetail, updateProcurement,
} from '../controller/procurement.controller.js';

const router = express.Router();

router
  .route('/')
  .get(getAllProcurements);

router
  .route('/:id')
  .get(getProcurementDetail);

router
  .route('/')
  .post(createProcurement);

router
  .route('/:id')
  .patch(updateProcurement);

router
  .route('/:id')
  .delete(deleteProcurement);

export default router;
