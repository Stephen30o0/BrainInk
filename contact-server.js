// Simple contact form handler using Nodemailer
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create transporter for Gmail
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || 'info.brainink@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
    },
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { fullName, workEmail, companyName, message } = req.body;

        // Validate required fields
        if (!fullName || !workEmail || !companyName || !message) {
            return res.status(400).json({
                error: 'All fields are required',
            });
        }

        // Email options
        const mailOptions = {
            from: process.env.GMAIL_USER || 'braininkedu@gmail.com',
            to: 'braininkedu@gmail.com',
            subject: `New Contact Form Submission from ${fullName}`,
            html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Full Name:</strong> ${fullName}</p>
        <p><strong>Work Email:</strong> ${workEmail}</p>
        <p><strong>Company Name:</strong> ${companyName}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>This message was sent from the BrainInk contact form.</em></p>
      `,
            replyTo: workEmail,
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: 'Email sent successfully',
        });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            error: 'Failed to send email',
            details: error.message,
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Contact form server running on port ${PORT}`);
});
