require('dotenv').config();
const jwt = require('jsonwebtoken');

async function run() {
  try {
    const token = jwt.sign(
      { user: { id: 'U194031', email: 'chayutwalunchodom.test@gmail.com' } },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const res = await fetch('http://localhost:3000/api/notifications', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('HTTP status:', res.status);
    const data = await res.json();
    console.log('Array?', Array.isArray(data));
    if (Array.isArray(data)) {
      console.log('Total notifications returned:', data.length);
      console.log('Sample item:', data[0]);
    } else {
      console.log('Response:', data);
    }
  } catch (err) {
    console.error('checkNotifications error:', err);
  } finally {
    process.exit(0);
  }
}

run();
