import express from 'express';
import { prisma } from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();


// Get all customers
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { search } = req.query;
        let where = {};
        if (search) {
            where = {
                OR: [
                    { name: { contains: String(search), mode: 'insensitive' } },
                    { email: { contains: String(search), mode: 'insensitive' } },
                    { mobile: { contains: String(search) } }
                ]
            };
        }
        const customers = await prisma.customer.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// Create a customer
router.post('/', authenticateToken, requireRole(['ADMIN', 'SALES']), async (req, res) => {
    try {
        const customer = await prisma.customer.create({
            data: req.body
        });
        res.status(201).json(customer);
    } catch (err) {
        res.status(400).json({ error: 'Failed to create customer' });
    }
});

// Update a customer
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'SALES']), async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await prisma.customer.update({
            where: { id: String(id) },
            data: req.body
        });
        res.json(customer);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update customer' });
    }
});

export default router;
