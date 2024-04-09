import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.in',
    port: 465,
    secure: true,
    auth: {
        user: 'info@rubidya.com',
        pass: '1@Rubidya'
    }
});
