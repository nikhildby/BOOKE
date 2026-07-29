// @ts-nocheck
import express from 'express';
import { prisma } from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();


// Get all challans
router.get('/', authenticateToken, async (req, res) => {
    try {
        const challans = await prisma.challan.findMany({
            orderBy: { createdAt: 'desc' },
            include: { customer: true, items: true }
        });
        res.json(challans);
    } catch (err: any) {
        console.error("GET CHALLANS ERROR:", err);
        res.status(500).json({ error: err.message || 'Failed to fetch challans' });
    }
});

// Create a challan
router.post('/', authenticateToken, requireRole(['ADMIN', 'SALES']), async (req: AuthRequest, res) => {
    try {
        const { customerId, items, status } = req.body;
        // status can be DRAFT or CONFIRMED
        // generate challan number
        const count = await prisma.challan.count();
        const challanNumber = `CHL-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        // Compute total qty
        const totalQty = items.reduce((acc: number, item: any) => acc + item.quantity, 0);

        const result = await prisma.$transaction(async (tx: any) => {
            // If confirmed, logic to reduce stock
            if (status === 'CONFIRMED') {
                for (const item of items) {
                    const product = await tx.product.findUnique({ where: { id: item.productId } });
                    if (!product) throw new Error(`Product ${item.productId} not found`);
                    if (product.stock < item.quantity) {
                        throw new Error(`Insufficient stock for product ${product.name}`);
                    }
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: product.stock - item.quantity }
                    });

                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            quantity: item.quantity,
                            type: 'OUT',
                            reason: `Sales Challan ${challanNumber}`,
                            createdBy: req.user?.id || 'Unknown'
                        }
                    });
                }
            }

            const challan = await tx.challan.create({
                data: {
                    challanNumber,
                    customerId,
                    totalQty,
                    status,
                    createdBy: req.user?.id || 'Unknown',
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            productSnapshot: JSON.stringify({ name: item.name, sku: item.sku }), // basic snapshot
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                },
                include: { items: true }
            });
            return challan;
        });

        res.status(201).json(result);
    } catch (err: any) {
        console.error("CRITICAL ERROR CREATING CHALLAN:", err);
        res.status(400).json({ error: err.message || 'Failed to create challan. View Backend logs.' });
    }
});

// Update Challan Status
router.put('/:id/status', authenticateToken, requireRole(['ADMIN', 'SALES']), async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status !== 'CONFIRMED') {
            return res.status(400).json({ error: 'Only transitions to CONFIRMED are supported' });
        }

        const challan = await prisma.challan.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!challan) throw new Error('Challan not found');
        if (challan.status === 'CONFIRMED') throw new Error('Challan is already confirmed');

        const result = await prisma.$transaction(async (tx: any) => {
            for (const item of challan.items) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (!product) throw new Error(`Product ${item.productId} not found`);
                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for product ${product.name}`);
                }
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: product.stock - item.quantity }
                });

                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        quantity: item.quantity,
                        type: 'OUT',
                        reason: `Sales Challan ${challan.challanNumber}`,
                        createdBy: req.user?.id || 'Unknown'
                    }
                });
            }

            const updated = await tx.challan.update({
                where: { id },
                data: { status: 'CONFIRMED' },
                include: { items: true }
            });
            return updated;
        });

        res.json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message || 'Failed to update challan' });
    }
});

router.put('/:id/cancel', requireRole(['ADMIN', 'SALES']), async (req: AuthRequest, res) => {
    const { id } = req.params;
    try {
        const challan = await prisma.challan.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!challan) return res.status(404).json({ error: 'Challan not found' });
        if (challan.status === 'CANCELLED') return res.status(400).json({ error: 'Challan already cancelled' });

        if (challan.status === 'DRAFT') {
            const updated = await prisma.challan.update({
                where: { id },
                data: { status: 'CANCELLED' }
            });
            return res.json(updated);
        }

        if (challan.status === 'CONFIRMED') {
            const result = await prisma.$transaction(async (tx: any) => {
                for (const item of challan.items) {
                    const prod = await tx.product.findUnique({ where: { id: item.productId } });
                    if (prod) {
                        await tx.product.update({
                            where: { id: prod.id },
                            data: { stock: prod.stock + item.quantity }
                        });

                        await tx.stockMovement.create({
                            data: {
                                productId: item.productId,
                                quantity: item.quantity,
                                type: 'IN',
                                reason: `Challan Cancelled: ${challan.challanNumber}`,
                                createdBy: req.user?.id || 'Unknown',
                            }
                        });
                    }
                }
                return tx.challan.update({
                    where: { id },
                    data: { status: 'CANCELLED' }
                });
            });
            return res.json(result);
        }
    } catch (err: any) {
        console.error("Cancellation error: ", err);
        res.status(500).json({ error: err.message || 'Internal server error while cancelling challan' });
    }
});

export default router;
