import { pool } from '../../lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if(!name || !email || !password) {
            return Response.json({ message: 'All fields are required' }, { status: 400 });
        }

        // check if user exists
        const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const users = existingUser as any[]
        if(users.length > 0) {
            return Response.json({ message: 'User already exists' }, { status: 400 });
        }

        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);
       
        await pool.query('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, hashedPassword]);

        return Response.json({ message: 'User registered successfully' }, { status: 201 });
        
    } catch (error) {
        console.error(error);
        return Response.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }

}