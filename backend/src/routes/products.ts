import express from 'express';
import { prisma } from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();


// Get all products
router.get('/', authenticateToken, async (req, res) => {
    try {
        const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Create a product
router.post('/', authenticateToken, requireRole(['ADMIN', 'WAREHOUSE']), async (req, res) => {
    try {
        const { name, sku, category, price, stock, minStock, location } = req.body;
        const product = await prisma.product.create({
            data: { name, sku, category, price, stock, minStock, location }
        });
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ error: 'Failed to create product', details: err });
    }
});

// Update a product
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'WAREHOUSE']), async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.update({
            where: { id: String(id) },
            data: req.body
        });
        res.json(product);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update product', details: err });
    }
});

// Log stock movement
router.post('/:id/movement', authenticateToken, requireRole(['ADMIN', 'WAREHOUSE']), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { quantity, type, reason } = req.body;

        // Using simple transaction to update stock
        const result = await prisma.$transaction(async (tx: any) => {
            const product = await tx.product.findUnique({ where: { id } });
            if (!product) throw new Error('Product not found');

            const newStock = type === 'IN' ? product.stock + quantity : product.stock - quantity;
            if (newStock < 0) throw new Error('Stock cannot go negative');

            const movement = await tx.stockMovement.create({
                data: {
                    productId: id,
                    quantity,
                    type,
                    reason,
                    createdBy: req.user.id
                }
            });

            const updatedProduct = await tx.product.update({
                where: { id },
                data: { stock: newStock }
            });

            return { movement, product: updatedProduct };
        });

        res.json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message || 'Failed to update stock' });
    }
});

export default router;
