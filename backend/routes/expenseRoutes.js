const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/ExpenseController');

router.get('/', expenseController.getAllExpenses);
router.post('/', expenseController.createExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
