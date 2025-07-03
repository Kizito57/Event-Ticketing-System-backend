import nodemailer from 'nodemailer';
import 'dotenv/config';

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

// Send verification email
export const sendVerificationEmail = async (
    userEmail: string,
    userName: string,
    verificationCode: string
): Promise<boolean> => {

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ Email credentials not found in environment variables');
        return false;
    }

    try {
        const transporter = createTransporter();

        console.log(`📧 Sending verification email to: ${userEmail}`);

        const mailOptions = {
            from: {
                name: 'Car Rental System',
                address: process.env.EMAIL_USER as string
            },
            to: userEmail,
            subject: 'Verify Your Email - Car Rental System 🚗',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1>🚗 Email Verification</h1>
                        <p>Car Rental System</p>
                    </div>

                    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                        <p><strong>Hello ${userName}!</strong></p>
                        <p>Thank you for registering with our car rental service. To complete your registration, please verify your email address.</p>

                        <div style="background: white; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
                            <p><strong>Your verification code is:</strong></p>
                            <h2 style="color: #667eea; font-size: 32px; letter-spacing: 5px; margin: 10px 0;">${verificationCode}</h2>
                        </div>

                        <p>Please enter this code on the verification page to activate your account.</p>
                        <p>If you didn't create an account, please ignore this email.</p>
                        <p>Best regards,<br><strong>The Car Rental Team</strong></p>
                    </div>
                </div>
            `,
            text: `Hello ${userName}! Your verification code is: ${verificationCode}. Please enter this code to verify your email address. If you didn't create an account, please ignore this email.`
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent successfully to ${userEmail}`);
        return true;

    } catch (error: any) {
        console.error('❌ Failed to send verification email:', error.message);
        return false;
    }
};

// Send welcome email
export const sendWelcomeEmail = async (
    userEmail: string,
    userName: string
): Promise<boolean> => {

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ Email credentials not found in environment variables');
        return false;
    }

    try {
        const transporter = createTransporter();

        console.log(`📧 Sending welcome email to: ${userEmail}`);

        const mailOptions = {
            from: {
                name: 'Car Rental System',
                address: process.env.EMAIL_USER as string
            },
            to: userEmail,
            subject: 'Welcome to Car Rental System! 🚗',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1>🚗 Welcome to Car Rental System!</h1>
                        <p>Your journey starts here</p>
                    </div>

                    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                        <p><strong>Hello ${userName}!</strong></p>
                        <p>Thank you for joining our car rental family! We're excited to help you with your transportation needs.</p>
                        <p>Your email has been verified and you can now log in to your account and start exploring our available vehicles.</p>
                        <p>Safe travels,<br><strong>The Car Rental Team</strong></p>
                    </div>
                </div>
            `,
            text: `Welcome ${userName}! Thank you for joining our car rental family! Your email has been verified and you can now log in and start exploring our vehicles. Safe travels!`
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Welcome email sent successfully to ${userEmail}`);
        return true;

    } catch (error: any) {
        console.error('❌  Failed to send welcome email:', error.message);
        return false;
    }
};
