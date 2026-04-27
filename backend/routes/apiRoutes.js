const express = require('express');
const router = express.Router();
const validateCollection = require('../middlewares/validateCollection');
const authMiddleware = require('../middlewares/authMiddleware');
const collectionController = require('../controllers/collectionController');

router.get('/health', collectionController.health);

// Keep user signup and user list open for compatibility with legacy auth flows.
router.post('/users', validateCollection, collectionController.createCollectionItem);
router.get('/users', validateCollection, collectionController.listCollection);

router.use(authMiddleware);
router.get('/users/:id', validateCollection, collectionController.getCollectionItem);
router.put('/users/:id', validateCollection, collectionController.updateCollectionItem);
router.delete('/users/:id', validateCollection, collectionController.deleteCollectionItem);
router.get('/:collection', validateCollection, collectionController.listCollection);
router.get('/:collection/:id', validateCollection, collectionController.getCollectionItem);
router.post('/:collection', validateCollection, collectionController.createCollectionItem);
router.put('/:collection/:id', validateCollection, collectionController.updateCollectionItem);
router.delete('/:collection/:id', validateCollection, collectionController.deleteCollectionItem);

module.exports = router;
