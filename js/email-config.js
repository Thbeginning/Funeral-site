// ================================================
// EmailJS Configuration
// ================================================
// Steps to set up:
// 1. Go to https://www.emailjs.com/ and create a FREE account
// 2. Add an Email Service (connect your Gmail or business email)
// 3. Create TWO Email Templates (see instructions below)
// 4. Fill in the values below

window.EMAIL_CONFIG = {
    // From EmailJS Dashboard > Account > API Keys
    PUBLIC_KEY: 'YOUR_PUBLIC_KEY',

    // From EmailJS Dashboard > Email Services (after connecting Gmail etc.)
    SERVICE_ID: 'YOUR_SERVICE_ID',

    // Template 1: Sent to the CUSTOMER with their invoice
    CUSTOMER_TEMPLATE_ID: 'YOUR_CUSTOMER_TEMPLATE_ID',

    // Template 2: Sent to YOU (admin) notifying of a new order
    ADMIN_TEMPLATE_ID: 'YOUR_ADMIN_TEMPLATE_ID',

    // Your business email - where admin notifications are sent
    ADMIN_EMAIL: 'contact@royalfuneralsupplies.com'
};
