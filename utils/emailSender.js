import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();

// Create transporter with explicit Gmail settings
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Only for testing, remove in production
  },
});

// Email verification template
const verificationEmailTemplate = (verificationLink) => `
  <h2>Please verify your email</h2>
  <p>Click the link below to verify your email address:</p>
  <a href="${verificationLink}">${verificationLink}</a>
  <p>If you didn't create an account, please ignore this email.</p>
`;

export const sendVerificationEmail = async (email, verificationToken) => {
  const verificationLink = `${process.env.BASE_URL}/api/users/verify-email/${verificationToken}`;
  
  console.log('Constructed verification link:', verificationLink); // ADDED

  const mailOptions = {
    from: `"Qatar Tender" <${process.env.EMAIL_USERNAME}>`,
    to: email,
    subject: "Email Verification - Qatar Tender",
    html: verificationEmailTemplate(verificationLink),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId); // ADDED
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info)); // Only works with ethereal.email
  } catch (error) {
    console.error('Detailed email sending error:', error); // ADDED
    throw new Error("Failed to send verification email");
  }
};

export const generateVerificationToken = () => uuidv4();
