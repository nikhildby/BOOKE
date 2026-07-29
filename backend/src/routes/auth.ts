import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
        res.json({ token, role: user.role });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/seed', async (req, res) => {
    try {
        const existing = await prisma.user.findFirst();
        if (existing) {
            return res.status(400).json({ error: 'Database already seeded' });
        }
        const hash = await bcrypt.hash('admin123', 10);
        await prisma.user.create({
            data: {
                email: 'admin@booke.com',
                password_hash: hash,
                role: 'ADMIN'
            }
        });
        await prisma.product.create({
            data: { name: 'iPhone 15', sku: 'IP15-128', category: 'Electronics', price: 999, stock: 50, location: 'WH1' }
        });
        await prisma.customer.create({
            data: { name: 'John Doe', mobile: '1234567890', type: 'RETAIL', address: '123 Main St' }
        });
        res.json({ message: 'Seeded successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Seed failed', details: err });
    }
});

export default router;
